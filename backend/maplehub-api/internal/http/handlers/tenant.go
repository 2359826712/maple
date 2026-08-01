package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

type TenantHandler struct {
	Repo repo.TenantRepo
}

func (h TenantHandler) ListTenants(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListTenants(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list tenants failed")
	}
	return c.JSON(items)
}
