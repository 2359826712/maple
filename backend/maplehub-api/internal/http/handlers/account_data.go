package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"

	"maplehub/internal/repo"
)

type AccountDataHandler struct {
	Repo repo.AccountDataRepo
}

type accountDataInput struct {
	Data map[string]string `json:"data"`
}

func validAccountDataKey(key string) bool {
	exact := map[string]bool{
		"maplehub-characters":                true,
		"maplehub-characters:v2":             true,
		"maplehub-checklist":                 true,
		"maplehub-news-state:v1":             true,
		"maplehub-guide-reading-progress:v1": true,
		"maplehub-routine-tasks:v1":          true,
		"maplehub-routine-tasks:v2":          true,
		"maplehub-event-goals:v1":            true,
		"maplehub-event-goals:v2":            true,
	}
	return exact[key] || strings.HasPrefix(key, "maplehub-checklist-")
}

func validateAccountData(data map[string]string) bool {
	if len(data) > 256 {
		return false
	}
	total := 0
	for key, value := range data {
		if !validAccountDataKey(key) {
			return false
		}
		total += len(key) + len(value)
		if total > 5*1024*1024 {
			return false
		}
	}
	return true
}

func (h AccountDataHandler) Get(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	item, err := h.Repo.Get(ctx, userID)
	if err == pgx.ErrNoRows {
		return c.JSON(repo.AccountPlayerData{Data: map[string]string{}, Revision: 0})
	}
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "load account data failed")
	}
	return c.JSON(item)
}

func (h AccountDataHandler) Put(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	var input accountDataInput
	if err := c.BodyParser(&input); err != nil || input.Data == nil || !validateAccountData(input.Data) {
		return fiber.NewError(fiber.StatusBadRequest, "invalid account data")
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()
	item, err := h.Repo.Upsert(ctx, userID, input.Data)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "save account data failed")
	}
	return c.JSON(item)
}
