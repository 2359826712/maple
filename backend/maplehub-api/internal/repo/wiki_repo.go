package repo

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WikiRepo struct {
	DB *pgxpool.Pool
}

type WikiSpace struct {
	ID          string `json:"id"`
	TenantID    string `json:"tenant_id"`
	Key         string `json:"key"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Visibility  string `json:"visibility"`
}

type WikiPage struct {
	ID                string `json:"id"`
	SpaceID           string `json:"space_id"`
	ParentID          *string `json:"parent_id,omitempty"`
	Slug              string `json:"slug"`
	Title             string `json:"title"`
	CurrentRevisionID *string `json:"current_revision_id,omitempty"`
	SortOrder         int     `json:"sort_order"`
}

type WikiRevision struct {
	ID         string `json:"id"`
	PageID     string `json:"page_id"`
	RevisionNo int    `json:"revision_no"`
	ContentMD  string `json:"content_md"`
	Summary    string `json:"summary"`
}

func (r WikiRepo) ListSpaces(ctx context.Context, tenantID string) ([]WikiSpace, error) {
	const q = `
SELECT id::text, coalesce(tenant_id::text,''), key::text, name, description, visibility
FROM wiki_space
WHERE tenant_id = $1
ORDER BY created_at DESC;
`
	rows, err := r.DB.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []WikiSpace
	for rows.Next() {
		var s WikiSpace
		if err := rows.Scan(&s.ID, &s.TenantID, &s.Key, &s.Name, &s.Description, &s.Visibility); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r WikiRepo) CreateSpace(ctx context.Context, tenantID, key, name, desc, visibility, createdBy string) (WikiSpace, error) {
	const q = `
INSERT INTO wiki_space (tenant_id, key, name, description, visibility, created_by)
VALUES ($1, $2, $3, $4, $5, NULLIF($6,'')::uuid)
RETURNING id::text, tenant_id::text, key::text, name, description, visibility;
`
	var s WikiSpace
	err := r.DB.QueryRow(ctx, q, tenantID, key, name, desc, visibility, createdBy).Scan(
		&s.ID, &s.TenantID, &s.Key, &s.Name, &s.Description, &s.Visibility,
	)
	return s, err
}

func (r WikiRepo) ListPagesByParent(ctx context.Context, spaceID string, parentID *string) ([]WikiPage, error) {
	const qRoot = `
SELECT id::text, space_id::text, parent_id::text, slug::text, title, current_revision_id::text, sort_order
FROM wiki_page
WHERE space_id = $1 AND parent_id IS NULL AND is_deleted = false
ORDER BY sort_order ASC, created_at ASC;
`
	const qChild = `
SELECT id::text, space_id::text, parent_id::text, slug::text, title, current_revision_id::text, sort_order
FROM wiki_page
WHERE space_id = $1 AND parent_id = $2::uuid AND is_deleted = false
ORDER BY sort_order ASC, created_at ASC;
`

	var rows pgx.Rows
	var err error
	if parentID == nil || *parentID == "" {
		rows, err = r.DB.Query(ctx, qRoot, spaceID)
	} else {
		rows, err = r.DB.Query(ctx, qChild, spaceID, *parentID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []WikiPage
	for rows.Next() {
		var p WikiPage
		var parentStr *string
		var currentRev *string
		if err := rows.Scan(&p.ID, &p.SpaceID, &parentStr, &p.Slug, &p.Title, &currentRev, &p.SortOrder); err != nil {
			return nil, err
		}
		p.ParentID = parentStr
		p.CurrentRevisionID = currentRev
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r WikiRepo) CreatePage(ctx context.Context, spaceID string, parentID *string, slug, title string, sortOrder int, createdBy string) (WikiPage, error) {
	const q = `
INSERT INTO wiki_page (space_id, parent_id, slug, title, sort_order, created_by)
VALUES ($1, NULLIF($2,'')::uuid, $3, $4, $5, NULLIF($6,'')::uuid)
RETURNING id::text, space_id::text, parent_id::text, slug::text, title, current_revision_id::text, sort_order;
`
	var p WikiPage
	var parentStr string
	if parentID != nil {
		parentStr = *parentID
	}
	var parentOut *string
	var currentOut *string
	err := r.DB.QueryRow(ctx, q, spaceID, parentStr, slug, title, sortOrder, createdBy).Scan(
		&p.ID, &p.SpaceID, &parentOut, &p.Slug, &p.Title, &currentOut, &p.SortOrder,
	)
	p.ParentID = parentOut
	p.CurrentRevisionID = currentOut
	return p, err
}

func (r WikiRepo) GetPage(ctx context.Context, pageID string) (WikiPage, error) {
	const q = `
SELECT id::text, space_id::text, parent_id::text, slug::text, title, current_revision_id::text, sort_order
FROM wiki_page
WHERE id = $1::uuid AND is_deleted = false
LIMIT 1;
`
	var p WikiPage
	var parentOut *string
	var currentOut *string
	err := r.DB.QueryRow(ctx, q, pageID).Scan(&p.ID, &p.SpaceID, &parentOut, &p.Slug, &p.Title, &currentOut, &p.SortOrder)
	p.ParentID = parentOut
	p.CurrentRevisionID = currentOut
	return p, err
}

func (r WikiRepo) UpdatePage(ctx context.Context, pageID, slug, title string, sortOrder int) (WikiPage, error) {
	const q = `
UPDATE wiki_page
SET slug = $2, title = $3, sort_order = $4
WHERE id = $1::uuid AND is_deleted = false
RETURNING id::text, space_id::text, parent_id::text, slug::text, title, current_revision_id::text, sort_order;
`
	var p WikiPage
	var parentOut *string
	var currentOut *string
	err := r.DB.QueryRow(ctx, q, pageID, slug, title, sortOrder).Scan(
		&p.ID, &p.SpaceID, &parentOut, &p.Slug, &p.Title, &currentOut, &p.SortOrder,
	)
	p.ParentID = parentOut
	p.CurrentRevisionID = currentOut
	return p, err
}

func (r WikiRepo) CreateRevisionAndSetCurrent(ctx context.Context, pageID, contentMD, summary, createdBy string) (WikiRevision, error) {
	tx, err := r.DB.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return WikiRevision{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const qNextNo = `
SELECT COALESCE(MAX(revision_no), 0) + 1
FROM wiki_page_revision
WHERE page_id = $1::uuid;
`
	var nextNo int
	if err := tx.QueryRow(ctx, qNextNo, pageID).Scan(&nextNo); err != nil {
		return WikiRevision{}, err
	}

	const qInsert = `
INSERT INTO wiki_page_revision (page_id, revision_no, content_md, summary, created_by)
VALUES ($1::uuid, $2, $3, $4, NULLIF($5,'')::uuid)
RETURNING id::text, page_id::text, revision_no, content_md, summary;
`
	var rev WikiRevision
	if err := tx.QueryRow(ctx, qInsert, pageID, nextNo, contentMD, summary, createdBy).Scan(
		&rev.ID, &rev.PageID, &rev.RevisionNo, &rev.ContentMD, &rev.Summary,
	); err != nil {
		return WikiRevision{}, err
	}

	const qSetCurrent = `
UPDATE wiki_page
SET current_revision_id = $2::uuid
WHERE id = $1::uuid AND is_deleted = false;
`
	ct, err := tx.Exec(ctx, qSetCurrent, pageID, rev.ID)
	if err != nil {
		return WikiRevision{}, err
	}
	if ct.RowsAffected() == 0 {
		return WikiRevision{}, errors.New("page not found")
	}

	if err := tx.Commit(ctx); err != nil {
		return WikiRevision{}, err
	}
	return rev, nil
}

