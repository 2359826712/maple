import { describe, expect, it, vi } from 'vitest';
import {
  createTelemetryClient,
  normalizeTelemetryEndpoint,
  normalizeTelemetryRoute,
  type TelemetryEvent,
} from './telemetry';

const createHarness = (overrides: Partial<Parameters<typeof createTelemetryClient>[0]> = {}) => {
  const batches: TelemetryEvent[][] = [];
  const transport = vi.fn((events: readonly TelemetryEvent[]) => { batches.push([...events]); });
  const client = createTelemetryClient({
    enabled: true,
    internal: false,
    transport,
    now: () => Date.parse('2026-07-11T00:00:00.000Z'),
    device: () => 'mobile',
    flushDelayMs: 60_000,
    maxBatchSize: 100,
    ...overrides,
  });
  return { client, transport, batches };
};

describe('privacy-safe telemetry', () => {
  it('normalizes dynamic routes and API identifiers before transport', async () => {
    expect(normalizeTelemetryRoute('/wiki/article/PlayerName?q=secret')).toBe('/wiki/article/:title');
    expect(normalizeTelemetryRoute('/guides/grandis-player-name')).toBe('/guides/:guide');
    expect(normalizeTelemetryEndpoint('/characters/private-character-id/checklist?token=secret'))
      .toBe('/characters/:id/checklist');

    const { client, batches } = createHarness();
    client.trackPageView('/wiki/article/PlayerName?q=secret');
    client.trackApiFailure('/characters/private-character-id/checklist?token=secret', 503);
    await client.flush();
    const serialized = JSON.stringify(batches);
    expect(serialized).not.toMatch(/PlayerName|private-character-id|secret/i);
    expect(batches[0]).toMatchObject([
      { name: 'page_view', route: '/wiki/article/:title', device: 'mobile', authMode: 'guest' },
      { name: 'api_failure', endpoint: '/characters/:id/checklist', status: 503 },
    ]);
  });

  it('records lookup outcomes without accepting character or world names', async () => {
    const { client, batches } = createHarness();
    client.setAuthMode('signed-in');
    client.trackCharacterLookup('GMS', 'success');
    client.trackSearch(22, 3, 42, 'boss-Zakum');
    await client.flush();

    expect(batches[0]).toMatchObject([
      { name: 'character_lookup', version: 'gms', outcome: 'success', authMode: 'signed-in' },
      { name: 'search_submit', queryLength: 'long', resultCount: 3, duration: '<100ms', canonicalResultId: 'boss-zakum' },
    ]);
    const allowedKeys = new Set([
      'name', 'occurredAt', 'device', 'authMode', 'version', 'outcome',
      'queryLength', 'resultCount', 'duration', 'canonicalResultId',
    ]);
    expect(Object.keys(batches[0][0]).every((key) => allowedKeys.has(key))).toBe(true);
  });

  it('does not queue or send events for disabled and internal sessions', async () => {
    for (const options of [{ enabled: false, internal: false }, { enabled: true, internal: true }]) {
      const { client, transport } = createHarness(options);
      client.trackPageView('/news');
      await client.flush();
      expect(client.pendingCount()).toBe(0);
      expect(transport).not.toHaveBeenCalled();
    }
  });

  it('buckets session duration and constrains arbitrary identifier fields', async () => {
    const { client, batches } = createHarness();
    client.trackToolUse('Player Name <script>alert(1)</script>');
    client.trackErrorBoundary('Checklist Player Name', 'Type Error');
    client.trackSessionDuration(16 * 60_000);
    await client.flush();

    expect(batches[0]).toMatchObject([
      { name: 'tool_use', toolId: 'player-name-script-alert-1-script' },
      { name: 'error_boundary', component: 'checklist-player-name', errorType: 'type-error' },
      { name: 'session_duration', duration: '15m+' },
    ]);
  });
});
