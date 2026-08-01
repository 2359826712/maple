package handlers

import (
	"context"
	"encoding/base64"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
	"maplehub/internal/staticcontent"
)

type StaticContentHandler struct {
	Service *staticcontent.Service
}

type staticContentRequest struct {
	URL     string            `json:"url"`
	Method  string            `json:"method"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

func (h StaticContentHandler) Get(c *fiber.Ctx) error {
	return h.serve(c, staticcontent.Request{URL: c.Query("url"), Method: "GET"})
}

func (h StaticContentHandler) Post(c *fiber.Ctx) error {
	var input staticContentRequest
	if err := strictJSON(c.Body(), &input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid static content request")
	}
	body, err := base64.StdEncoding.DecodeString(input.Body)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "static content body must be base64")
	}
	return h.serve(c, staticcontent.Request{
		URL: input.URL, Method: input.Method, Headers: input.Headers, Body: body,
	})
}

func (h StaticContentHandler) serve(c *fiber.Ctx, request staticcontent.Request) error {
	ctx, cancel := context.WithTimeout(c.UserContext(), 45*time.Second)
	defer cancel()
	snapshot, err := h.Service.Get(ctx, request)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, "static content unavailable: "+err.Error())
	}
	return sendStaticSnapshot(c, snapshot)
}

func sendStaticSnapshot(c *fiber.Ctx, snapshot repo.StaticContentSnapshot) error {
	contentType := strings.TrimSpace(snapshot.ContentType)
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	c.Set(fiber.HeaderContentType, contentType)
	c.Set(fiber.HeaderCacheControl, "public, max-age=43200, stale-if-error=604800")
	c.Set("X-Content-Synced-At", snapshot.SyncedAt.UTC().Format(time.RFC3339))
	return c.Status(snapshot.StatusCode).Send(snapshot.ResponseBody)
}
