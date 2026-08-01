package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

type WikiHandler struct {
	Repo repo.WikiRepo
}

type createSpaceReq struct {
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Visibility  string `json:"visibility"` // private|public
}

func (h WikiHandler) ListSpaces(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListSpaces(ctx, tenantID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list spaces failed")
	}
	return c.JSON(items)
}

func (h WikiHandler) CreateSpace(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	userID, _ := c.Locals("user_id").(string)

	var req createSpaceReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Key == "" || req.Name == "" {
		return fiber.NewError(fiber.StatusBadRequest, "key/name required")
	}
	if req.Visibility == "" {
		req.Visibility = "private"
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	space, err := h.Repo.CreateSpace(ctx, tenantID, req.Key, req.Name, req.Description, req.Visibility, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "create space failed")
	}
	return c.Status(fiber.StatusCreated).JSON(space)
}

type createPageReq struct {
	ParentID  *string `json:"parent_id"`
	Slug      string  `json:"slug"`
	Title     string  `json:"title"`
	SortOrder int     `json:"sort_order"`
}

func (h WikiHandler) ListPages(c *fiber.Ctx) error {
	spaceID := c.Params("spaceId")
	parentID := c.Query("parent_id")
	var p *string
	if parentID != "" {
		p = &parentID
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListPagesByParent(ctx, spaceID, p)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list pages failed")
	}
	return c.JSON(items)
}

func (h WikiHandler) CreatePage(c *fiber.Ctx) error {
	spaceID := c.Params("spaceId")
	userID, _ := c.Locals("user_id").(string)

	var req createPageReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Slug == "" || req.Title == "" {
		return fiber.NewError(fiber.StatusBadRequest, "slug/title required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	page, err := h.Repo.CreatePage(ctx, spaceID, req.ParentID, req.Slug, req.Title, req.SortOrder, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "create page failed")
	}
	return c.Status(fiber.StatusCreated).JSON(page)
}

type updatePageReq struct {
	Slug      string `json:"slug"`
	Title     string `json:"title"`
	SortOrder int    `json:"sort_order"`
}

func (h WikiHandler) GetPage(c *fiber.Ctx) error {
	pageID := c.Params("pageId")
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	page, err := h.Repo.GetPage(ctx, pageID)
	if err != nil {
		return fiber.ErrNotFound
	}
	return c.JSON(page)
}

func (h WikiHandler) UpdatePage(c *fiber.Ctx) error {
	pageID := c.Params("pageId")

	var req updatePageReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Slug == "" || req.Title == "" {
		return fiber.NewError(fiber.StatusBadRequest, "slug/title required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	page, err := h.Repo.UpdatePage(ctx, pageID, req.Slug, req.Title, req.SortOrder)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "update page failed")
	}
	return c.JSON(page)
}

type createRevisionReq struct {
	ContentMD string `json:"content_md"`
	Summary   string `json:"summary"`
}

func (h WikiHandler) CreateRevision(c *fiber.Ctx) error {
	pageID := c.Params("pageId")
	userID, _ := c.Locals("user_id").(string)

	var req createRevisionReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.ContentMD == "" {
		return fiber.NewError(fiber.StatusBadRequest, "content_md required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()

	rev, err := h.Repo.CreateRevisionAndSetCurrent(ctx, pageID, req.ContentMD, req.Summary, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "create revision failed")
	}
	return c.Status(fiber.StatusCreated).JSON(rev)
}
