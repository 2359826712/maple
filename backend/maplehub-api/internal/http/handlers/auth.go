package handlers

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"maplehub/internal/config"
	"maplehub/internal/http/middleware"
	"maplehub/internal/repo"
)

type AuthHandler struct {
	Cfg            config.Config
	Repo           repo.AuthRepo
	GoogleVerifier GoogleTokenVerifier
}

type signupReq struct {
	Email       string `json:"email"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Password    string `json:"password"`
	AutoLogin   bool   `json:"auto_login"`
}

type loginReq struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	AutoLogin bool   `json:"auto_login"`
}

type googleLoginReq struct {
	Credential string `json:"credential"`
	AutoLogin  bool   `json:"auto_login"`
}

type tokenResp struct {
	AccessToken        string     `json:"access_token"`
	AccessExpiresAt    time.Time  `json:"access_expires_at"`
	AutoLoginExpiresAt *time.Time `json:"auto_login_expires_at,omitempty"`
	User               repo.User  `json:"user"`
	TenantID           string     `json:"tenant_id"`
	Permissions        []string   `json:"permissions"`
}

const autoLoginDuration = 7 * 24 * time.Hour
const refreshCookieName = "maplehub_refresh"

func (h AuthHandler) Signup(c *fiber.Ctx) error {
	var req signupReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || len(req.Password) < 8 {
		return fiber.NewError(fiber.StatusBadRequest, "valid email and password of at least 8 characters required")
	}

	pwHashBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "hash password failed")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	u, err := h.Repo.CreateUser(ctx, req.Email, req.Username, req.DisplayName, string(pwHashBytes))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "create user failed")
	}

	tenantID, err := h.Repo.GetDefaultTenantID(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "default tenant missing")
	}

	// join default tenant; first user can be admin later (这里先统一给 editor，避免误开放 admin)
	if err := h.Repo.EnsureTenantMember(ctx, tenantID, u.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "join tenant failed")
	}
	_ = h.Repo.AssignRole(ctx, tenantID, u.ID, "editor")

	token, accessExpiresAt, err := signAccessToken(h.Cfg, tenantID, u.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "sign token failed")
	}

	u.PasswordHash = ""
	autoLoginExpiresAt, err := h.configureAutoLogin(c, ctx, u.ID, req.AutoLogin)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "create session failed")
	}
	_ = h.Repo.RecordLogin(ctx, u.ID)
	permissions, _ := h.Repo.ListPermissions(ctx, tenantID, u.ID)
	return c.JSON(tokenResp{AccessToken: token, AccessExpiresAt: accessExpiresAt, AutoLoginExpiresAt: autoLoginExpiresAt, User: u, TenantID: tenantID, Permissions: permissions})
}

func (h AuthHandler) Login(c *fiber.Ctx) error {
	var req loginReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if req.Email == "" || req.Password == "" {
		return fiber.NewError(fiber.StatusBadRequest, "email/password required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()

	u, err := h.Repo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return fiber.ErrUnauthorized
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return fiber.ErrUnauthorized
	}
	if u.Status != "active" {
		return fiber.ErrUnauthorized
	}

	tenantID, err := h.Repo.GetDefaultTenantID(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "default tenant missing")
	}

	// Ensure membership exists so RBAC queries don't 404.
	_ = h.Repo.EnsureTenantMember(ctx, tenantID, u.ID)
	_ = h.Repo.AssignRole(ctx, tenantID, u.ID, "viewer")

	token, accessExpiresAt, err := signAccessToken(h.Cfg, tenantID, u.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "sign token failed")
	}

	u.PasswordHash = ""
	autoLoginExpiresAt, err := h.configureAutoLogin(c, ctx, u.ID, req.AutoLogin)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "create session failed")
	}
	_ = h.Repo.RecordLogin(ctx, u.ID)
	permissions, _ := h.Repo.ListPermissions(ctx, tenantID, u.ID)
	return c.JSON(tokenResp{AccessToken: token, AccessExpiresAt: accessExpiresAt, AutoLoginExpiresAt: autoLoginExpiresAt, User: u, TenantID: tenantID, Permissions: permissions})
}

func (h AuthHandler) Google(c *fiber.Ctx) error {
	var req googleLoginReq
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid json")
	}
	if strings.TrimSpace(req.Credential) == "" {
		return fiber.NewError(fiber.StatusBadRequest, "google credential required")
	}

	ctx, cancel := context.WithTimeout(c.UserContext(), 10*time.Second)
	defer cancel()
	verifier := h.GoogleVerifier
	if verifier == nil {
		verifier = HTTPGoogleTokenVerifier{}
	}
	identity, err := verifier.Verify(ctx, req.Credential, h.Cfg.GoogleClientID)
	if err != nil {
		return fiber.ErrUnauthorized
	}

	u, err := h.Repo.UpsertGoogleUser(ctx, identity.Email, googleUsername(identity), identity.Name, identity.Picture)
	if err != nil || u.Status != "active" {
		return fiber.ErrUnauthorized
	}
	tenantID, err := h.Repo.GetDefaultTenantID(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "default tenant missing")
	}
	if err := h.Repo.EnsureTenantMember(ctx, tenantID, u.ID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "join tenant failed")
	}
	_ = h.Repo.AssignRole(ctx, tenantID, u.ID, "viewer")

	token, accessExpiresAt, err := signAccessToken(h.Cfg, tenantID, u.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "sign token failed")
	}
	u.PasswordHash = ""
	autoLoginExpiresAt, err := h.configureAutoLogin(c, ctx, u.ID, req.AutoLogin)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "create session failed")
	}
	_ = h.Repo.RecordLogin(ctx, u.ID)
	permissions, _ := h.Repo.ListPermissions(ctx, tenantID, u.ID)
	return c.JSON(tokenResp{AccessToken: token, AccessExpiresAt: accessExpiresAt, AutoLoginExpiresAt: autoLoginExpiresAt, User: u, TenantID: tenantID, Permissions: permissions})
}

func (h AuthHandler) Refresh(c *fiber.Ctx) error {
	raw := c.Cookies(refreshCookieName)
	if raw == "" {
		return fiber.ErrUnauthorized
	}
	ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
	defer cancel()
	tokenHash := hashRefreshToken(raw)
	u, autoLoginExpiresAt, err := h.Repo.GetSessionUser(ctx, tokenHash)
	if err != nil {
		h.clearRefreshCookie(c)
		return fiber.ErrUnauthorized
	}
	tenantID, err := h.Repo.GetDefaultTenantID(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "default tenant missing")
	}
	accessToken, accessExpiresAt, err := signAccessToken(h.Cfg, tenantID, u.ID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "sign token failed")
	}
	permissions, _ := h.Repo.ListPermissions(ctx, tenantID, u.ID)
	return c.JSON(tokenResp{AccessToken: accessToken, AccessExpiresAt: accessExpiresAt, AutoLoginExpiresAt: &autoLoginExpiresAt, User: u, TenantID: tenantID, Permissions: permissions})
}

func (h AuthHandler) Logout(c *fiber.Ctx) error {
	if raw := c.Cookies(refreshCookieName); raw != "" {
		ctx, cancel := context.WithTimeout(c.UserContext(), 5*time.Second)
		defer cancel()
		_ = h.Repo.RevokeSession(ctx, hashRefreshToken(raw))
	}
	h.clearRefreshCookie(c)
	return c.SendStatus(fiber.StatusNoContent)
}

func (h AuthHandler) Me(c *fiber.Ctx) error {
	permissions, _ := h.Repo.ListPermissions(c.UserContext(), middleware.TenantID(c), middleware.UserID(c))
	return c.JSON(fiber.Map{
		"user_id":     c.Locals("user_id"),
		"tenant_id":   c.Locals("tenant_id"),
		"permissions": permissions,
	})
}

func signAccessToken(cfg config.Config, tenantID, userID string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(time.Duration(cfg.JWTAccessTTLMin) * time.Minute)
	claims := middleware.AuthClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    cfg.JWTIssuer,
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
		UserID:   userID,
		TenantID: tenantID,
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err := t.SignedString([]byte(cfg.JWTSecret))
	return token, expiresAt, err
}

func newRefreshToken() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (h AuthHandler) configureAutoLogin(c *fiber.Ctx, ctx context.Context, userID string, enabled bool) (*time.Time, error) {
	if old := c.Cookies(refreshCookieName); old != "" {
		_ = h.Repo.RevokeSession(ctx, hashRefreshToken(old))
	}
	if !enabled {
		h.clearRefreshCookie(c)
		return nil, nil
	}
	raw, err := newRefreshToken()
	if err != nil {
		return nil, err
	}
	expiresAt := time.Now().Add(autoLoginDuration)
	if err := h.Repo.CreateSession(ctx, userID, hashRefreshToken(raw), c.Get("User-Agent"), c.IP(), expiresAt); err != nil {
		return nil, err
	}
	c.Cookie(&fiber.Cookie{
		Name: refreshCookieName, Value: raw, Path: "/api/auth", HTTPOnly: true,
		Secure: h.Cfg.Env != "dev", SameSite: fiber.CookieSameSiteLaxMode,
		Expires: expiresAt, MaxAge: int(autoLoginDuration.Seconds()),
	})
	return &expiresAt, nil
}

func (h AuthHandler) clearRefreshCookie(c *fiber.Ctx) {
	c.Cookie(&fiber.Cookie{
		Name: refreshCookieName, Value: "", Path: "/api/auth", HTTPOnly: true,
		Secure: h.Cfg.Env != "dev", SameSite: fiber.CookieSameSiteLaxMode,
		Expires: time.Unix(0, 0), MaxAge: -1,
	})
}
