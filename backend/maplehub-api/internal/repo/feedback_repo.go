package repo

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type FeedbackRepo struct {
	DB *pgxpool.Pool
}

type SiteFeedback struct {
	ID           string     `json:"id"`
	TenantID     string     `json:"tenant_id"`
	Category     string     `json:"category"`
	Subject      string     `json:"subject"`
	Details      string     `json:"details"`
	ContactEmail string     `json:"contact_email"`
	Locale       string     `json:"locale"`
	PageURL      string     `json:"page_url"`
	Status       string     `json:"status"`
	AdminNote    string     `json:"admin_note"`
	HandledBy    *string    `json:"handled_by,omitempty"`
	HandledAt    *time.Time `json:"handled_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

const feedbackColumns = `
id::text, tenant_id::text, category, subject, details, coalesce(contact_email::text, ''),
locale, page_url, status, admin_note, handled_by::text, handled_at, created_at, updated_at`

func scanFeedback(row interface{ Scan(...any) error }) (SiteFeedback, error) {
	var item SiteFeedback
	err := row.Scan(
		&item.ID, &item.TenantID, &item.Category, &item.Subject, &item.Details,
		&item.ContactEmail, &item.Locale, &item.PageURL, &item.Status, &item.AdminNote,
		&item.HandledBy, &item.HandledAt, &item.CreatedAt, &item.UpdatedAt,
	)
	return item, err
}

func (r FeedbackRepo) Create(ctx context.Context, tenantID, category, subject, details, contactEmail, locale, pageURL string) (SiteFeedback, error) {
	return scanFeedback(r.DB.QueryRow(ctx, `
INSERT INTO site_feedback (tenant_id, category, subject, details, contact_email, locale, page_url)
VALUES ($1::uuid, $2, $3, $4, nullif($5, '')::citext, $6, $7)
RETURNING `+feedbackColumns+`;`, tenantID, category, subject, details, contactEmail, locale, pageURL))
}

func (r FeedbackRepo) List(ctx context.Context, tenantID, status, query string) ([]SiteFeedback, error) {
	rows, err := r.DB.Query(ctx, `
SELECT `+feedbackColumns+`
FROM site_feedback
WHERE tenant_id = $1::uuid
  AND ($2::text = '' OR status = $2::text)
  AND ($3::text = '' OR subject ILIKE '%' || $3::text || '%' OR details ILIKE '%' || $3::text || '%')
ORDER BY
  CASE status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'resolved' THEN 2 ELSE 3 END,
  created_at DESC
LIMIT 500;`, tenantID, status, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]SiteFeedback, 0)
	for rows.Next() {
		item, scanErr := scanFeedback(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r FeedbackRepo) Update(ctx context.Context, tenantID, feedbackID, status, adminNote, actorUserID string) (SiteFeedback, error) {
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return SiteFeedback{}, err
	}
	defer tx.Rollback(ctx)

	item, err := scanFeedback(tx.QueryRow(ctx, `
UPDATE site_feedback
SET status = $3,
    admin_note = $4,
    handled_by = $5::uuid,
    handled_at = CASE WHEN $3 = 'new' THEN NULL ELSE now() END
WHERE tenant_id = $1::uuid AND id = $2::uuid
RETURNING `+feedbackColumns+`;`, tenantID, feedbackID, status, adminNote, actorUserID))
	if err != nil {
		return SiteFeedback{}, err
	}

	_, err = tx.Exec(ctx, `
INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, detail)
VALUES ($1::uuid, 'feedback.update', 'site_feedback', $2::uuid, jsonb_build_object('status', $3));
`, actorUserID, feedbackID, status)
	if err != nil {
		return SiteFeedback{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return SiteFeedback{}, err
	}
	return item, nil
}
