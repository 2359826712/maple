package middleware

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
)

func TestRateLimitReturnsRetryMetadata(t *testing.T) {
	app := fiber.New()
	app.Use(RateLimit(2, time.Minute))
	app.Get("/", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusNoContent) })

	for requestNumber := 1; requestNumber <= 3; requestNumber++ {
		response, err := app.Test(httptest.NewRequest("GET", "http://example.test/", nil))
		if err != nil {
			t.Fatal(err)
		}
		if requestNumber <= 2 && response.StatusCode != fiber.StatusNoContent {
			t.Fatalf("request %d returned %d", requestNumber, response.StatusCode)
		}
		if requestNumber == 3 {
			if response.StatusCode != fiber.StatusTooManyRequests {
				t.Fatalf("expected 429, got %d", response.StatusCode)
			}
			if response.Header.Get("Retry-After") == "" {
				t.Fatal("missing Retry-After")
			}
			if response.Header.Get("X-RateLimit-Limit") != "2" {
				t.Fatal("missing limit header")
			}
		}
	}
}
