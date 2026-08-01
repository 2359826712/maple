package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"maplehub/internal/repo"
)

type CommunityHandler struct {
	Repo repo.CommunityRepo
}

func (h CommunityHandler) ListProposals(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	status := c.Query("status")
	className := c.Query("class")
	kind := c.Query("kind")
	sort := c.Query("sort") // Newest|Score

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListProposals(ctx, tenantID, status, className, kind, sort)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list proposals failed")
	}
	return c.JSON(items)
}

type createProposalReq struct {
	ClassName      string   `json:"class_name"`
	Action         string   `json:"action"`
	Kind           string   `json:"kind"`
	Title          string   `json:"title"`
	Note           string   `json:"note"`
	Status         string   `json:"status"` // default Pending
	PreviousImages []string `json:"previous_images"`
	ProposedImages []string `json:"proposed_images"`
}

func (h CommunityHandler) CreateProposal(c *fiber.Ctx) error {
	tenantID, _ := c.Locals("tenant_id").(string)
	userID, _ := c.Locals("user_id").(string)

	var req createProposalReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.ClassName == "" || req.Action == "" || req.Kind == "" || req.Title == "" || req.Note == "" {
		return fiber.NewError(fiber.StatusBadRequest, "missing fields")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 8*time.Second)
	defer cancel()

	p, err := h.Repo.CreateProposal(ctx, tenantID, req.ClassName, req.Action, req.Kind, req.Title, req.Note, req.Status, userID, req.PreviousImages, req.ProposedImages)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "create proposal failed")
	}
	return c.Status(fiber.StatusCreated).JSON(p)
}

type voteReq struct {
	Vote int `json:"vote"` // 1|-1|0
}

func (h CommunityHandler) VoteProposal(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	proposalID := c.Params("proposalId")

	var req voteReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	total, err := h.Repo.SetProposalVote(ctx, proposalID, userID, req.Vote)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "vote failed")
	}
	return c.JSON(fiber.Map{"votes": total})
}

func (h CommunityHandler) ListProposalComments(c *fiber.Ctx) error {
	proposalID := c.Params("proposalId")
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	items, err := h.Repo.ListProposalComments(ctx, proposalID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "list comments failed")
	}
	return c.JSON(items)
}

type addCommentReq struct {
	Content string `json:"content"`
}

func (h CommunityHandler) AddProposalComment(c *fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	proposalID := c.Params("proposalId")

	var req addCommentReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if req.Content == "" {
		return fiber.NewError(fiber.StatusBadRequest, "content required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	item, err := h.Repo.AddProposalComment(ctx, proposalID, userID, req.Content)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "add comment failed")
	}
	return c.Status(fiber.StatusCreated).JSON(item)
}

