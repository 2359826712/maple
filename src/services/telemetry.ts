export type TelemetryAuthMode = 'guest' | 'signed-in';
export type TelemetryDevice = 'mobile' | 'desktop';

type TelemetryBase = {
  occurredAt: string;
  device: TelemetryDevice;
  authMode: TelemetryAuthMode;
};

export type TelemetryEvent = TelemetryBase & (
  | { name: 'page_view'; route: string }
  | { name: 'navigation'; from: string; to: string }
  | { name: 'character_lookup'; version: string; outcome: 'success' | 'not-found' | 'failure' | 'unsupported' }
  | { name: 'checklist_open'; version: string; hasCharacter: boolean }
  | { name: 'checklist_toggle'; resetType: 'daily' | 'weekly'; completed: boolean }
  | { name: 'checklist_reset' }
  | { name: 'checklist_save'; outcome: 'success' | 'failure' }
  | { name: 'search_submit'; queryLength: 'short' | 'medium' | 'long'; resultCount: number; duration: '<100ms' | '100-500ms' | '500ms+'; canonicalResultId?: string }
  | { name: 'tool_use'; toolId: string }
  | { name: 'session_duration'; duration: '<1m' | '1-5m' | '5-15m' | '15m+' }
  | { name: 'error_boundary'; component: string; errorType: string }
  | { name: 'api_failure'; endpoint: string; status: number }
);

type TelemetryEventInput = TelemetryEvent extends infer Event
  ? Event extends TelemetryBase ? Omit<Event, keyof TelemetryBase> : never
  : never;

type TelemetryTransport = (events: readonly TelemetryEvent[]) => void | Promise<void>;

type TelemetryClientOptions = {
  enabled: boolean;
  internal: boolean;
  transport: TelemetryTransport;
  now?: () => number;
  device?: () => TelemetryDevice;
  flushDelayMs?: number;
  maxBatchSize?: number;
};

const safeToken = (value: string, fallback = 'unknown') => {
  const normalized = value.trim().toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return normalized || fallback;
};

