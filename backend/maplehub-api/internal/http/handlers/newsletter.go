package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

type NewsletterHandler struct {
	LookupRepo repo.TenantLookupRepo
	Repo       repo.NewsletterRepo
}

type subscribeReq struct {
	TenantKey string `json:"tenant_key"` // optional, default "default"
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	IGN       string `json:"ign"`
	World     string `json:"world"`
	Locale    string `json:"locale"`
}

func (h NewsletterHandler) Subscribe(c *fiber.Ctx) error {
	var req subscribeReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Email == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email required")
	}
	if req.TenantKey == "" {
		req.TenantKey = "default"
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	tenantID, err := h.LookupRepo.GetTenantIDByKey(ctx, req.TenantKey)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "tenant not found")
	}

	s, err := h.Repo.Subscribe(ctx, tenantID, req.Email, req.FirstName, req.IGN, req.World, req.Locale)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "subscribe failed")
	}
	return c.JSON(s)
}

type unsubscribeReq struct {
	Email string `json:"email"`
}

func (h NewsletterHandler) Unsubscribe(c *fiber.Ctx) error {
	var req unsubscribeReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Email == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	if err := h.Repo.Unsubscribe(ctx, req.Email); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "unsubscribe failed")
	}
	return c.JSON(fiber.Map{"ok": true})
}

// Admin only
func (h NewsletterHandler) ListSubscribers(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.List(ctx, tenantID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list subscribers failed")
	}
	return c.JSON(items)
}

