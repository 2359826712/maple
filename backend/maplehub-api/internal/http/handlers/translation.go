package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/translation"
)

type TranslationHandler struct {
	Service *translation.Service
}

func (h TranslationHandler) Translate(c *fiber.Ctx) error {
	var input translation.Request
	if err := strictJSON(c.Body(), &input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid translation request")
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Minute)
	defer cancel()
	result, err := h.Service.Translate(ctx, input)
	if err != nil {
		return fiber.NewError(fiber.StatusBadGateway, "translation unavailable: "+err.Error())
	}
	c.Set(fiber.HeaderCacheControl, "no-store")
	return c.JSON(result)
}
