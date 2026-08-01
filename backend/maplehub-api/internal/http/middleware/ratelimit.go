package middleware

import (
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

type rateLimitEntry struct {
	count   int
	resetAt time.Time
}

func RateLimit(maxRequests int, window time.Duration) fiber.Handler {
	var mu sync.Mutex
	entries := make(map[string]rateLimitEntry)
	return func(c *fiber.Ctx) error {
		now := time.Now()
		key := c.IP()
		mu.Lock()
		entry := entries[key]
		if entry.resetAt.IsZero() || !now.Before(entry.resetAt) {
			entry = rateLimitEntry{resetAt: now.Add(window)}
		}
		entry.count++
		entries[key] = entry
		remaining := maxRequests - entry.count
		if remaining < 0 {
			remaining = 0
		}
		c.Set("X-RateLimit-Limit", strconv.Itoa(maxRequests))
		c.Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		if entry.count > maxRequests {
			retryAfter := int(time.Until(entry.resetAt).Seconds()) + 1
			c.Set("Retry-After", strconv.Itoa(retryAfter))
			mu.Unlock()
			return fiber.NewError(fiber.StatusTooManyRequests, "rate limit exceeded")
		}
		mu.Unlock()
		return c.Next()
	}
}
