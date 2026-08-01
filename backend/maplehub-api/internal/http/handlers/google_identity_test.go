package handlers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestHTTPGoogleTokenVerifierAcceptsValidClaims(t *testing.T) {
	clientID := "test-client.apps.googleusercontent.com"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("id_token") != "credential" {
			t.Fatal("credential was not sent to tokeninfo")
		}
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"aud":%q,"iss":"https://accounts.google.com","sub":"google-user-1","email":"Mapler@Example.com","email_verified":true,"name":"Mapler","picture":"https://example.com/avatar.png","exp":%d}`,
			clientID, time.Now().Add(time.Hour).Unix())
	}))
	defer server.Close()

	identity, err := (HTTPGoogleTokenVerifier{Endpoint: server.URL}).Verify(context.Background(), "credential", clientID)
	if err != nil {
		t.Fatal(err)
	}
	if identity.Email != "mapler@example.com" || identity.Subject != "google-user-1" || !identity.EmailVerified {
		t.Fatalf("unexpected identity: %#v", identity)
	}
}

func TestHTTPGoogleTokenVerifierRejectsWrongAudience(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"aud":"another-client","iss":"accounts.google.com","sub":"1","email":"mapler@example.com","email_verified":"true","exp":"%d"}`,
			time.Now().Add(time.Hour).Unix())
	}))
	defer server.Close()

	if _, err := (HTTPGoogleTokenVerifier{Endpoint: server.URL}).Verify(context.Background(), "credential", "expected-client"); err == nil {
		t.Fatal("expected an audience mismatch to be rejected")
	}
}

func TestGoogleUsernameIsStableAndBounded(t *testing.T) {
	username := googleUsername(GoogleIdentity{Email: "Maple.Player+long-name@example.com", Subject: "1234567890"})
	if username != "maple_player_long_nam_12345678" {
		t.Fatalf("unexpected username %q", username)
	}
	if len(username) > 30 {
		t.Fatalf("username is too long: %d", len(username))
	}
}
