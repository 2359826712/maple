package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

type GoogleIdentity struct {
	Subject       string
	Email         string
	Name          string
	Picture       string
	ExpiresAt     time.Time
	EmailVerified bool
}

type GoogleTokenVerifier interface {
	Verify(context.Context, string, string) (GoogleIdentity, error)
}

type HTTPGoogleTokenVerifier struct {
	Client   *http.Client
	Endpoint string
}

type googleTokenInfo struct {
	Audience      string          `json:"aud"`
	Issuer        string          `json:"iss"`
	Subject       string          `json:"sub"`
	Email         string          `json:"email"`
	EmailVerified json.RawMessage `json:"email_verified"`
	Name          string          `json:"name"`
	Picture       string          `json:"picture"`
	Expires       json.RawMessage `json:"exp"`
}

func rawClaimString(value json.RawMessage) string {
	var text string
	if json.Unmarshal(value, &text) == nil {
		return text
	}
	var number json.Number
	if json.Unmarshal(value, &number) == nil {
		return number.String()
	}
	var boolean bool
	if json.Unmarshal(value, &boolean) == nil {
		return strconv.FormatBool(boolean)
	}
	return ""
}

func (v HTTPGoogleTokenVerifier) Verify(ctx context.Context, credential, clientID string) (GoogleIdentity, error) {
	if credential == "" || clientID == "" {
		return GoogleIdentity{}, errors.New("google credential or client id is missing")
	}
	endpoint := v.Endpoint
	if endpoint == "" {
		endpoint = "https://oauth2.googleapis.com/tokeninfo"
	}
	parsed, err := url.Parse(endpoint)
	if err != nil {
		return GoogleIdentity{}, err
	}
	query := parsed.Query()
	query.Set("id_token", credential)
	parsed.RawQuery = query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, parsed.String(), nil)
	if err != nil {
		return GoogleIdentity{}, err
	}
	client := v.Client
	if client == nil {
		client = &http.Client{Timeout: 7 * time.Second}
	}
	response, err := client.Do(req)
	if err != nil {
		return GoogleIdentity{}, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return GoogleIdentity{}, fmt.Errorf("google rejected credential with status %d", response.StatusCode)
	}
	var info googleTokenInfo
	if err := json.NewDecoder(response.Body).Decode(&info); err != nil {
		return GoogleIdentity{}, err
	}
	expiresUnix, err := strconv.ParseInt(rawClaimString(info.Expires), 10, 64)
	if err != nil {
		return GoogleIdentity{}, errors.New("google credential has an invalid expiry")
	}
	expiresAt := time.Unix(expiresUnix, 0)
	issuerOK := info.Issuer == "accounts.google.com" || info.Issuer == "https://accounts.google.com"
	email := strings.TrimSpace(strings.ToLower(info.Email))
	verified := rawClaimString(info.EmailVerified) == "true"
	if info.Audience != clientID || !issuerOK || info.Subject == "" || email == "" || !verified || !expiresAt.After(time.Now()) {
		return GoogleIdentity{}, errors.New("google credential claims are invalid")
	}
	name := strings.TrimSpace(info.Name)
	if name == "" {
		name = strings.SplitN(email, "@", 2)[0]
	}
	return GoogleIdentity{
		Subject: info.Subject, Email: email, Name: name, Picture: info.Picture,
		ExpiresAt: expiresAt, EmailVerified: verified,
	}, nil
}

func googleUsername(identity GoogleIdentity) string {
	local := strings.SplitN(identity.Email, "@", 2)[0]
	var builder strings.Builder
	for _, char := range strings.ToLower(local) {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '_' {
			builder.WriteRune(char)
		} else if builder.Len() > 0 && !strings.HasSuffix(builder.String(), "_") {
			builder.WriteByte('_')
		}
	}
	base := strings.Trim(builder.String(), "_")
	if base == "" {
		base = "mapler"
	}
	suffix := identity.Subject
	if len(suffix) > 8 {
		suffix = suffix[:8]
	}
	maximumBase := 30 - len(suffix) - 1
	if len(base) > maximumBase {
		base = base[:maximumBase]
	}
	return base + "_" + suffix
}
