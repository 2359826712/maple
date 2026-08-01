package repo

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CommunityRepo struct {
	DB *pgxpool.Pool
}

type CommunityProposal struct {
	ID            string    `json:"id"`
	TenantID      string    `json:"tenant_id"`
	ClassName     string    `json:"class_name"`
	Action        string    `json:"action"`
	Kind          string    `json:"kind"`
	Title         string    `json:"title"`
	Note          string    `json:"note"`
	Status        string    `json:"status"`
	CreatedBy     *string   `json:"created_by,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	Votes         int       `json:"votes"`
	CommentCount  int       `json:"comment_count"`
	PreviousImages []string `json:"previous_images"`
	ProposedImages []string `json:"proposed_images"`
}

func (r CommunityRepo) ListProposals(ctx context.Context, tenantID string, status, className, kind, sort string) ([]CommunityProposal, error) {
	// sort: Newest|Score
	orderBy := "p.created_at DESC"
	if sort == "Score" {
		orderBy = "votes DESC, p.created_at DESC"
	}
	q := fmt.Sprintf(`
WITH vote_sum AS (
  SELECT proposal_id, COALESCE(SUM(vote),0) AS votes
  FROM community_proposal_vote
  GROUP BY proposal_id
),
comment_sum AS (
  SELECT proposal_id, COUNT(*) AS comment_count
  FROM community_proposal_comment
  GROUP BY proposal_id
),
img AS (
  SELECT proposal_id,
         ARRAY_REMOVE(ARRAY_AGG(CASE WHEN kind='previous' THEN url ELSE NULL END ORDER BY sort_order), NULL) AS previous_images,
         ARRAY_REMOVE(ARRAY_AGG(CASE WHEN kind='proposed' THEN url ELSE NULL END ORDER BY sort_order), NULL) AS proposed_images
  FROM community_proposal_image
  GROUP BY proposal_id
)
SELECT
  p.id::text, COALESCE(p.tenant_id::text,''), p.class_name, p.action, p.kind, p.title, p.note, p.status,
  p.created_by::text, p.created_at, p.updated_at,
  COALESCE(v.votes,0) AS votes,
  COALESCE(c.comment_count,0) AS comment_count,
  COALESCE(i.previous_images, ARRAY[]::text[]) AS previous_images,
  COALESCE(i.proposed_images, ARRAY[]::text[]) AS proposed_images
FROM community_proposal p
LEFT JOIN vote_sum v ON v.proposal_id = p.id
LEFT JOIN comment_sum c ON c.proposal_id = p.id
LEFT JOIN img i ON i.proposal_id = p.id
WHERE p.tenant_id = $1
  AND ($2 = '' OR p.status = $2)
  AND ($3 = '' OR p.class_name = $3)
  AND ($4 = '' OR p.kind = $4)
ORDER BY %s
LIMIT 200;
`, orderBy)
	rows, err := r.DB.Query(ctx, q, tenantID, status, className, kind)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CommunityProposal
	for rows.Next() {
		var p CommunityProposal
		var createdBy *string
		if err := rows.Scan(
			&p.ID, &p.TenantID, &p.ClassName, &p.Action, &p.Kind, &p.Title, &p.Note, &p.Status,
			&createdBy, &p.CreatedAt, &p.UpdatedAt,
			&p.Votes, &p.CommentCount, &p.PreviousImages, &p.ProposedImages,
		); err != nil {
			return nil, err
		}
		p.CreatedBy = createdBy
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r CommunityRepo) CreateProposal(
	ctx context.Context,
	tenantID, className, action, kind, title, note, status, createdBy string,
	previousImages, proposedImages []string,
) (CommunityProposal, error) {
	tx, err := r.DB.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return CommunityProposal{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if status == "" {
		status = "Pending"
	}

	const q = `
INSERT INTO community_proposal (tenant_id, class_name, action, kind, title, note, status, created_by)
VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, NULLIF($8,'')::uuid)
RETURNING id::text, tenant_id::text, class_name, action, kind, title, note, status, created_by::text, created_at, updated_at;
`
	var p CommunityProposal
	var createdByOut *string
	if err := tx.QueryRow(ctx, q, tenantID, className, action, kind, title, note, status, createdBy).Scan(
		&p.ID, &p.TenantID, &p.ClassName, &p.Action, &p.Kind, &p.Title, &p.Note, &p.Status, &createdByOut, &p.CreatedAt, &p.UpdatedAt,
	); err != nil {
		return CommunityProposal{}, err
	}
	p.CreatedBy = createdByOut

	const qImg = `
