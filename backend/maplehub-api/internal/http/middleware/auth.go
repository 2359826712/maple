package middleware

import (
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

type AuthClaims struct {
	jwt.RegisteredClaims
	UserID   string `json:"uid"`
	TenantID string `json:"tid"`
}

const (
	ctxUserIDKey   = "user_id"
	ctxTenantIDKey = "tenant_id"
)

func UserID(c *fiber.Ctx) string {
	v, _ := c.Locals(ctxUserIDKey).(string)
	return v
}

func TenantID(c *fiber.Ctx) string {
	v, _ := c.Locals(ctxTenantIDKey).(string)
	return v
}

func AuthRequired(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		auth := c.Get("Authorization")
		if auth == "" {
			return fiber.ErrUnauthorized
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return fiber.ErrUnauthorized
		}
		rawToken := strings.TrimSpace(parts[1])
		if rawToken == "" {
			return fiber.ErrUnauthorized
		}

		token, err := jwt.ParseWithClaims(rawToken, &AuthClaims{}, func(token *jwt.Token) (any, error) {
			return []byte(jwtSecret), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
		if err != nil || !token.Valid {
			return fiber.ErrUnauthorized
		}

		claims, ok := token.Claims.(*AuthClaims)
		if !ok {
			return fiber.ErrUnauthorized
		}
		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			return fiber.ErrUnauthorized
		}

		c.Locals(ctxUserIDKey, claims.UserID)
		c.Locals(ctxTenantIDKey, claims.TenantID)
		return c.Next()
	}
}
