package repo

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type WikiMirrorRepo struct {
	DB *pgxpool.Pool
}

type WikiMirrorSource struct {
	Key          string     `json:"key"`
	Name         string     `json:"name"`
	APIURL       string     `json:"api_url"`
	PageURLBase  string     `json:"page_url_base"`
	License      string     `json:"license"`
	LastSyncedAt *time.Time `json:"last_synced_at,omitempty"`
}

type WikiMirrorPage struct {
	ID             string     `json:"id"`
	SourceKey      string     `json:"source_key"`
	SourcePageID   int64      `json:"source_page_id"`
	Namespace      int        `json:"namespace"`
	Title          string     `json:"title"`
	Slug           string     `json:"slug"`
	Category       string     `json:"category"`
	SourceURL      string     `json:"source_url"`
	Extract        string     `json:"extract"`
	ContentText    string     `json:"content_text,omitempty"`
	ContentHTML    string     `json:"content_html,omitempty"`
	WordCount      int        `json:"word_count"`
	RevisionID     *int64     `json:"revision_id,omitempty"`
	TouchedAt      *time.Time `json:"touched_at,omitempty"`
	Tags           []string   `json:"tags"`
	AssetURLs      []string   `json:"asset_urls,omitempty"`
	TemplateTitles []string   `json:"template_titles,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type WikiMirrorSyncState struct {
	SourceKey      string     `json:"source_key"`
	Namespace      int        `json:"namespace"`
	ContinueToken  string     `json:"continue_token"`
	Status         string     `json:"status"`
	Message        string     `json:"message"`
	ProcessedPages int        `json:"processed_pages"`
	StartedAt      *time.Time `json:"started_at,omitempty"`
	FinishedAt     *time.Time `json:"finished_at,omitempty"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type WikiMirrorPageInput struct {
	SourceKey      string
	SourcePageID   int64
	Namespace      int
	Title          string
	Slug           string
	Category       string
	SourceURL      string
	Extract        string
	ContentText    string
	ContentHTML    string
	WordCount      int
	RevisionID     *int64
	TouchedAt      *time.Time
	Tags           []string
	AssetURLs      []string
	TemplateTitles []string
}

type WikiMirrorTemplateInput struct {
	SourceKey    string
	SourcePageID int64
	Title        string
	ContentText  string
	ContentHTML  string
}

type WikiMirrorListOptions struct {
	Query     string
	Category  string
	SourceKey string
	Namespace *int
	Limit     int
	Offset    int
}

func (r WikiMirrorRepo) ListSources(ctx context.Context) ([]WikiMirrorSource, error) {
	rows, err := r.DB.Query(ctx, `
SELECT key, name, api_url, page_url_base, license, last_synced_at
FROM wiki_mirror_source
ORDER BY key;
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []WikiMirrorSource
	for rows.Next() {
		var item WikiMirrorSource
		if err := rows.Scan(&item.Key, &item.Name, &item.APIURL, &item.PageURLBase, &item.License, &item.LastSyncedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (r WikiMirrorRepo) ListPages(ctx context.Context, opts WikiMirrorListOptions) ([]WikiMirrorPage, error) {
	limit := opts.Limit
	if limit <= 0 || limit > 1000 {
		limit = 100
	}
	offset := opts.Offset
	if offset < 0 {
		offset = 0
	}

	args := []any{}
	clauses := []string{}
	if opts.Namespace != nil {
		args = append(args, *opts.Namespace)
		clauses = append(clauses, "namespace = $"+itoa(len(args)))
	} else {
		clauses = append(clauses, "namespace = 0")
	}
	if opts.SourceKey != "" {
		args = append(args, opts.SourceKey)
		clauses = append(clauses, "source_key = $"+itoa(len(args)))
	}
	if opts.Category != "" {
		args = append(args, opts.Category)
		clauses = append(clauses, "category = $"+itoa(len(args)))
	}
	if strings.TrimSpace(opts.Query) != "" {
		args = append(args, strings.TrimSpace(opts.Query))
		n := itoa(len(args))
		clauses = append(clauses, "(search_vector @@ websearch_to_tsquery('simple', $"+n+") OR title ILIKE '%' || $"+n+" || '%')")
	}
	args = append(args, limit, offset)
	limitArg := itoa(len(args) - 1)
	offsetArg := itoa(len(args))

	orderBy := "title ASC"
	if strings.TrimSpace(opts.Query) != "" {
		orderBy = "ts_rank(search_vector, websearch_to_tsquery('simple', $" + itoa(len(args)-2) + ")) DESC, title ASC"
	}

	q := `
SELECT id::text, source_key, source_page_id, namespace, title, slug, category, source_url,
       extract, '' AS content_text, '' AS content_html, word_count, revision_id, touched_at,
       tags, created_at, updated_at
FROM wiki_mirror_page
WHERE ` + strings.Join(clauses, " AND ") + `
ORDER BY ` + orderBy + `
LIMIT $` + limitArg + ` OFFSET $` + offsetArg + `;
`
	rows, err := r.DB.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanMirrorPages(rows)
}

func (r WikiMirrorRepo) GetPageByTitle(ctx context.Context, sourceKey, title string, namespace *int) (WikiMirrorPage, error) {
	var item WikiMirrorPage
	normalizedTitle := strings.ReplaceAll(strings.TrimSpace(title), "_", " ")
	err := r.DB.QueryRow(ctx, `
SELECT p.id::text, p.source_key, p.source_page_id, p.namespace, p.title, p.slug, p.category, p.source_url,
       p.extract, p.content_text, p.content_html, p.word_count, p.revision_id, p.touched_at,
       p.tags, p.created_at, p.updated_at,
       COALESCE(array_agg(DISTINCT a.url) FILTER (WHERE a.url <> ''), '{}') AS asset_urls,
       COALESCE(array_agg(DISTINCT t.title) FILTER (WHERE t.title <> ''), '{}') AS template_titles
FROM wiki_mirror_page p
LEFT JOIN wiki_mirror_page_asset pa ON pa.page_id = p.id
LEFT JOIN wiki_mirror_asset a ON a.id = pa.asset_id
LEFT JOIN wiki_mirror_template t ON t.source_key = p.source_key AND p.content_text ILIKE '%' || t.title || '%'
WHERE ($1::text = '' OR p.source_key = $1)
  AND ($4::int IS NULL OR p.namespace = $4)
  AND (LOWER(p.title) = LOWER($2) OR LOWER(REPLACE(p.title, '_', ' ')) = LOWER($3))
GROUP BY p.id
ORDER BY CASE
  WHEN p.title = $2 THEN 0
  WHEN REPLACE(p.title, '_', ' ') = $3 THEN 1
  ELSE 2
END
LIMIT 1;
`, sourceKey, title, normalizedTitle, namespace).Scan(
		&item.ID, &item.SourceKey, &item.SourcePageID, &item.Namespace, &item.Title, &item.Slug, &item.Category, &item.SourceURL,
		&item.Extract, &item.ContentText, &item.ContentHTML, &item.WordCount, &item.RevisionID, &item.TouchedAt,
		&item.Tags, &item.CreatedAt, &item.UpdatedAt, &item.AssetURLs, &item.TemplateTitles,
	)
	return item, err
}

func (r WikiMirrorRepo) GetPage(ctx context.Context, sourceKey string, sourcePageID int64) (WikiMirrorPage, error) {
	var item WikiMirrorPage
	err := r.DB.QueryRow(ctx, `
SELECT p.id::text, p.source_key, p.source_page_id, p.namespace, p.title, p.slug, p.category, p.source_url,
       p.extract, p.content_text, p.content_html, p.word_count, p.revision_id, p.touched_at,
       p.tags, p.created_at, p.updated_at,
       COALESCE(array_agg(DISTINCT a.url) FILTER (WHERE a.url <> ''), '{}') AS asset_urls,
       COALESCE(array_agg(DISTINCT t.title) FILTER (WHERE t.title <> ''), '{}') AS template_titles
FROM wiki_mirror_page p
LEFT JOIN wiki_mirror_page_asset pa ON pa.page_id = p.id
LEFT JOIN wiki_mirror_asset a ON a.id = pa.asset_id
LEFT JOIN wiki_mirror_template t ON t.source_key = p.source_key AND p.content_text ILIKE '%' || t.title || '%'
WHERE p.source_key = $1 AND p.source_page_id = $2
GROUP BY p.id;
`, sourceKey, sourcePageID).Scan(
		&item.ID, &item.SourceKey, &item.SourcePageID, &item.Namespace, &item.Title, &item.Slug, &item.Category, &item.SourceURL,
		&item.Extract, &item.ContentText, &item.ContentHTML, &item.WordCount, &item.RevisionID, &item.TouchedAt,
		&item.Tags, &item.CreatedAt, &item.UpdatedAt, &item.AssetURLs, &item.TemplateTitles,
	)
	return item, err
}

func (r WikiMirrorRepo) UpsertPage(ctx context.Context, in WikiMirrorPageInput) (string, error) {
	tx, err := r.DB.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return "", err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var pageID string
	err = tx.QueryRow(ctx, `
INSERT INTO wiki_mirror_page (
  source_key, source_page_id, namespace, title, slug, category, source_url, extract,
  content_text, content_html, word_count, revision_id, touched_at, tags, search_vector, indexed_at
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,
  setweight(to_tsvector('simple', coalesce($4, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(array_to_string($14::text[], ' '), '')), 'B') ||
  setweight(to_tsvector('simple', coalesce($8, '')), 'C') ||
  setweight(to_tsvector('simple', coalesce($9, '')), 'D'),
  now()
)
ON CONFLICT (source_key, source_page_id) DO UPDATE SET
  namespace = EXCLUDED.namespace,
  title = EXCLUDED.title,
  slug = EXCLUDED.slug,
  category = EXCLUDED.category,
  source_url = EXCLUDED.source_url,
  extract = EXCLUDED.extract,
  content_text = EXCLUDED.content_text,
  content_html = EXCLUDED.content_html,
  word_count = EXCLUDED.word_count,
  revision_id = EXCLUDED.revision_id,
  touched_at = EXCLUDED.touched_at,
  tags = EXCLUDED.tags,
  search_vector = EXCLUDED.search_vector,
  indexed_at = now()
RETURNING id::text;
`, in.SourceKey, in.SourcePageID, in.Namespace, in.Title, in.Slug, in.Category, in.SourceURL, in.Extract,
		in.ContentText, in.ContentHTML, in.WordCount, in.RevisionID, in.TouchedAt, in.Tags).Scan(&pageID)
	if err != nil {
		return "", err
	}

	if _, err := tx.Exec(ctx, `DELETE FROM wiki_mirror_page_category WHERE page_id = $1::uuid`, pageID); err != nil {
		return "", err
	}
	for _, tag := range in.Tags {
		if strings.TrimSpace(tag) == "" {
			continue
		}
		var catID string
		if err := tx.QueryRow(ctx, `
INSERT INTO wiki_mirror_category (source_key, title, slug)
VALUES ($1, $2, $3)
ON CONFLICT (source_key, title) DO UPDATE SET slug = EXCLUDED.slug
RETURNING id::text;
`, in.SourceKey, tag, slugify(tag)).Scan(&catID); err != nil {
			return "", err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO wiki_mirror_page_category (page_id, category_id)
VALUES ($1::uuid, $2::uuid)
ON CONFLICT DO NOTHING;
`, pageID, catID); err != nil {
			return "", err
		}
	}

	if _, err := tx.Exec(ctx, `DELETE FROM wiki_mirror_page_asset WHERE page_id = $1::uuid`, pageID); err != nil {
		return "", err
	}
	for _, assetURL := range in.AssetURLs {
		if strings.TrimSpace(assetURL) == "" {
			continue
		}
		var assetID string
		title := assetURL
		if idx := strings.LastIndex(assetURL, "/"); idx >= 0 && idx < len(assetURL)-1 {
			title = assetURL[idx+1:]
		}
		if err := tx.QueryRow(ctx, `
INSERT INTO wiki_mirror_asset (source_key, title, url)
VALUES ($1, $2, $3)
ON CONFLICT (source_key, title) DO UPDATE SET url = EXCLUDED.url
RETURNING id::text;
`, in.SourceKey, title, assetURL).Scan(&assetID); err != nil {
			return "", err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO wiki_mirror_page_asset (page_id, asset_id)
VALUES ($1::uuid, $2::uuid)
ON CONFLICT DO NOTHING;
`, pageID, assetID); err != nil {
			return "", err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}
	return pageID, nil
}

func (r WikiMirrorRepo) UpsertTemplate(ctx context.Context, in WikiMirrorTemplateInput) error {
	_, err := r.DB.Exec(ctx, `
INSERT INTO wiki_mirror_template (source_key, source_page_id, title, content_text, content_html, updated_at)
VALUES ($1,$2,$3,$4,$5,now())
ON CONFLICT (source_key, source_page_id) DO UPDATE SET
  title = EXCLUDED.title,
  content_text = EXCLUDED.content_text,
  content_html = EXCLUDED.content_html,
  updated_at = now();
`, in.SourceKey, in.SourcePageID, in.Title, in.ContentText, in.ContentHTML)
	return err
}

func (r WikiMirrorRepo) SetSyncState(ctx context.Context, state WikiMirrorSyncState) error {
	_, err := r.DB.Exec(ctx, `
INSERT INTO wiki_mirror_sync_state (source_key, namespace, continue_token, status, message, processed_pages, started_at, finished_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())
ON CONFLICT (source_key, namespace) DO UPDATE SET
  continue_token = EXCLUDED.continue_token,
  status = EXCLUDED.status,
  message = EXCLUDED.message,
  processed_pages = EXCLUDED.processed_pages,
  started_at = EXCLUDED.started_at,
  finished_at = EXCLUDED.finished_at,
  updated_at = now();
`, state.SourceKey, state.Namespace, state.ContinueToken, state.Status, state.Message, state.ProcessedPages, state.StartedAt, state.FinishedAt)
	return err
}

func (r WikiMirrorRepo) ListSyncStates(ctx context.Context) ([]WikiMirrorSyncState, error) {
	rows, err := r.DB.Query(ctx, `
SELECT source_key, namespace, continue_token, status, message, processed_pages, started_at, finished_at, updated_at
FROM wiki_mirror_sync_state
ORDER BY source_key, namespace;
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []WikiMirrorSyncState
	for rows.Next() {
		var item WikiMirrorSyncState
		if err := rows.Scan(&item.SourceKey, &item.Namespace, &item.ContinueToken, &item.Status, &item.Message, &item.ProcessedPages, &item.StartedAt, &item.FinishedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func scanMirrorPages(rows pgx.Rows) ([]WikiMirrorPage, error) {
	var out []WikiMirrorPage
	for rows.Next() {
		var item WikiMirrorPage
		if err := rows.Scan(
			&item.ID, &item.SourceKey, &item.SourcePageID, &item.Namespace, &item.Title, &item.Slug, &item.Category, &item.SourceURL,
			&item.Extract, &item.ContentText, &item.ContentHTML, &item.WordCount, &item.RevisionID, &item.TouchedAt,
			&item.Tags, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return string(buf[i:])
}

// ReclassifyPageRow holds the minimal data needed to re-classify a single page.
type ReclassifyPageRow struct {
	ID        string   `json:"id"`
	Title     string   `json:"title"`
	Namespace int      `json:"namespace"`
	Tags      []string `json:"tags"`
	Content   string   `json:"content"`
	Category  string   `json:"category"`
}

// LoadPagesForReclassify loads pages in batches for re-classification.
// Returns MediaWiki category tags + content_text needed by ClassifyPage.
func (r WikiMirrorRepo) LoadPagesForReclassify(ctx context.Context, sourceKey string, limit, offset int) ([]ReclassifyPageRow, error) {
	if limit <= 0 || limit > 2000 {
		limit = 500
	}
	rows, err := r.DB.Query(ctx, `
SELECT id::text, title, namespace, tags, content_text, category
FROM wiki_mirror_page
WHERE source_key = $1
ORDER BY title ASC
LIMIT $2 OFFSET $3;
`, sourceKey, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []ReclassifyPageRow
	for rows.Next() {
		var p ReclassifyPageRow
		if err := rows.Scan(&p.ID, &p.Title, &p.Namespace, &p.Tags, &p.Content, &p.Category); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// CategoryUpdate pairs a page UUID with its new category.
type CategoryUpdate struct {
	ID       string
	Category string
}

// BatchUpdateCategories updates the category column for a batch of pages.
func (r WikiMirrorRepo) BatchUpdateCategories(ctx context.Context, updates []CategoryUpdate) (int64, error) {
	if len(updates) == 0 {
		return 0, nil
	}
	ids := make([]string, len(updates))
	cats := make([]string, len(updates))
	for i, u := range updates {
		ids[i] = u.ID
		cats[i] = u.Category
	}
	tag, err := r.DB.Exec(ctx, `
UPDATE wiki_mirror_page AS p
SET category = u.cat, updated_at = now()
FROM (SELECT unnest($1::text[]) AS id, unnest($2::text[]) AS cat) AS u
WHERE p.id = u.id::uuid;
`, ids, cats)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

// CorruptedPageRow holds the minimal data needed to reparse a corrupted page.
type CorruptedPageRow struct {
	ID        string `json:"id"`
	SourceKey string `json:"source_key"`
	Title     string `json:"title"`
}

// LoadCorruptedPages finds pages where content_html looks like raw wikitext
// (contains {{ or [[ patterns but no real HTML tags like <div, <table, <p>).
func (r WikiMirrorRepo) LoadCorruptedPages(ctx context.Context, sourceKey string, limit, offset int) ([]CorruptedPageRow, error) {
	if limit <= 0 || limit > 2000 {
		limit = 500
	}
	rows, err := r.DB.Query(ctx, `
SELECT id::text, source_key, title
FROM wiki_mirror_page
WHERE source_key = $1
  AND (content_html LIKE '%{{%' OR content_html LIKE '%[[%')
  AND content_html NOT LIKE '%<div%'
  AND content_html NOT LIKE '%<table%'
  AND content_html NOT LIKE '%<p>%'
ORDER BY title ASC
LIMIT $2 OFFSET $3;
`, sourceKey, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CorruptedPageRow
	for rows.Next() {
		var p CorruptedPageRow
		if err := rows.Scan(&p.ID, &p.SourceKey, &p.Title); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// UpdatePageHTMLContent replaces the rendered HTML, plain text, extract, word count,
// and search vector for a single page. Used by the reparse endpoint to fix corrupted data.
func (r WikiMirrorRepo) UpdatePageHTMLContent(ctx context.Context, pageID, contentHTML, contentText, extract string, wordCount int) error {
	_, err := r.DB.Exec(ctx, `
UPDATE wiki_mirror_page
SET content_html = $2,
    content_text = $3,
    extract = $4,
    word_count = $5,
    search_vector = setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('simple', coalesce(array_to_string(tags::text[], ' '), '')), 'B') ||
                    setweight(to_tsvector('simple', coalesce($4, '')), 'C') ||
                    setweight(to_tsvector('simple', coalesce($3, '')), 'D'),
    indexed_at = now(),
    updated_at = now()
WHERE id = $1::uuid;
`, pageID, contentHTML, contentText, extract, wordCount)
	return err
}

func slugify(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	value = strings.ReplaceAll(value, " ", "-")
	value = strings.ReplaceAll(value, "/", "-")
	return value
}
