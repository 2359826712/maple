package handlers

import "testing"

func TestRefreshTokensAreRandomAndHashable(t *testing.T) {
	first, err := newRefreshToken()
	if err != nil {
		t.Fatal(err)
	}
	second, err := newRefreshToken()
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatal("refresh tokens must be unique")
	}
	if len(first) < 40 {
		t.Fatalf("refresh token is unexpectedly short: %d", len(first))
	}
	if hashRefreshToken(first) == first || len(hashRefreshToken(first)) != 64 {
		t.Fatal("refresh token must be stored as a SHA-256 hash")
	}
}

func TestAccountDataValidation(t *testing.T) {
	if !validateAccountData(map[string]string{"maplehub-characters:v2": "[]"}) {
		t.Fatal("expected known player-data key to be valid")
	}
	if validateAccountData(map[string]string{"maplehub-auth-session": "secret"}) {
		t.Fatal("auth sessions must never be accepted as player data")
	}
}
