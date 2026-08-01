package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

type NotificationHandler struct {
	Repo repo.NotificationRepo
}

func (h NotificationHandler) List(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	unreadOnly := c.Query("unread") == "1"

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.List(ctx, userID, unreadOnly)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list notifications failed")
	}
	return c.JSON(items)
}

func (h NotificationHandler) MarkRead(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	id := c.Params("id")

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	if err := h.Repo.MarkRead(ctx, id, userID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "mark read failed")
	}
	return c.JSON(fiber.Map{"ok": true})
}

func (h NotificationHandler) MarkAllRead(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	if err := h.Repo.MarkAllRead(ctx, userID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "mark all read failed")
	}
	return c.JSON(fiber.Map{"ok": true})
}

