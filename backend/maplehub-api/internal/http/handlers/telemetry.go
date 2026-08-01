package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

const (
	maxTelemetryBodyBytes = 128 * 1024
	maxTelemetryBatch     = 20
)

var telemetryTokenPattern = regexp.MustCompile(`^[a-z0-9._:/<>+-]{1,120}$`)

type TelemetryHandler struct {
	Repo       repo.TelemetryRepo
	HashSecret string
}

type telemetryBatchInput struct {
	Events []json.RawMessage `json:"events"`
}

type telemetryEventInput struct {
	Name              string `json:"name"`
	OccurredAt        string `json:"occurredAt"`
	Device            string `json:"device"`
	AuthMode          string `json:"authMode"`
	Route             string `json:"route,omitempty"`
	From              string `json:"from,omitempty"`
	To                string `json:"to,omitempty"`
	Version           string `json:"version,omitempty"`
	Outcome           string `json:"outcome,omitempty"`
	HasCharacter      *bool  `json:"hasCharacter,omitempty"`
	ResetType         string `json:"resetType,omitempty"`
	Completed         *bool  `json:"completed,omitempty"`
	QueryLength       string `json:"queryLength,omitempty"`
	ResultCount       *int   `json:"resultCount,omitempty"`
	Duration          string `json:"duration,omitempty"`
	CanonicalResultID string `json:"canonicalResultId,omitempty"`
	ToolID            string `json:"toolId,omitempty"`
	Component         string `json:"component,omitempty"`
	ErrorType         string `json:"errorType,omitempty"`
	Endpoint          string `json:"endpoint,omitempty"`
	Status            *int   `json:"status,omitempty"`
}

var commonTelemetryKeys = map[string]bool{
	"name": true, "occurredAt": true, "device": true, "authMode": true,
}

var telemetryEventKeys = map[string][]string{
	"page_view":        {"route"},
	"navigation":       {"from", "to"},
	"character_lookup": {"version", "outcome"},
	"checklist_open":   {"version", "hasCharacter"},
	"checklist_toggle": {"resetType", "completed"},
	"checklist_reset":  {},
	"checklist_save":   {"outcome"},
	"search_submit":    {"queryLength", "resultCount", "duration", "canonicalResultId"},
	"tool_use":         {"toolId"},
	"session_duration": {"duration"},
	"error_boundary":   {"component", "errorType"},
	"api_failure":      {"endpoint", "status"},
}

func strictJSON(raw []byte, destination any) error {
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(destination); err != nil {
		return err
	}
	var trailing any
	if err := decoder.Decode(&trailing); err != io.EOF {
		return errors.New("multiple JSON values")
	}
	return nil
}

func telemetryClientHash(secret, ip string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(ip))
	return hex.EncodeToString(mac.Sum(nil))
}

func validTelemetryToken(value string) bool {
	return telemetryTokenPattern.MatchString(value) && !strings.ContainsAny(value, "?#")
}

func exactEventKeys(raw json.RawMessage, name string) error {
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(raw, &fields); err != nil {
		return err
	}
	allowed := make(map[string]bool, len(commonTelemetryKeys)+8)
	for key := range commonTelemetryKeys {
		allowed[key] = true
	}
	for _, key := range telemetryEventKeys[name] {
		allowed[key] = true
	}
	for key := range fields {
		if !allowed[key] {
			return fmt.Errorf("field %q is not allowed for %s", key, name)
		}
	}
	return nil
}

