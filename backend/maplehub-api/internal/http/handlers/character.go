package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"

	"maplehub/internal/repo"
)

type CharacterHandler struct {
	Repo repo.CharacterRepo
}

type checklistBulkInput struct {
	Entries []repo.BossChecklistEntry `json:"entries"`
}

func (h CharacterHandler) ListCharacters(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	items, err := h.Repo.ListCharacters(ctx, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list characters failed")
	}
	if items == nil {
		items = []repo.CharacterProfile{}
	}
	return c.JSON(items)
}

func (h CharacterHandler) CreateCharacter(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	var input repo.CharacterInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid input")
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	item, err := h.Repo.CreateCharacter(ctx, userID, input)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "create character failed")
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

func (h CharacterHandler) UpdateCharacter(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	charID := c.Params("charId")
	var input repo.CharacterInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid input")
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	item, err := h.Repo.UpdateCharacter(ctx, userID, charID, input)
	if err != nil {
		return fiber.ErrNotFound
	}
	return c.JSON(item)
}

func (h CharacterHandler) DeleteCharacter(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(string)
	charID := c.Params("charId")
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	if err := h.Repo.DeleteCharacter(ctx, userID, charID); err != nil {
		log.Errorf("delete character failed: %v", err)
		return fiber.NewError(fiber.StatusInternalServerError, "delete character failed")
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h CharacterHandler) GetChecklist(c *fiber.Ctx) error {
	charID := c.Params("charId")
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	items, err := h.Repo.GetChecklist(ctx, charID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "get checklist failed")
	}
	if items == nil {
		items = []repo.BossChecklistEntry{}
	}
	return c.JSON(items)
}

func (h CharacterHandler) UpdateChecklist(c *fiber.Ctx) error {
	charID := c.Params("charId")
	var input checklistBulkInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid input")
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()
	if err := h.Repo.BulkUpsertChecklist(ctx, charID, input.Entries); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "update checklist failed")
	}
	return c.JSON(fiber.Map{"ok": true})
}
