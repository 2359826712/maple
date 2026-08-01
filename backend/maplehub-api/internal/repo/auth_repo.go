package repo

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthRepo struct {
	DB *pgxpool.Pool
}

func (r AuthRepo) CreateSession(ctx context.Context, userID, tokenHash, userAgent, ip string, expiresAt time.Time) error {
	_, err := r.DB.Exec(ctx, `
INSERT INTO user_session (user_id, token_hash, user_agent, ip, expires_at)
VALUES ($1::uuid, $2, $3, nullif($4, '')::inet, $5);
`, userID, tokenHash, userAgent, ip, expiresAt)
	return err
}

func (r AuthRepo) RevokeSession(ctx context.Context, tokenHash string) error {
	_, err := r.DB.Exec(ctx, `
UPDATE user_session SET revoked_at = now()
WHERE token_hash = $1 AND revoked_at IS NULL;
`, tokenHash)
	return err
}

func (r AuthRepo) GetSessionUser(ctx context.Context, tokenHash string) (User, time.Time, error) {
	const q = `
SELECT u.id::text, coalesce(u.email::text,''), coalesce(u.username::text,''), u.display_name,
       coalesce(u.avatar_url,''), '', u.status, s.expires_at
FROM user_session s
JOIN app_user u ON u.id = s.user_id
WHERE s.token_hash = $1
  AND s.revoked_at IS NULL
  AND s.expires_at > now()
  AND u.status = 'active'
LIMIT 1;
`
	var u User
	var expiresAt time.Time
	err := r.DB.QueryRow(ctx, q, tokenHash).Scan(
		&u.ID, &u.Email, &u.Username, &u.DisplayName, &u.AvatarURL, &u.PasswordHash, &u.Status, &expiresAt,
	)
	return u, expiresAt, err
}

func (r AuthRepo) RecordLogin(ctx context.Context, userID string) error {
	_, err := r.DB.Exec(ctx, `UPDATE app_user SET last_login_at = now() WHERE id = $1::uuid;`, userID)
	return err
}

type User struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	Username     string `json:"username"`
	DisplayName  string `json:"display_name"`
	AvatarURL    string `json:"avatar_url"`
	PasswordHash string `json:"-"`
	Status       string `json:"status"`
}

func (r AuthRepo) CreateUser(ctx context.Context, email, username, displayName, passwordHash string) (User, error) {
	const q = `
INSERT INTO app_user (email, username, display_name, password_hash)
VALUES ($1, $2, $3, $4)
RETURNING id::text, coalesce(email::text,''), coalesce(username::text,''), display_name, coalesce(avatar_url,''), coalesce(password_hash,''), status;
`
	var u User
	err := r.DB.QueryRow(ctx, q, email, username, displayName, passwordHash).Scan(
		&u.ID, &u.Email, &u.Username, &u.DisplayName, &u.AvatarURL, &u.PasswordHash, &u.Status,
	)
	return u, err
}

func (r AuthRepo) GetUserByEmail(ctx context.Context, email string) (User, error) {
	const q = `
SELECT id::text, coalesce(email::text,''), coalesce(username::text,''), display_name, coalesce(avatar_url,''), coalesce(password_hash,''), status
FROM app_user
WHERE email = $1
LIMIT 1;
`
	var u User
	err := r.DB.QueryRow(ctx, q, email).Scan(
		&u.ID, &u.Email, &u.Username, &u.DisplayName, &u.AvatarURL, &u.PasswordHash, &u.Status,
	)
	return u, err
}

func (r AuthRepo) UpsertGoogleUser(ctx context.Context, email, username, displayName, avatarURL string) (User, error) {
	const q = `
INSERT INTO app_user (email, username, display_name, avatar_url, password_hash, last_login_at)
VALUES ($1, $2, $3, nullif($4, ''), NULL, now())
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  last_login_at = now()
RETURNING id::text, coalesce(email::text,''), coalesce(username::text,''), display_name,
          coalesce(avatar_url,''), coalesce(password_hash,''), status;
`
	var u User
	err := r.DB.QueryRow(ctx, q, email, username, displayName, avatarURL).Scan(
		&u.ID, &u.Email, &u.Username, &u.DisplayName, &u.AvatarURL, &u.PasswordHash, &u.Status,
	)
	return u, err
}

func (r AuthRepo) GetDefaultTenantID(ctx context.Context) (string, error) {
	const q = `SELECT id::text FROM tenant WHERE key = 'default' LIMIT 1;`
	var id string
	if err := r.DB.QueryRow(ctx, q).Scan(&id); err != nil {
		return "", err
	}
	return id, nil
}

func (r AuthRepo) EnsureTenantMember(ctx context.Context, tenantID, userID string) error {
	const q = `
INSERT INTO tenant_member (tenant_id, user_id)
VALUES ($1, $2)
ON CONFLICT DO NOTHING;
`
	_, err := r.DB.Exec(ctx, q, tenantID, userID)
	return err
}

func (r AuthRepo) AssignRole(ctx context.Context, tenantID, userID, roleKey string) error {
	const q = `
INSERT INTO tenant_member_role (tenant_id, user_id, role_id)
SELECT $1, $2, r.id
FROM role r
WHERE r.key = $3
ON CONFLICT DO NOTHING;
`
	ct, err := r.DB.Exec(ctx, q, tenantID, userID, roleKey)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		var exists bool
		if err := r.DB.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM role WHERE key = $1);`, roleKey).Scan(&exists); err != nil {
			return err
		}
		if !exists {
			return errors.New("role not found")
		}
	}
	return nil
}

func (r AuthRepo) ListPermissions(ctx context.Context, tenantID, userID string) ([]string, error) {
	rows, err := r.DB.Query(ctx, `
SELECT DISTINCT p.key::text
FROM tenant_member_role tmr
JOIN role_permission rp ON rp.role_id = tmr.role_id
JOIN permission p ON p.id = rp.permission_id
WHERE tmr.tenant_id = $1::uuid AND tmr.user_id = $2::uuid
ORDER BY p.key;
`, tenantID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	permissions := make([]string, 0)
	for rows.Next() {
		var permission string
		if err := rows.Scan(&permission); err != nil {
			return nil, err
		}
		permissions = append(permissions, permission)
	}
	return permissions, rows.Err()
}

func (r AuthRepo) UpsertPasswordUser(ctx context.Context, email, displayName, passwordHash string) (User, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	const q = `
INSERT INTO app_user (email, display_name, password_hash, status)
VALUES ($1, $2, $3, 'active')
ON CONFLICT (email) DO UPDATE SET
  display_name = CASE WHEN EXCLUDED.display_name = '' THEN app_user.display_name ELSE EXCLUDED.display_name END,
  password_hash = EXCLUDED.password_hash,
  status = 'active'
RETURNING id::text, coalesce(email::text,''), coalesce(username::text,''), display_name,
          coalesce(avatar_url,''), coalesce(password_hash,''), status;
`
	var u User
	err := r.DB.QueryRow(ctx, q, email, displayName, passwordHash).Scan(
		&u.ID, &u.Email, &u.Username, &u.DisplayName, &u.AvatarURL, &u.PasswordHash, &u.Status,
	)
	return u, err
}