func validateTelemetryEvent(raw json.RawMessage, now time.Time, clientHash string) (repo.TelemetryEvent, error) {
	var input telemetryEventInput
	if err := strictJSON(raw, &input); err != nil {
		return repo.TelemetryEvent{}, err
	}
	if _, ok := telemetryEventKeys[input.Name]; !ok {
		return repo.TelemetryEvent{}, errors.New("unknown event name")
	}
	if err := exactEventKeys(raw, input.Name); err != nil {
		return repo.TelemetryEvent{}, err
	}
	occurredAt, err := time.Parse(time.RFC3339Nano, input.OccurredAt)
	if err != nil || occurredAt.Before(now.Add(-30*24*time.Hour)) || occurredAt.After(now.Add(5*time.Minute)) {
		return repo.TelemetryEvent{}, errors.New("invalid occurredAt")
	}
	if input.Device != "mobile" && input.Device != "desktop" {
		return repo.TelemetryEvent{}, errors.New("invalid device")
	}
	if input.AuthMode != "guest" && input.AuthMode != "signed-in" {
		return repo.TelemetryEvent{}, errors.New("invalid authMode")
	}

	properties := make(map[string]any)
	requireToken := func(key, value string) error {
		if !validTelemetryToken(value) {
			return fmt.Errorf("invalid %s", key)
		}
		properties[key] = value
		return nil
	}
	switch input.Name {
	case "page_view":
		err = requireToken("route", input.Route)
	case "navigation":
		if err = requireToken("from", input.From); err == nil {
			err = requireToken("to", input.To)
		}
	case "character_lookup":
		if err = requireToken("version", input.Version); err == nil {
			if input.Outcome != "success" && input.Outcome != "not-found" && input.Outcome != "failure" && input.Outcome != "unsupported" {
				err = errors.New("invalid outcome")
			} else {
				properties["outcome"] = input.Outcome
			}
		}
	case "checklist_open":
		if err = requireToken("version", input.Version); err == nil {
			if input.HasCharacter == nil {
				err = errors.New("hasCharacter required")
			} else {
				properties["hasCharacter"] = *input.HasCharacter
			}
		}
	case "checklist_toggle":
		if input.ResetType != "daily" && input.ResetType != "weekly" {
			err = errors.New("invalid resetType")
		} else if input.Completed == nil {
			err = errors.New("completed required")
		} else {
			properties["resetType"] = input.ResetType
			properties["completed"] = *input.Completed
		}
	case "checklist_reset":
	case "checklist_save":
		if input.Outcome != "success" && input.Outcome != "failure" {
			err = errors.New("invalid outcome")
		} else {
			properties["outcome"] = input.Outcome
		}
	case "search_submit":
		if input.QueryLength != "short" && input.QueryLength != "medium" && input.QueryLength != "long" {
			err = errors.New("invalid queryLength")
			break
		}
		if input.ResultCount == nil || *input.ResultCount < 0 || *input.ResultCount > 999 {
			err = errors.New("invalid resultCount")
			break
		}
		if input.Duration != "<100ms" && input.Duration != "100-500ms" && input.Duration != "500ms+" {
			err = errors.New("invalid duration")
			break
		}
		properties["queryLength"], properties["resultCount"], properties["duration"] = input.QueryLength, *input.ResultCount, input.Duration
		if input.CanonicalResultID != "" {
			err = requireToken("canonicalResultId", input.CanonicalResultID)
		}
	case "tool_use":
		err = requireToken("toolId", input.ToolID)
	case "session_duration":
		if input.Duration != "<1m" && input.Duration != "1-5m" && input.Duration != "5-15m" && input.Duration != "15m+" {
			err = errors.New("invalid duration")
		} else {
			properties["duration"] = input.Duration
		}
	case "error_boundary":
		if err = requireToken("component", input.Component); err == nil {
			err = requireToken("errorType", input.ErrorType)
		}
	case "api_failure":
		if err = requireToken("endpoint", input.Endpoint); err == nil {
			if input.Status == nil || *input.Status < 0 || *input.Status > 599 {
				err = errors.New("invalid status")
			} else {
				properties["status"] = *input.Status
			}
		}
	}
	if err != nil {
		return repo.TelemetryEvent{}, err
	}
	return repo.TelemetryEvent{OccurredAt: occurredAt, Name: input.Name, Device: input.Device, AuthMode: input.AuthMode, Properties: properties, ClientHash: clientHash}, nil
}

func parseTelemetryBatch(body []byte, now time.Time, clientHash string) ([]repo.TelemetryEvent, error) {
	if len(body) == 0 || len(body) > maxTelemetryBodyBytes {
		return nil, errors.New("invalid body size")
	}
	var input telemetryBatchInput
	if err := strictJSON(body, &input); err != nil {
		return nil, err
	}
	if len(input.Events) == 0 || len(input.Events) > maxTelemetryBatch {
		return nil, errors.New("invalid batch size")
	}
	events := make([]repo.TelemetryEvent, 0, len(input.Events))
	for _, raw := range input.Events {
		event, err := validateTelemetryEvent(raw, now, clientHash)
		if err != nil {
			return nil, err
		}
		events = append(events, event)
	}
	return events, nil
}

func (h TelemetryHandler) Collect(c *fiber.Ctx) error {
	if c.Get("X-MapleHub-Internal") == "1" {
		return c.SendStatus(fiber.StatusNoContent)
	}
	secret := h.HashSecret
	if secret == "" {
		return fiber.NewError(fiber.StatusServiceUnavailable, "telemetry unavailable")
	}
	events, err := parseTelemetryBatch(c.Body(), time.Now().UTC(), telemetryClientHash(secret, c.IP()))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid telemetry payload")
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	if err := h.Repo.InsertBatch(ctx, events); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "telemetry write failed")
	}
	return c.Status(fiber.StatusAccepted).JSON(fiber.Map{"accepted": len(events)})
}

func (h TelemetryHandler) Dashboard(c *fiber.Ctx) error {
	days, _ := strconv.Atoi(c.Query("days", "14"))
	if days < 1 || days > 30 {
		days = 14
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()
	dashboard, err := h.Repo.Dashboard(ctx, days)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "telemetry dashboard failed")
	}
	return c.JSON(dashboard)
}
