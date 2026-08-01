package repo

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantLookupRepo struct {
	DB *pgxpool.Pool
}

func (r TenantLookupRepo) GetTenantIDByKey(ctx context.Context, key string) (string, error) {
	const q = `SELECT id::text FROM tenant WHERE key = $1 LIMIT 1;`
	var id string
	if err := r.DB.QueryRow(ctx, q, key).Scan(&id); err != nil {
		return "", err
	}
	return id, nil
}

