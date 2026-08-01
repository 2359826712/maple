package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
)

type setActiveReq struct {
	Active bool `json:"active"`
}

// --------- Bookmarks ----------

func (h GuideHandler) GetBookmark(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	guideID := c.Params("guideId")

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	active, err := h.Repo.IsBookmarked(ctx, userID, guideID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "get bookmark failed")
	}
	return c.JSON(fiber.Map{"active": active})
}

func (h GuideHandler) SetBookmark(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	userID, _ := c.Locals("user_id").(string)
	guideID := c.Params("guideId")

	var req setActiveReq
	if err := c.BodyParser(&req); err != nil {
		// allow empty body: default active=true
		req.Active = true
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	if err := h.Repo.SetBookmark(ctx, tenantID, userID, guideID, req.Active); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "set bookmark failed")
	}
	return c.JSON(fiber.Map{"active": req.Active})
}

func (h GuideHandler) ListBookmarks(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListBookmarks(ctx, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list bookmarks failed")
	}
	return c.JSON(fiber.Map{"guide_ids": items})
}

// --------- Likes ----------

func (h GuideHandler) GetLike(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	guideID := c.Params("guideId")

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	active, err := h.Repo.IsLiked(ctx, userID, guideID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "get like failed")
	}
	return c.JSON(fiber.Map{"active": active})
}

func (h GuideHandler) SetLike(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	userID, _ := c.Locals("user_id").(string)
	guideID := c.Params("guideId")

	var req setActiveReq
	if err := c.BodyParser(&req); err != nil {
		req.Active = true
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	if err := h.Repo.SetLike(ctx, tenantID, userID, guideID, req.Active); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "set like failed")
	}
	return c.JSON(fiber.Map{"active": req.Active})
}

func (h GuideHandler) ListLikes(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListLikes(ctx, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list likes failed")
	}
	return c.JSON(fiber.Map{"guide_ids": items})
}

func (h GuideHandler) LikeCount(c *fiber.Ctx) error {
	guideID := c.Params("guideId")

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	n, err := h.Repo.LikeCount(ctx, guideID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "like count failed")
	}
	return c.JSON(fiber.Map{"count": n})
}

