package handlers

import (
	"fmt"
	"strings"
	"testing"
	"time"
)

const validTelemetryEvent = `{
  "name":"page_view",
  "occurredAt":"2026-07-11T00:00:00Z",
  "device":"desktop",
  "authMode":"guest",
  "route":"/news"
}`

func TestParseTelemetryBatchAcceptsClosedSchema(t *testing.T) {
	body := []byte(fmt.Sprintf(`{"events":[%s]}`, validTelemetryEvent))
	events, err := parseTelemetryBatch(body, time.Date(2026, 7, 11, 0, 1, 0, 0, time.UTC), strings.Repeat("a", 64))
	if err != nil {
		t.Fatalf("parseTelemetryBatch returned error: %v", err)
	}
	if len(events) != 1 || events[0].Name != "page_view" || events[0].Properties["route"] != "/news" {
		t.Fatalf("unexpected events: %#v", events)
	}
}

func TestParseTelemetryBatchRejectsSensitiveAndEventMismatchedFields(t *testing.T) {
	now := time.Date(2026, 7, 11, 0, 1, 0, 0, time.UTC)
	tests := []string{
		strings.Replace(validTelemetryEvent, `"route":"/news"`, `"route":"/news","characterName":"PrivateName"`, 1),
		strings.Replace(validTelemetryEvent, `"route":"/news"`, `"route":"/news","status":200`, 1),
		strings.Replace(validTelemetryEvent, `"route":"/news"`, `"route":"/news?q=PrivateName"`, 1),
		strings.Replace(validTelemetryEvent, `"name":"page_view"`, `"name":"unknown"`, 1),
	}
	for _, event := range tests {
		body := []byte(fmt.Sprintf(`{"events":[%s]}`, event))
		if _, err := parseTelemetryBatch(body, now, strings.Repeat("a", 64)); err == nil {
			t.Fatalf("expected rejection for %s", event)
		}
	}
}

func TestParseTelemetryBatchRejectsOversizeAndOldEvents(t *testing.T) {
	now := time.Date(2026, 7, 11, 0, 1, 0, 0, time.UTC)
	tooMany := `{"events":[` + strings.TrimSuffix(strings.Repeat(validTelemetryEvent+",", maxTelemetryBatch+1), ",") + `]}`
	if _, err := parseTelemetryBatch([]byte(tooMany), now, strings.Repeat("a", 64)); err == nil {
		t.Fatal("expected oversized batch rejection")
	}
	old := strings.Replace(validTelemetryEvent, "2026-07-11", "2026-05-01", 1)
	if _, err := parseTelemetryBatch([]byte(fmt.Sprintf(`{"events":[%s]}`, old)), now, strings.Repeat("a", 64)); err == nil {
		t.Fatal("expected old event rejection")
	}
}

func TestTelemetryClientHashIsStableAndDoesNotExposeIP(t *testing.T) {
	hashA := telemetryClientHash("secret", "203.0.113.42")
	hashB := telemetryClientHash("secret", "203.0.113.42")
	if hashA != hashB || len(hashA) != 64 {
		t.Fatalf("unexpected hash: %q", hashA)
	}
	if strings.Contains(hashA, "203.0.113.42") {
		t.Fatal("hash exposed raw IP")
	}
}
