package repo

import (
	"context"
	"encoding/json"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AccountDataRepo struct {
	DB *pgxpool.Pool
}

type AccountPlayerData struct {
	Data      map[string]string `json:"data"`
	Revision  int64             `json:"revision"`
	UpdatedAt time.Time         `json:"updated_at"`
}

func (r AccountDataRepo) Get(ctx context.Context, userID string) (AccountPlayerData, error) {
	var raw []byte
	var item AccountPlayerData
	err := r.DB.QueryRow(ctx, `
SELECT data, revision, updated_at
FROM account_player_data
WHERE user_id = $1::uuid;
`, userID).Scan(&raw, &item.Revision, &item.UpdatedAt)
	if err != nil {
		return item, err
	}
	if err := json.Unmarshal(raw, &item.Data); err != nil {
		return AccountPlayerData{}, err
	}
	return item, nil
}

func (r AccountDataRepo) Upsert(ctx context.Context, userID string, data map[string]string) (AccountPlayerData, error) {
	raw, err := json.Marshal(data)
	if err != nil {
		return AccountPlayerData{}, err
	}
	var item AccountPlayerData
	var stored []byte
	err = r.DB.QueryRow(ctx, `
INSERT INTO account_player_data (user_id, data)
VALUES ($1::uuid, $2::jsonb)
ON CONFLICT (user_id) DO UPDATE SET
  data = EXCLUDED.data,
  revision = account_player_data.revision + 1,
  updated_at = now()
RETURNING data, revision, updated_at;
`, userID, raw).Scan(&stored, &item.Revision, &item.UpdatedAt)
	if err != nil {
		return AccountPlayerData{}, err
	}
	if err := json.Unmarshal(stored, &item.Data); err != nil {
		return AccountPlayerData{}, err
	}
	return item, nil
}
