package repo

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TelemetryRepo struct {
	DB *pgxpool.Pool
}

type TelemetryEvent struct {
	OccurredAt time.Time
	Name       string
	Device     string
	AuthMode   string
	Properties map[string]any
	ClientHash string
}

type TelemetryCount struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
}

type TelemetryRate struct {
	Numerator   int64   `json:"numerator"`
	Denominator int64   `json:"denominator"`
	Rate        float64 `json:"rate"`
}

type TelemetryDashboard struct {
	Days                 int              `json:"days"`
	DailyPageViews       []TelemetryCount `json:"daily_page_views"`
	TopRoutes            []TelemetryCount `json:"top_routes"`
	CharacterLookups     []TelemetryCount `json:"character_lookup_outcomes"`
	ChecklistActions     []TelemetryCount `json:"checklist_actions"`
	ChecklistSaveFailure TelemetryRate    `json:"checklist_save_failure_rate"`
	SearchZeroResults    TelemetryRate    `json:"search_zero_result_rate"`
	SearchLatency        []TelemetryCount `json:"search_latency"`
	TopCanonicalSearches []TelemetryCount `json:"top_canonical_searches"`
	ToolUsage            []TelemetryCount `json:"tool_usage"`
	SessionDuration      []TelemetryCount `json:"session_duration"`
	DeviceSplit          []TelemetryCount `json:"device_split"`
	AuthSplit            []TelemetryCount `json:"auth_split"`
	ErrorFrequency       []TelemetryCount `json:"error_frequency"`
	APIFailures          []TelemetryCount `json:"api_failures"`
}

func (r TelemetryRepo) InsertBatch(ctx context.Context, events []TelemetryEvent) error {
	if len(events) == 0 {
		return nil
	}
	tx, err := r.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// The pseudonymous client hash and its event row share the same 30-day retention.
	if _, err := tx.Exec(ctx, `DELETE FROM telemetry_event WHERE received_at < now() - interval '30 days'`); err != nil {
		return err
	}
	for _, event := range events {
		properties, err := json.Marshal(event.Properties)
		if err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
INSERT INTO telemetry_event (occurred_at, name, device, auth_mode, properties, client_hash)
VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
			event.OccurredAt, event.Name, event.Device, event.AuthMode, properties, event.ClientHash,
		); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func scanTelemetryCounts(ctx context.Context, db *pgxpool.Pool, query string, args ...any) ([]TelemetryCount, error) {
	rows, err := db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]TelemetryCount, 0)
	for rows.Next() {
		var item TelemetryCount
		if err := rows.Scan(&item.Key, &item.Count); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (r TelemetryRepo) Dashboard(ctx context.Context, days int) (TelemetryDashboard, error) {
	if days < 1 || days > 30 {
		days = 14
	}
	interval := fmt.Sprintf("%d days", days)
	dashboard := TelemetryDashboard{Days: days}
	var err error

	dashboard.DailyPageViews, err = scanTelemetryCounts(ctx, r.DB, `
SELECT to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD'), count(*)
FROM telemetry_event WHERE name = 'page_view' AND occurred_at >= now() - $1::interval
GROUP BY 1 ORDER BY 1`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.TopRoutes, err = scanTelemetryCounts(ctx, r.DB, `
SELECT properties->>'route', count(*) FROM telemetry_event
WHERE name = 'page_view' AND occurred_at >= now() - $1::interval
GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.CharacterLookups, err = scanTelemetryCounts(ctx, r.DB, `
SELECT properties->>'outcome', count(*) FROM telemetry_event
WHERE name = 'character_lookup' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.ChecklistActions, err = scanTelemetryCounts(ctx, r.DB, `
SELECT name, count(*) FROM telemetry_event
WHERE name LIKE 'checklist_%' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC`, interval)
	if err != nil {
		return dashboard, err
	}
	if err = r.DB.QueryRow(ctx, `
SELECT count(*) FILTER (WHERE properties->>'outcome' = 'failure'), count(*)
FROM telemetry_event WHERE name = 'checklist_save' AND occurred_at >= now() - $1::interval`, interval).
		Scan(&dashboard.ChecklistSaveFailure.Numerator, &dashboard.ChecklistSaveFailure.Denominator); err != nil {
		return dashboard, err
	}
	if dashboard.ChecklistSaveFailure.Denominator > 0 {
		dashboard.ChecklistSaveFailure.Rate = float64(dashboard.ChecklistSaveFailure.Numerator) / float64(dashboard.ChecklistSaveFailure.Denominator)
	}
	if err = r.DB.QueryRow(ctx, `
SELECT count(*) FILTER (WHERE (properties->>'resultCount')::int = 0), count(*)
FROM telemetry_event WHERE name = 'search_submit' AND occurred_at >= now() - $1::interval`, interval).
		Scan(&dashboard.SearchZeroResults.Numerator, &dashboard.SearchZeroResults.Denominator); err != nil {
		return dashboard, err
	}
	if dashboard.SearchZeroResults.Denominator > 0 {
		dashboard.SearchZeroResults.Rate = float64(dashboard.SearchZeroResults.Numerator) / float64(dashboard.SearchZeroResults.Denominator)
	}
	dashboard.SearchLatency, err = scanTelemetryCounts(ctx, r.DB, `
SELECT properties->>'duration', count(*) FROM telemetry_event
WHERE name = 'search_submit' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.TopCanonicalSearches, err = scanTelemetryCounts(ctx, r.DB, `
SELECT properties->>'canonicalResultId', count(*) FROM telemetry_event
WHERE name = 'search_submit' AND properties ? 'canonicalResultId' AND occurred_at >= now() - $1::interval
GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.ToolUsage, err = scanTelemetryCounts(ctx, r.DB, `
SELECT properties->>'toolId', count(*) FROM telemetry_event
WHERE name = 'tool_use' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.SessionDuration, err = scanTelemetryCounts(ctx, r.DB, `
SELECT properties->>'duration', count(*) FROM telemetry_event
WHERE name = 'session_duration' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.DeviceSplit, err = scanTelemetryCounts(ctx, r.DB, `
SELECT device, count(*) FROM telemetry_event WHERE occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.AuthSplit, err = scanTelemetryCounts(ctx, r.DB, `
SELECT auth_mode, count(*) FROM telemetry_event WHERE occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.ErrorFrequency, err = scanTelemetryCounts(ctx, r.DB, `
SELECT concat(properties->>'component', ':', properties->>'errorType'), count(*) FROM telemetry_event
WHERE name = 'error_boundary' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, interval)
	if err != nil {
		return dashboard, err
	}
	dashboard.APIFailures, err = scanTelemetryCounts(ctx, r.DB, `
SELECT concat(properties->>'endpoint', ':', properties->>'status'), count(*) FROM telemetry_event
WHERE name = 'api_failure' AND occurred_at >= now() - $1::interval GROUP BY 1 ORDER BY 2 DESC LIMIT 20`, interval)
	return dashboard, err
}
