package repo

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type StaticContentRepo struct {
	DB *pgxpool.Pool
}

type StaticContentSnapshot struct {
	CacheKey       string          `json:"cache_key"`
	SourceURL      string          `json:"source_url"`
	RequestMethod  string          `json:"request_method"`
	RequestHeaders json.RawMessage `json:"request_headers"`
	RequestBody    []byte          `json:"-"`
	ResponseBody   []byte          `json:"-"`
	ContentType    string          `json:"content_type"`
	StatusCode     int             `json:"status_code"`
	SyncedAt       time.Time       `json:"synced_at"`
	RefreshAfter   time.Time       `json:"refresh_after"`
	LastAttemptAt  time.Time       `json:"last_attempt_at"`
	LastError      string          `json:"last_error"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type StaticContentInput struct {
	CacheKey       string
	SourceURL      string
	RequestMethod  string
	RequestHeaders json.RawMessage
	RequestBody    []byte
	ResponseBody   []byte
	ContentType    string
	StatusCode     int
	RefreshAfter   time.Time
}

const staticContentColumns = `cache_key, source_url, request_method, request_headers, request_body,
       response_body, content_type, status_code, synced_at, refresh_after,
       last_attempt_at, last_error, created_at, updated_at`

func scanStaticContent(row interface{ Scan(...any) error }) (StaticContentSnapshot, error) {
	var item StaticContentSnapshot
	err := row.Scan(
		&item.CacheKey, &item.SourceURL, &item.RequestMethod, &item.RequestHeaders, &item.RequestBody,
		&item.ResponseBody, &item.ContentType, &item.StatusCode, &item.SyncedAt, &item.RefreshAfter,
		&item.LastAttemptAt, &item.LastError, &item.CreatedAt, &item.UpdatedAt,
	)
	return item, err
}

func (r StaticContentRepo) Get(ctx context.Context, cacheKey string) (StaticContentSnapshot, error) {
	return scanStaticContent(r.DB.QueryRow(ctx, `SELECT `+staticContentColumns+`
FROM static_content_snapshots WHERE cache_key = $1;`, cacheKey))
}

func (r StaticContentRepo) Upsert(ctx context.Context, in StaticContentInput) (StaticContentSnapshot, error) {
	headers := in.RequestHeaders
	if len(headers) == 0 {
		headers = json.RawMessage(`{}`)
	}
	requestBody := in.RequestBody
	if requestBody == nil {
		requestBody = []byte{}
	}
	return scanStaticContent(r.DB.QueryRow(ctx, `
INSERT INTO static_content_snapshots (
  cache_key, source_url, request_method, request_headers, request_body,
  response_body, content_type, status_code, synced_at, refresh_after, last_attempt_at, last_error
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9, now(), '')
ON CONFLICT (cache_key) DO UPDATE SET
  source_url = EXCLUDED.source_url,
  request_method = EXCLUDED.request_method,
  request_headers = EXCLUDED.request_headers,
  request_body = EXCLUDED.request_body,
  response_body = EXCLUDED.response_body,
  content_type = EXCLUDED.content_type,
  status_code = EXCLUDED.status_code,
  synced_at = now(),
  refresh_after = EXCLUDED.refresh_after,
  last_attempt_at = now(),
  last_error = ''
RETURNING `+staticContentColumns+`;`,
		in.CacheKey, in.SourceURL, in.RequestMethod, headers, requestBody,
		in.ResponseBody, in.ContentType, in.StatusCode, in.RefreshAfter,
	))
}

func (r StaticContentRepo) MarkFailure(ctx context.Context, cacheKey string, retryAfter time.Time, message string) error {
	_, err := r.DB.Exec(ctx, `
UPDATE static_content_snapshots
SET last_attempt_at = now(), last_error = $2, refresh_after = $3
WHERE cache_key = $1;`, cacheKey, message, retryAfter)
	return err
}

func (r StaticContentRepo) ListDue(ctx context.Context, limit int) ([]StaticContentSnapshot, error) {
	rows, err := r.DB.Query(ctx, `SELECT `+staticContentColumns+`
FROM static_content_snapshots
WHERE refresh_after <= now()
ORDER BY refresh_after ASC
LIMIT $1;`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]StaticContentSnapshot, 0)
	for rows.Next() {
		item, scanErr := scanStaticContent(rows)
		if scanErr != nil {
			return nil, scanErr
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
