/**
 * Chrome DevTools Protocol (CDP) connection for browser-based content crawling.
 *
 * Connects to a running Chrome/Chromium/Edge instance started with
 * `--remote-debugging-port=<port>`. The user is expected to have already
 * navigated to the target site in the browser so that any WAF / JS-challenge
 * cookies are present in the browser session.
 *
 * Uses only Node.js built-in modules (http, WebSocket) — no external deps.
 */

const DEFAULT_CDP_PORT = Number(process.env.CDP_PORT || 9222);
const DEFAULT_CDP_HOST = process.env.CDP_HOST || '127.0.0.1';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_LOAD_TIMEOUT_MS = 20_000;
const DEFAULT_RENDER_DELAY_MS = 3_000;

/** Active sessions keyed by target webSocketDebuggerUrl. */
const activeSessions = new Map();

async function listTargets(host = DEFAULT_CDP_HOST, port = DEFAULT_CDP_PORT) {
  const url = `http://${host}:${port}/json`;
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) {
    throw new Error(`CDP target list returned HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

/**
 * Select a "page" target. Prefers a tab whose URL already matches `preferUrl`
 * so the user can pre-navigate to the target forum in their browser.
 */
async function selectPageTarget(host, port, preferUrl) {
  const targets = await listTargets(host, port);
  const pages = targets.filter((target) => target.type === 'page');
  if (pages.length === 0) throw new Error('No open browser tabs found via CDP');
  if (preferUrl) {
    const match = pages.find((page) => page.url.startsWith(preferUrl));
    if (match) return match;
  }
  return pages[0];
}

function createCdpSession(wsUrl) {
  if (activeSessions.has(wsUrl)) return activeSessions.get(wsUrl);

  const ws = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const eventListeners = new Map();

  ws.addEventListener('message', (event) => {
    let message;
    try {
      message = JSON.parse(String(event.data));
    } catch {
      return;
    }
    if (message.id !== undefined && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(`CDP: ${message.error.message}`));
      else resolve(message.result);
    } else if (message.method) {
      const listeners = eventListeners.get(message.method) || [];
      for (const listener of listeners) listener(message.params);
    }
  });

  ws.addEventListener('close', () => {
    activeSessions.delete(wsUrl);
    for (const [id, { reject, timer }] of pending) {
      clearTimeout(timer);
      reject(new Error('CDP WebSocket closed'));
      pending.delete(id);
    }
  });

  ws.addEventListener('error', () => {
    /* close handler cleans up pending */
  });

  const session = {
    /** Send a CDP command and await its result. */
    send(method, params = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
      return new Promise((resolve, reject) => {
        if (ws.readyState !== WebSocket.OPEN) {
          reject(new Error('CDP WebSocket is not open'));
          return;
        }
        const id = nextId++;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP ${method} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        pending.set(id, { resolve, reject, timer });
        ws.send(JSON.stringify({ id, method, params }));
      });
    },

    /** Register a listener for CDP events. */
    on(method, listener) {
      if (!eventListeners.has(method)) eventListeners.set(method, []);
      eventListeners.get(method).push(listener);
    },

    /** Close the WebSocket. */
    close() {
      activeSessions.delete(wsUrl);
      ws.close();
    },
  };

  activeSessions.set(wsUrl, session);
  return session;
}

function waitForReadyState(ws, state, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    if (ws.readyState === state) { resolve(); return; }
    const timer = setTimeout(() => reject(new Error(`WebSocket did not reach readyState ${state} within ${timeoutMs}ms`)), timeoutMs);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', (event) => { clearTimeout(timer); reject(new Error(`WebSocket error: ${event.message || 'unknown'}`)); }, { once: true });
  });
}

/**
 * Open (or reuse) a CDP session for a page-type target.
 *
 * @param {object} [options]
 * @param {string} [options.host]        CDP host (default 127.0.0.1)
 * @param {number} [options.port]        CDP port (default 9222)
 * @param {string} [options.preferUrl]   Prefer a tab already on this URL prefix
 * @returns {Promise<{session, target}>}
 */
export async function connectBrowser(options = {}) {
  const host = options.host || DEFAULT_CDP_HOST;
  const port = options.port || DEFAULT_CDP_PORT;
  const target = await selectPageTarget(host, port, options.preferUrl);
  const wsUrl = target.webSocketDebuggerUrl;
  if (!wsUrl) throw new Error('Selected browser tab has no webSocketDebuggerUrl — is remote debugging enabled?');

  const session = createCdpSession(wsUrl);
  if (session._page) return { session, target };

  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Network.enable');
  session._page = true;
  return { session, target };
}

/**
 * Navigate the connected tab to `url` and wait for the page to finish loading.
 *
 * Resolves after the `Page.loadEventFired` event plus a configurable
 * render delay (default 3 s) to let client-side JavaScript populate the DOM.
 */
export async function navigateAndWait(session, url, options = {}) {
  const loadTimeoutMs = options.loadTimeoutMs || DEFAULT_LOAD_TIMEOUT_MS;
  const renderDelayMs = options.renderDelayMs || DEFAULT_RENDER_DELAY_MS;

  const loadPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Page load timed out after ${loadTimeoutMs}ms`)), loadTimeoutMs);
    session.on('Page.loadEventFired', () => { clearTimeout(timer); resolve(); });
  });

  await session.send('Page.navigate', { url });
  await loadPromise;

  if (renderDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, renderDelayMs));
}

/**
 * Evaluate a JavaScript expression in the page context and return the value.
 * Throws on evaluation exceptions.
 */
export async function evaluate(session, expression) {
  const result = await session.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    const message = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'evaluation failed';
    throw new Error(`Browser evaluation failed: ${message}`);
  }
  return result.result.value;
}

/**
 * Extract the full rendered HTML of the current page.
 * Uses `document.documentElement.innerHTML` which preserves <head> metadata
 * (og:title, canonical, etc.) needed by the shared parse pipeline.
 */
export async function extractPageHtml(session) {
  const html = await evaluate(session, 'document.documentElement.innerHTML');
  return typeof html === 'string' ? html : '';
}

/** Return the current page URL (after any redirects). */
export async function getCurrentUrl(session) {
  return evaluate(session, 'window.location.href') || '';
}

/** Convenience: navigate, wait, then return { html, finalUrl }. */
export async function renderPage(session, url, options = {}) {
  await navigateAndWait(session, url, options);
  const [html, finalUrl] = await Promise.all([
    extractPageHtml(session),
    getCurrentUrl(session),
  ]);
  return { html, finalUrl };
}

/** Close all active CDP sessions. */
export function closeAllSessions() {
  for (const session of activeSessions.values()) session.close();
  activeSessions.clear();
}

export const cdpDefaults = Object.freeze({
  host: DEFAULT_CDP_HOST,
  port: DEFAULT_CDP_PORT,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  loadTimeoutMs: DEFAULT_LOAD_TIMEOUT_MS,
  renderDelayMs: DEFAULT_RENDER_DELAY_MS,
});
