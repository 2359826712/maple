package repo

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GuideRepo struct {
	DB *pgxpool.Pool
}

// --------- Likes / Bookmarks ----------

func (r GuideRepo) IsBookmarked(ctx context.Context, userID, guideID string) (bool, error) {
	const q = `SELECT 1 FROM guide_bookmark WHERE user_id=$1::uuid AND guide_id=$2 LIMIT 1;`
	var one int
	err := r.DB.QueryRow(ctx, q, userID, guideID).Scan(&one)
	if err != nil {
		// no rows => false
		return false, nil
	}
	return true, nil
}

func (r GuideRepo) SetBookmark(ctx context.Context, tenantID, userID, guideID string, active bool) error {
	if !active {
		_, err := r.DB.Exec(ctx, `DELETE FROM guide_bookmark WHERE user_id=$1::uuid AND guide_id=$2`, userID, guideID)
		return err
	}
	const q = `
INSERT INTO guide_bookmark (tenant_id, user_id, guide_id)
VALUES ($1::uuid, $2::uuid, $3)
ON CONFLICT (user_id, guide_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;
`
	_, err := r.DB.Exec(ctx, q, tenantID, userID, guideID)
	return err
}

func (r GuideRepo) ListBookmarks(ctx context.Context, userID string) ([]string, error) {
	const q = `
SELECT guide_id
FROM guide_bookmark
WHERE user_id = $1::uuid
ORDER BY created_at DESC
LIMIT 1000;
`
	rows, err := r.DB.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}

func (r GuideRepo) IsLiked(ctx context.Context, userID, guideID string) (bool, error) {
	const q = `SELECT 1 FROM guide_like WHERE user_id=$1::uuid AND guide_id=$2 LIMIT 1;`
	var one int
	err := r.DB.QueryRow(ctx, q, userID, guideID).Scan(&one)
	if err != nil {
		return false, nil
	}
	return true, nil
}

func (r GuideRepo) SetLike(ctx context.Context, tenantID, userID, guideID string, active bool) error {
	if !active {
		_, err := r.DB.Exec(ctx, `DELETE FROM guide_like WHERE user_id=$1::uuid AND guide_id=$2`, userID, guideID)
		return err
	}
	const q = `
INSERT INTO guide_like (tenant_id, user_id, guide_id)
VALUES ($1::uuid, $2::uuid, $3)
ON CONFLICT (user_id, guide_id) DO UPDATE SET tenant_id = EXCLUDED.tenant_id;
`
	_, err := r.DB.Exec(ctx, q, tenantID, userID, guideID)
	return err
}

func (r GuideRepo) ListLikes(ctx context.Context, userID string) ([]string, error) {
	const q = `
SELECT guide_id
FROM guide_like
WHERE user_id = $1::uuid
ORDER BY created_at DESC
LIMIT 1000;
`
	rows, err := r.DB.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		out = append(out, id)
	}
	return out, rows.Err()
}

func (r GuideRepo) LikeCount(ctx context.Context, guideID string) (int, error) {
	const q = `SELECT COUNT(*) FROM guide_like WHERE guide_id = $1;`
	var n int
	if err := r.DB.QueryRow(ctx, q, guideID).Scan(&n); err != nil {
		return 0, err
	}
	return n, nil
}

type GuideComment struct {
	ID        string     `json:"id"`
	TenantID  string     `json:"tenant_id"`
	GuideID   string     `json:"guide_id"`
	UserID    *string    `json:"user_id,omitempty"`
	ParentID  *string    `json:"parent_id,omitempty"`
	Content   string     `json:"content"`
	Upvotes   int        `json:"upvotes"`
	IsDeleted bool       `json:"is_deleted"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (r GuideRepo) ListComments(ctx context.Context, tenantID, guideID string) ([]GuideComment, error) {
	const q = `
SELECT id::text, tenant_id::text, guide_id, user_id::text, parent_id::text, content, upvotes, is_deleted, created_at, updated_at
FROM guide_comment
WHERE tenant_id = $1::uuid AND guide_id = $2
ORDER BY created_at ASC
LIMIT 2000;
`
	rows, err := r.DB.Query(ctx, q, tenantID, guideID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []GuideComment
	for rows.Next() {
		var c GuideComment
		var uid *string
		var pid *string
		if err := rows.Scan(&c.ID, &c.TenantID, &c.GuideID, &uid, &pid, &c.Content, &c.Upvotes, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		c.UserID = uid
		c.ParentID = pid
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r GuideRepo) AddComment(ctx context.Context, tenantID, guideID, userID string, parentID *string, content string) (GuideComment, error) {
	const q = `
INSERT INTO guide_comment (tenant_id, guide_id, user_id, parent_id, content)
VALUES ($1::uuid, $2, NULLIF($3,'')::uuid, NULLIF($4,'')::uuid, $5)
RETURNING id::text, tenant_id::text, guide_id, user_id::text, parent_id::text, content, upvotes, is_deleted, created_at, updated_at;
`
	var c GuideComment
	var uid *string
	var pid *string
	parentStr := ""
	if parentID != nil {
		parentStr = *parentID
	}
	if err := r.DB.QueryRow(ctx, q, tenantID, guideID, userID, parentStr, content).Scan(
		&c.ID, &c.TenantID, &c.GuideID, &uid, &pid, &c.Content, &c.Upvotes, &c.IsDeleted, &c.CreatedAt, &c.UpdatedAt,
	); err != nil {
		return GuideComment{}, err
	}
	c.UserID = uid
	c.ParentID = pid
	return c, nil
}

// vote: 1|-1|0 (0 means remove)
func (r GuideRepo) SetCommentVote(ctx context.Context, commentID, userID string, vote int) (int, error) {
	if vote != -1 && vote != 0 && vote != 1 {
		return 0, errors.New("invalid vote")
	}

	tx, err := r.DB.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if vote == 0 {
		_, _ = tx.Exec(ctx, `DELETE FROM guide_comment_vote WHERE comment_id=$1::uuid AND user_id=$2::uuid`, commentID, userID)
	} else {
		const qUpsert = `
INSERT INTO guide_comment_vote (comment_id, user_id, vote)
VALUES ($1::uuid, $2::uuid, $3)
ON CONFLICT (comment_id, user_id)
DO UPDATE SET vote = EXCLUDED.vote;
`
		if _, err := tx.Exec(ctx, qUpsert, commentID, userID, vote); err != nil {
			return 0, err
		}
	}

	var total int
	if err := tx.QueryRow(ctx, `SELECT COALESCE(SUM(vote),0) FROM guide_comment_vote WHERE comment_id=$1::uuid`, commentID).Scan(&total); err != nil {
		return 0, err
	}
	if _, err := tx.Exec(ctx, `UPDATE guide_comment SET upvotes = $2, updated_at = now() WHERE id=$1::uuid`, commentID, total); err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return total, nil
}
