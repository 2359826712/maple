package repo

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantRepo struct {
	DB *pgxpool.Pool
}

type Tenant struct {
	ID     string `json:"id"`
	Key    string `json:"key"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

func (r TenantRepo) ListTenants(ctx context.Context) ([]Tenant, error) {
	const q = `
SELECT id::text, key::text, name, status
FROM tenant
ORDER BY created_at DESC;
`
	rows, err := r.DB.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Tenant
	for rows.Next() {
		var t Tenant
		if err := rows.Scan(&t.ID, &t.Key, &t.Name, &t.Status); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

