package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

type GuideHandler struct {
	Repo repo.GuideRepo
}

func (h GuideHandler) ListComments(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	guideID := c.Params("guideId")

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListComments(ctx, tenantID, guideID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list guide comments failed")
	}
	return c.JSON(items)
}

type addGuideCommentReq struct {
	ParentID *string `json:"parent_id"`
	Content  string  `json:"content"`
}

func (h GuideHandler) AddComment(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	userID, _ := c.Locals("user_id").(string)
	guideID := c.Params("guideId")

	var req addGuideCommentReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Content == "" {
		return fiber.NewError(fiber.StatusBadRequest, "content required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	item, err := h.Repo.AddComment(ctx, tenantID, guideID, userID, req.ParentID, req.Content)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "add guide comment failed")
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

type voteGuideCommentReq struct {
	Vote int `json:"vote"` // 1|-1|0
}

func (h GuideHandler) VoteComment(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	commentID := c.Params("commentId")

	var req voteGuideCommentReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	total, err := h.Repo.SetCommentVote(ctx, commentID, userID, req.Vote)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "vote failed")
	}
	return c.JSON(fiber.Map{"upvotes": total})
}

