package repo

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CharacterRepo struct {
	DB *pgxpool.Pool
}

type CharacterProfile struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	ClassName string    `json:"class_name"`
	Level     int       `json:"level"`
	Server    string    `json:"server"`
	World     string    `json:"world"`
	IsDefault bool      `json:"is_default"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CharacterInput struct {
	Name      string `json:"name"`
	ClassName string `json:"class_name"`
	Level     int    `json:"level"`
	Server    string `json:"server"`
	World     string `json:"world"`
}

type BossChecklistEntry struct {
	BossID         string    `json:"boss_id"`
	Difficulty     string    `json:"difficulty"`
	CompletedCount int       `json:"completed_count"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func (r CharacterRepo) ListCharacters(ctx context.Context, userID string) ([]CharacterProfile, error) {
	rows, err := r.DB.Query(ctx, `
SELECT id::text, user_id::text, name, class_name, level, server, world, is_default, sort_order, created_at, updated_at
FROM character_profile
WHERE user_id = $1
ORDER BY sort_order, created_at;
`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []CharacterProfile
	for rows.Next() {
		var item CharacterProfile
		if err := rows.Scan(&item.ID, &item.UserID, &item.Name, &item.ClassName, &item.Level, &item.Server, &item.World, &item.IsDefault, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (r CharacterRepo) CreateCharacter(ctx context.Context, userID string, in CharacterInput) (CharacterProfile, error) {
	var item CharacterProfile
	err := r.DB.QueryRow(ctx, `
INSERT INTO character_profile (user_id, name, class_name, level, server, world)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id::text, user_id::text, name, class_name, level, server, world, is_default, sort_order, created_at, updated_at;
`, userID, in.Name, in.ClassName, in.Level, in.Server, in.World).Scan(
		&item.ID, &item.UserID, &item.Name, &item.ClassName, &item.Level, &item.Server, &item.World, &item.IsDefault, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt,
	)
	return item, err
}

func (r CharacterRepo) UpdateCharacter(ctx context.Context, userID, charID string, in CharacterInput) (CharacterProfile, error) {
	var item CharacterProfile
	err := r.DB.QueryRow(ctx, `
UPDATE character_profile
SET name = $3, class_name = $4, level = $5, server = $6, world = $7, updated_at = now()
WHERE id = $1::uuid AND user_id = $2::uuid
RETURNING id::text, user_id::text, name, class_name, level, server, world, is_default, sort_order, created_at, updated_at;
`, charID, userID, in.Name, in.ClassName, in.Level, in.Server, in.World).Scan(
		&item.ID, &item.UserID, &item.Name, &item.ClassName, &item.Level, &item.Server, &item.World, &item.IsDefault, &item.SortOrder, &item.CreatedAt, &item.UpdatedAt,
	)
	return item, err
}

func (r CharacterRepo) DeleteCharacter(ctx context.Context, userID, charID string) error {
	_, err := r.DB.Exec(ctx, `DELETE FROM character_profile WHERE id = $1::uuid AND user_id = $2::uuid;`, charID, userID)
	return err
}

func (r CharacterRepo) GetChecklist(ctx context.Context, charID string) ([]BossChecklistEntry, error) {
	rows, err := r.DB.Query(ctx, `
SELECT boss_id, difficulty, completed_count, updated_at
FROM character_boss_checklist
WHERE character_id = $1::uuid;
`, charID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []BossChecklistEntry
	for rows.Next() {
		var item BossChecklistEntry
		if err := rows.Scan(&item.BossID, &item.Difficulty, &item.CompletedCount, &item.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, item)
	}
	return out, rows.Err()
}

func (r CharacterRepo) UpsertChecklistEntry(ctx context.Context, charID, bossID, difficulty string, count int) error {
	_, err := r.DB.Exec(ctx, `
INSERT INTO character_boss_checklist (character_id, boss_id, difficulty, completed_count, updated_at)
VALUES ($1::uuid, $2, $3, $4, now())
ON CONFLICT (character_id, boss_id, difficulty) DO UPDATE SET
  completed_count = EXCLUDED.completed_count,
  updated_at = now();
`, charID, bossID, difficulty, count)
	return err
}

func (r CharacterRepo) BulkUpsertChecklist(ctx context.Context, charID string, entries []BossChecklistEntry) error {
	for _, e := range entries {
		if err := r.UpsertChecklistEntry(ctx, charID, e.BossID, e.Difficulty, e.CompletedCount); err != nil {
			return err
		}
	}
	return nil
}
