package repo

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

func TestFeedbackLifecycleWithDatabase(t *testing.T) {
	_ = godotenv.Load("../../.env")
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		t.Skip("DATABASE_URL is not configured")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Skipf("database unavailable: %v", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		t.Skipf("database unavailable: %v", err)
	}

	var tenantID string
	if err := pool.QueryRow(ctx, `SELECT id::text FROM tenant WHERE key = 'default'`).Scan(&tenantID); err != nil {
		t.Fatal(err)
	}
	email := fmt.Sprintf("feedback-test-%d@example.invalid", time.Now().UnixNano())
	var userID string
	if err := pool.QueryRow(ctx, `INSERT INTO app_user (email, display_name) VALUES ($1, 'Feedback Test') RETURNING id::text`, email).Scan(&userID); err != nil {
		t.Fatal(err)
	}
	defer pool.Exec(context.Background(), `DELETE FROM app_user WHERE id = $1::uuid`, userID)

	repository := FeedbackRepo{DB: pool}
	created, err := repository.Create(ctx, tenantID, "bug", "Feedback repository test", "The feedback lifecycle should persist.", email, "en", "https://mpstorys.com/feedback")
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Exec(context.Background(), `DELETE FROM site_feedback WHERE id = $1::uuid`, created.ID)

	items, err := repository.List(ctx, tenantID, "new", "repository test")
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 1 || items[0].ID != created.ID {
		t.Fatalf("expected created feedback, got %#v", items)
	}

	updated, err := repository.Update(ctx, tenantID, created.ID, "resolved", "Verified", userID)
	if err != nil {
		t.Fatal(err)
	}
	if updated.Status != "resolved" || updated.AdminNote != "Verified" || updated.HandledAt == nil {
		t.Fatalf("unexpected updated feedback: %#v", updated)
	}
}
