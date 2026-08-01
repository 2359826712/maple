package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/contentsecurity"
	"maplehub/internal/repo"
)

type RealtimeContentHandler struct {
	Repo repo.RealtimeContentRepo
}

func (h RealtimeContentHandler) Get(c *fiber.Ctx) error {
	key := strings.TrimSpace(c.Query("key"))
	if key == "" {
		return fiber.NewError(fiber.StatusBadRequest, "key is required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	item, err := h.Repo.Get(ctx, key)
	if err != nil {
		return fiber.ErrNotFound
	}
	return c.JSON(item)
}

func (h RealtimeContentHandler) Upsert(c *fiber.Ctx) error {
	if len(c.Body()) > 5*1024*1024 {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "realtime content payload exceeds 5 MB")
	}
	var input repo.RealtimeContentInput
	if err := strictJSON(c.Body(), &input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid realtime content payload")
	}
	input.Key = strings.TrimSpace(input.Key)
	input.Source = strings.TrimSpace(input.Source)
	input.ContentType = strings.TrimSpace(input.ContentType)
	if input.Key == "" || len(input.Key) > 300 || input.Source == "" || len(input.Source) > 100 || input.ContentType == "" || len(input.ContentType) > 100 {
		return fiber.NewError(fiber.StatusBadRequest, "key, source, and content_type are required and bounded")
	}
	if err := contentsecurity.ValidateSourceURL(input.SourceURL); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "source_url is not allowed")
	}
	if input.ExpiresAt != nil && input.ExpiresAt.Before(time.Now().Add(-time.Minute)) {
		return fiber.NewError(fiber.StatusBadRequest, "expires_at cannot be in the past")
	}
	input.ContentHTML = contentsecurity.SanitizeHTML(input.ContentHTML)
	sanitizedPayload, err := contentsecurity.SanitizeHTMLFields(input.Payload)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "payload must be valid JSON")
	}
	input.Payload = sanitizedPayload
	if len(input.ContentText) > 2*1024*1024 || len(input.ContentHTML) > 2*1024*1024 {
		return fiber.NewError(fiber.StatusRequestEntityTooLarge, "content fields exceed 2 MB")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()

	item, err := h.Repo.Upsert(ctx, input)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "upsert realtime content failed")
	}
	return c.JSON(item)
}