export function normalizeTelemetryRoute(value: string): string {
  const path = value.split(/[?#]/, 1)[0] || '/';
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'wiki' && segments[1] === 'article') return '/wiki/article/:title';
  if (segments[0] === 'wiki' && segments[1] === 'boss' && segments.length > 2) return '/wiki/boss/:boss';
  if (segments[0] === 'guides' && segments.length > 1) return '/guides/:guide';
  return segments.length > 0
    ? `/${segments.map((segment) => safeToken(segment, ':segment')).join('/')}`
    : '/';
}

const staticApiSegments = new Set([
  'api', 'auth', 'login', 'signup', 'me', 'newsletter', 'subscribe', 'unsubscribe',
  'wiki', 'mirror', 'pages', 'by-title', 'sync', 'realtime', 'content', 'notifications',
  'mark_all_read', 'community', 'proposals', 'comments', 'vote', 'guides', 'bookmarks',
  'likes', 'bookmark', 'like', 'count', 'characters', 'checklist', 'read',
]);

export function normalizeTelemetryEndpoint(value: string): string {
  const path = value.split(/[?#]/, 1)[0];
  const segments = path.split('/').filter(Boolean).map((segment) => {
    const decoded = (() => {
      try { return decodeURIComponent(segment).toLowerCase(); } catch { return ''; }
    })();
    return staticApiSegments.has(decoded) ? decoded : ':id';
  });
  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

const queryLengthBucket = (length: number): 'short' | 'medium' | 'long' =>
  length <= 3 ? 'short' : length <= 15 ? 'medium' : 'long';

const searchDurationBucket = (durationMs: number): '<100ms' | '100-500ms' | '500ms+' =>
  durationMs < 100 ? '<100ms' : durationMs < 500 ? '100-500ms' : '500ms+';

const durationBucket = (durationMs: number): '<1m' | '1-5m' | '5-15m' | '15m+' => {
  if (durationMs < 60_000) return '<1m';
  if (durationMs < 5 * 60_000) return '1-5m';
  if (durationMs < 15 * 60_000) return '5-15m';
  return '15m+';
};

export function createTelemetryClient(options: TelemetryClientOptions) {
  const now = options.now ?? Date.now;
  const device = options.device ?? (() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 'mobile' : 'desktop');
  const flushDelayMs = options.flushDelayMs ?? 5000;
  const maxBatchSize = options.maxBatchSize ?? 20;
  const queue: TelemetryEvent[] = [];
  let authMode: TelemetryAuthMode = 'guest';
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let flushing = false;

  const flush = async () => {
    if (flushing || queue.length === 0 || !options.enabled || options.internal) return;
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
    const batch = queue.splice(0, maxBatchSize);
    flushing = true;
    try {
      await options.transport(batch);
    } catch {
      // Telemetry must never interfere with player workflows or persist sensitive retries.
    } finally {
      flushing = false;
      if (queue.length > 0) void flush();
    }
  };

  const enqueue = (event: TelemetryEventInput) => {
    if (!options.enabled || options.internal) return;
    queue.push({
      ...event,
      occurredAt: new Date(now()).toISOString(),
      device: device(),
      authMode,
    } as TelemetryEvent);
    if (queue.length >= maxBatchSize) void flush();
    else if (!flushTimer) flushTimer = setTimeout(() => void flush(), flushDelayMs);
  };

  return {
    setAuthMode(mode: TelemetryAuthMode) { authMode = mode; },
    trackPageView(route: string) { enqueue({ name: 'page_view', route: normalizeTelemetryRoute(route) }); },
    trackNavigation(from: string, to: string) {
      enqueue({ name: 'navigation', from: normalizeTelemetryRoute(from), to: normalizeTelemetryRoute(to) });
    },
    trackCharacterLookup(version: string, outcome: 'success' | 'not-found' | 'failure' | 'unsupported') {
      enqueue({ name: 'character_lookup', version: safeToken(version), outcome });
    },
    trackChecklistOpen(version: string, hasCharacter: boolean) {
      enqueue({ name: 'checklist_open', version: safeToken(version), hasCharacter });
    },
    trackChecklistToggle(resetType: 'daily' | 'weekly', completed: boolean) {
      enqueue({ name: 'checklist_toggle', resetType, completed });
    },
    trackChecklistReset() { enqueue({ name: 'checklist_reset' }); },
    trackChecklistSave(outcome: 'success' | 'failure') { enqueue({ name: 'checklist_save', outcome }); },
    trackSearch(queryLength: number, resultCount: number, durationMs: number, canonicalResultId?: string) {
      enqueue({
        name: 'search_submit',
        queryLength: queryLengthBucket(queryLength),
        resultCount: Math.max(0, Math.min(999, Math.trunc(resultCount))),
        duration: searchDurationBucket(Math.max(0, durationMs)),
        ...(canonicalResultId ? { canonicalResultId: safeToken(canonicalResultId) } : {}),
      });
    },
    trackToolUse(toolId: string) { enqueue({ name: 'tool_use', toolId: safeToken(toolId) }); },
    trackSessionDuration(durationMs: number) { enqueue({ name: 'session_duration', duration: durationBucket(durationMs) }); },
    trackErrorBoundary(component: string, errorType: string) {
      enqueue({ name: 'error_boundary', component: safeToken(component), errorType: safeToken(errorType) });
    },
    trackApiFailure(endpoint: string, status: number) {
      enqueue({ name: 'api_failure', endpoint: normalizeTelemetryEndpoint(endpoint), status: Math.trunc(status) });
    },
    flush,
    pendingCount() { return queue.length; },
  };
}

const telemetryEndpoint = (import.meta.env.VITE_ANALYTICS_ENDPOINT || '/api/telemetry/events').trim();
const endpointIsSameOrigin = () => {
  if (typeof window === 'undefined') return telemetryEndpoint.startsWith('/');
  try { return new URL(telemetryEndpoint, window.location.origin).origin === window.location.origin; } catch { return false; }
};
const telemetryEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
  && endpointIsSameOrigin()
  && (typeof navigator === 'undefined' || navigator.doNotTrack !== '1');
const internalSession = import.meta.env.DEV || import.meta.env.VITE_INTERNAL_SESSION === 'true';

export const telemetry = createTelemetryClient({
  enabled: telemetryEnabled,
  internal: internalSession,
  transport: async (events) => {
    await fetch(telemetryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      credentials: 'omit',
      keepalive: true,
    });
  },
});
