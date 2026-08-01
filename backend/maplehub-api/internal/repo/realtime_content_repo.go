package repo

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RealtimeContentRepo struct {
	DB *pgxpool.Pool
}

type RealtimeContentRecord struct {
	Key         string          `json:"key"`
	Source      string          `json:"source"`
	SourceURL   string          `json:"source_url"`
	ContentType string          `json:"content_type"`
	Payload     json.RawMessage `json:"payload"`
	ContentText string          `json:"content_text"`
	ContentHTML string          `json:"content_html"`
	SyncedAt    time.Time       `json:"synced_at"`
	ExpiresAt   *time.Time      `json:"expires_at,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type RealtimeContentInput struct {
	Key         string          `json:"key"`
	Source      string          `json:"source"`
	SourceURL   string          `json:"source_url"`
	ContentType string          `json:"content_type"`
	Payload     json.RawMessage `json:"payload"`
	ContentText string          `json:"content_text"`
	ContentHTML string          `json:"content_html"`
	ExpiresAt   *time.Time      `json:"expires_at"`
}

func (r RealtimeContentRepo) Get(ctx context.Context, key string) (RealtimeContentRecord, error) {
	var item RealtimeContentRecord
	err := r.DB.QueryRow(ctx, `
SELECT key, source, source_url, content_type, payload, content_text, content_html,
       synced_at, expires_at, created_at, updated_at
FROM realtime_content_cache
WHERE key = $1
  AND (expires_at IS NULL OR expires_at > now());
`, key).Scan(
		&item.Key, &item.Source, &item.SourceURL, &item.ContentType, &item.Payload,
		&item.ContentText, &item.ContentHTML, &item.SyncedAt, &item.ExpiresAt,
		&item.CreatedAt, &item.UpdatedAt,
	)
	return item, err
}

func (r RealtimeContentRepo) Upsert(ctx context.Context, in RealtimeContentInput) (RealtimeContentRecord, error) {
	payload := in.Payload
	if len(payload) == 0 {
		payload = json.RawMessage(`{}`)
	}

	var item RealtimeContentRecord
	err := r.DB.QueryRow(ctx, `
INSERT INTO realtime_content_cache (
  key, source, source_url, content_type, payload, content_text, content_html, synced_at, expires_at
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, now(), $8
)
ON CONFLICT (key) DO UPDATE SET
  source = EXCLUDED.source,
  source_url = EXCLUDED.source_url,
  content_type = EXCLUDED.content_type,
  payload = EXCLUDED.payload,
  content_text = EXCLUDED.content_text,
  content_html = EXCLUDED.content_html,
  synced_at = now(),
  expires_at = EXCLUDED.expires_at
RETURNING key, source, source_url, content_type, payload, content_text, content_html,
          synced_at, expires_at, created_at, updated_at;
`, in.Key, in.Source, in.SourceURL, in.ContentType, payload, in.ContentText, in.ContentHTML, in.ExpiresAt).Scan(
		&item.Key, &item.Source, &item.SourceURL, &item.ContentType, &item.Payload,
		&item.ContentText, &item.ContentHTML, &item.SyncedAt, &item.ExpiresAt,
		&item.CreatedAt, &item.UpdatedAt,
	)
	return item, err
}