INSERT INTO community_proposal_image (proposal_id, kind, url, sort_order)
VALUES ($1::uuid, $2, $3, $4);
`
	for i, url := range previousImages {
		if url == "" {
			continue
		}
		if _, err := tx.Exec(ctx, qImg, p.ID, "previous", url, i); err != nil {
			return CommunityProposal{}, err
		}
	}
	for i, url := range proposedImages {
		if url == "" {
			continue
		}
		if _, err := tx.Exec(ctx, qImg, p.ID, "proposed", url, i); err != nil {
			return CommunityProposal{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CommunityProposal{}, err
	}
	p.Votes = 0
	p.CommentCount = 0
	p.PreviousImages = previousImages
	p.ProposedImages = proposedImages
	return p, nil
}

// vote: 1|-1|0 (0 means remove vote)
func (r CommunityRepo) SetProposalVote(ctx context.Context, proposalID, userID string, vote int) (int, error) {
	if vote != -1 && vote != 0 && vote != 1 {
		return 0, errors.New("invalid vote")
	}

	tx, err := r.DB.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if vote == 0 {
		_, _ = tx.Exec(ctx, `DELETE FROM community_proposal_vote WHERE proposal_id=$1::uuid AND user_id=$2::uuid`, proposalID, userID)
	} else {
		const qUpsert = `
INSERT INTO community_proposal_vote (proposal_id, user_id, vote)
VALUES ($1::uuid, $2::uuid, $3)
ON CONFLICT (proposal_id, user_id)
DO UPDATE SET vote = EXCLUDED.vote, updated_at = now();
`
		if _, err := tx.Exec(ctx, qUpsert, proposalID, userID, vote); err != nil {
			return 0, err
		}
	}

	var total int
	const qSum = `SELECT COALESCE(SUM(vote),0) FROM community_proposal_vote WHERE proposal_id=$1::uuid;`
	if err := tx.QueryRow(ctx, qSum, proposalID).Scan(&total); err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return total, nil
}

type ProposalComment struct {
	ID        string    `json:"id"`
	ProposalID string   `json:"proposal_id"`
	UserID    *string   `json:"user_id,omitempty"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

func (r CommunityRepo) ListProposalComments(ctx context.Context, proposalID string) ([]ProposalComment, error) {
	const q = `
SELECT id::text, proposal_id::text, user_id::text, content, created_at
FROM community_proposal_comment
WHERE proposal_id = $1::uuid
ORDER BY created_at ASC
LIMIT 500;
`
	rows, err := r.DB.Query(ctx, q, proposalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []ProposalComment
	for rows.Next() {
		var c ProposalComment
		var uid *string
		if err := rows.Scan(&c.ID, &c.ProposalID, &uid, &c.Content, &c.CreatedAt); err != nil {
			return nil, err
		}
		c.UserID = uid
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r CommunityRepo) AddProposalComment(ctx context.Context, proposalID, userID, content string) (ProposalComment, error) {
	const q = `
INSERT INTO community_proposal_comment (proposal_id, user_id, content)
VALUES ($1::uuid, NULLIF($2,'')::uuid, $3)
RETURNING id::text, proposal_id::text, user_id::text, content, created_at;
`
	var c ProposalComment
	var uid *string
	if err := r.DB.QueryRow(ctx, q, proposalID, userID, content).Scan(&c.ID, &c.ProposalID, &uid, &c.Content, &c.CreatedAt); err != nil {
		return ProposalComment{}, err
	}
	c.UserID = uid
	return c, nil
}
