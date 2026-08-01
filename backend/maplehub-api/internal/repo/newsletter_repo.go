package repo

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type NewsletterRepo struct {
	DB *pgxpool.Pool
}

type Subscriber struct {
	ID            string     `json:"id"`
	TenantID      string     `json:"tenant_id"`
	Email         string     `json:"email"`
	FirstName     string     `json:"first_name"`
	IGN           string     `json:"ign"`
	World         string     `json:"world"`
	Locale        string     `json:"locale"`
	Status        string     `json:"status"`
	SubscribedAt  time.Time  `json:"subscribed_at"`
	UnsubscribedAt *time.Time `json:"unsubscribed_at,omitempty"`
}

func (r NewsletterRepo) Subscribe(ctx context.Context, tenantID, email, firstName, ign, world, locale string) (Subscriber, error) {
	const q = `
INSERT INTO newsletter_subscriber (tenant_id, email, first_name, ign, world, locale, status, subscribed_at, unsubscribed_at)
VALUES ($1::uuid, $2, $3, $4, $5, $6, 'subscribed', now(), NULL)
ON CONFLICT (email)
DO UPDATE SET
  tenant_id = EXCLUDED.tenant_id,
  first_name = EXCLUDED.first_name,
  ign = EXCLUDED.ign,
  world = EXCLUDED.world,
  locale = EXCLUDED.locale,
  status = 'subscribed',
  subscribed_at = now(),
  unsubscribed_at = NULL
RETURNING id::text, tenant_id::text, email::text, first_name, ign, world, locale, status, subscribed_at, unsubscribed_at;
`
	var s Subscriber
	if err := r.DB.QueryRow(ctx, q, tenantID, email, firstName, ign, world, locale).Scan(
		&s.ID, &s.TenantID, &s.Email, &s.FirstName, &s.IGN, &s.World, &s.Locale, &s.Status, &s.SubscribedAt, &s.UnsubscribedAt,
	); err != nil {
		return Subscriber{}, err
	}
	return s, nil
}

func (r NewsletterRepo) Unsubscribe(ctx context.Context, email string) error {
	_, err := r.DB.Exec(ctx, `
UPDATE newsletter_subscriber
SET status = 'unsubscribed', unsubscribed_at = now()
WHERE email = $1;
`, email)
	return err
}

func (r NewsletterRepo) List(ctx context.Context, tenantID string) ([]Subscriber, error) {
	const q = `
SELECT id::text, tenant_id::text, email::text, first_name, ign, world, locale, status, subscribed_at, unsubscribed_at
FROM newsletter_subscriber
WHERE tenant_id = $1::uuid
ORDER BY subscribed_at DESC
LIMIT 500;
`
	rows, err := r.DB.Query(ctx, q, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Subscriber
	for rows.Next() {
		var s Subscriber
		if err := rows.Scan(&s.ID, &s.TenantID, &s.Email, &s.FirstName, &s.IGN, &s.World, &s.Locale, &s.Status, &s.SubscribedAt, &s.UnsubscribedAt); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

