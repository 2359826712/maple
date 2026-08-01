package middleware

import (
	"context"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
)

// RequirePermission is a minimal RBAC gate.
// It checks: tenant_member_role -> role_permission -> permission.key
// If you need more performance later: cache user perms in Redis/in-memory with short TTL.
func RequirePermission(db *pgxpool.Pool, permissionKey string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := UserID(c)
		tenantID := TenantID(c)
		if userID == "" || tenantID == "" {
			return fiber.ErrUnauthorized
		}

		const q = `
SELECT 1
FROM tenant_member_role tmr
JOIN role_permission rp ON rp.role_id = tmr.role_id
JOIN permission p ON p.id = rp.permission_id
WHERE tmr.tenant_id = $1 AND tmr.user_id = $2 AND p.key = $3
LIMIT 1;
`
		var one int
		err := db.QueryRow(context.Background(), q, tenantID, userID, permissionKey).Scan(&one)
		if err != nil {
			// treat missing row as forbidden
			return fiber.ErrForbidden
		}
		return c.Next()
	}
}

