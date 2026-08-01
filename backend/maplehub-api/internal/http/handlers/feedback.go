package handlers

import (
	"context"
	"net/mail"
	"net/url"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/http/middleware"
	"maplehub/internal/repo"
)

type FeedbackHandler struct {
	LookupRepo repo.TenantLookupRepo
	Repo       repo.FeedbackRepo
}

type createFeedbackReq struct {
	TenantKey    string `json:"tenant_key"`
	Category     string `json:"category"`
	Subject      string `json:"subject"`
	Details      string `json:"details"`
	ContactEmail string `json:"contact_email"`
	Locale       string `json:"locale"`
	PageURL      string `json:"page_url"`
}

type updateFeedbackReq struct {
	Status    string `json:"status"`
	AdminNote string `json:"admin_note"`
}

var feedbackCategories = map[string]bool{"bug": true, "suggestion": true, "content": true, "other": true}
var feedbackStatuses = map[string]bool{"new": true, "in_progress": true, "resolved": true, "closed": true}

func (h FeedbackHandler) Create(c *fiber.Ctx) error {
	var req createFeedbackReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	req.TenantKey = strings.TrimSpace(req.TenantKey)
	if req.TenantKey == "" {
		req.TenantKey = "default"
	}
	req.Category = strings.TrimSpace(strings.ToLower(req.Category))
	req.Subject = strings.TrimSpace(req.Subject)
	req.Details = strings.TrimSpace(req.Details)
	req.ContactEmail = strings.TrimSpace(strings.ToLower(req.ContactEmail))
	req.Locale = strings.TrimSpace(req.Locale)
	req.PageURL = strings.TrimSpace(req.PageURL)

	if !feedbackCategories[req.Category] || len(req.Subject) < 3 || len(req.Subject) > 120 || len(req.Details) < 10 || len(req.Details) > 4000 {
		return fiber.NewError(fiber.StatusBadRequest, "invalid feedback")
	}
	if req.ContactEmail != "" {
		address, err := mail.ParseAddress(req.ContactEmail)
		if err != nil || !strings.EqualFold(address.Address, req.ContactEmail) || len(req.ContactEmail) > 320 {
			return fiber.NewError(fiber.StatusBadRequest, "invalid contact email")
		}
	}
	if len(req.Locale) > 20 || len(req.PageURL) > 2048 {
		return fiber.NewError(fiber.StatusBadRequest, "invalid feedback metadata")
	}
	if req.PageURL != "" {
		parsedURL, err := url.ParseRequestURI(req.PageURL)
		if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") || parsedURL.Host == "" {
			return fiber.NewError(fiber.StatusBadRequest, "invalid feedback page url")
		}
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	tenantID, err := h.LookupRepo.GetTenantIDByKey(ctx, req.TenantKey)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "tenant not found")
	}
	item, err := h.Repo.Create(ctx, tenantID, req.Category, req.Subject, req.Details, req.ContactEmail, req.Locale, req.PageURL)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "create feedback failed")
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

func (h FeedbackHandler) List(c *fiber.Ctx) error {
	status := strings.TrimSpace(strings.ToLower(c.Query("status")))
	if status != "" && !feedbackStatuses[status] {
		return fiber.NewError(fiber.StatusBadRequest, "invalid feedback status")
	}
	query := strings.TrimSpace(c.Query("q"))
	if len(query) > 120 {
		return fiber.NewError(fiber.StatusBadRequest, "search query too long")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	items, err := h.Repo.List(ctx, middleware.TenantID(c), status, query)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list feedback failed")
	}
	return c.JSON(items)
}

func (h FeedbackHandler) Update(c *fiber.Ctx) error {
	var req updateFeedbackReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	req.Status = strings.TrimSpace(strings.ToLower(req.Status))
	req.AdminNote = strings.TrimSpace(req.AdminNote)
	if !feedbackStatuses[req.Status] || len(req.AdminNote) > 4000 {
		return fiber.NewError(fiber.StatusBadRequest, "invalid feedback update")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	item, err := h.Repo.Update(ctx, middleware.TenantID(c), c.Params("feedbackId"), req.Status, req.AdminNote, middleware.UserID(c))
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "feedback not found")
	}
	return c.JSON(item)
}
