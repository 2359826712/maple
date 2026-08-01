package repo

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type NotificationRepo struct {
	DB *pgxpool.Pool
}

type Notification struct {
	ID        string     `json:"id"`
	TenantID  string     `json:"tenant_id"`
	UserID    string     `json:"user_id"`
	Type      string     `json:"type"`
	Title     string     `json:"title"`
	Body      string     `json:"body"`
	Link      string     `json:"link"`
	ReadAt    *time.Time `json:"read_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (r NotificationRepo) List(ctx context.Context, userID string, unreadOnly bool) ([]Notification, error) {
	q := `
SELECT id::text, COALESCE(tenant_id::text,''), user_id::text, type, title, body, COALESCE(link,''), read_at, created_at
FROM user_notification
WHERE user_id = $1::uuid
`
	if unreadOnly {
		q += " AND read_at IS NULL "
	}
	q += " ORDER BY created_at DESC LIMIT 200;"

	rows, err := r.DB.Query(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Notification
	for rows.Next() {
		var n Notification
		if err := rows.Scan(&n.ID, &n.TenantID, &n.UserID, &n.Type, &n.Title, &n.Body, &n.Link, &n.ReadAt, &n.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, n)
	}
	return out, rows.Err()
}

func (r NotificationRepo) MarkRead(ctx context.Context, id, userID string) error {
	_, err := r.DB.Exec(ctx, `UPDATE user_notification SET read_at = COALESCE(read_at, now()) WHERE id=$1::uuid AND user_id=$2::uuid`, id, userID)
	return err
}

func (r NotificationRepo) MarkAllRead(ctx context.Context, userID string) error {
	_, err := r.DB.Exec(ctx, `UPDATE user_notification SET read_at = now() WHERE user_id=$1::uuid AND read_at IS NULL`, userID)
	return err
}

