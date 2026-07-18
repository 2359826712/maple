/**
 * Browser adapter — renders JavaScript-heavy pages via a real browser.
 *
 * Prerequisites:
 *   Chrome / Chromium / Edge must be running with --remote-debugging-port=9222.
 *   The user should navigate to the target site once in that browser so the
 *   WAF / JS-challenge session is established.  The adapter then reuses that
 *   session via CDP to render listing and article pages.
 *
 * Environment overrides (optional):
 *   CDP_HOST   — default 127.0.0.1
 *   CDP_PORT   — default 9222
 */

import { setTimeout as delay } from 'node:timers/promises';
import {
  attachItem,
  normalizeParsedContent,
  parseDocument,
  parseHtmlPage,
  text,
} from '../lib.mjs';
import {
  connectBrowser,
  evaluate,
  extractPageHtml,
  getCurrentUrl,
  navigateAndWait,
} from './cdp.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function matchesAny(value, patterns = []) {
  return patterns.length === 0 || patterns.some((p) => new RegExp(p, 'i').test(value));
}

function absoluteUrl(href, base) {
  try { return new URL(href, base).href; } catch { return null; }
}

function buildFetchResult(html, requestUrl, finalUrl) {
  return {
    requestUrl,
    finalUrl: finalUrl || requestUrl,
    status: 200,
    contentType: 'text/html; charset=utf-8',
    etag: null,
    lastModified: null,
    fetchedAt: new Date().toISOString(),
    body: html,
  };
}

/**
 * Rate-limit helper — ensures at least `perSeconds` seconds elapse between
 * consecutive browser navigations for the same source.
 */
async function enforceRateLimit(source, lastRequestMs) {
  if (!lastRequestMs) return Date.now();
  const intervalMs = (source.rate_limit.per_seconds * 1000) / source.rate_limit.requests;
  const waitMs = intervalMs - (Date.now() - lastRequestMs);
  if (waitMs > 0) await delay(waitMs);
  return Date.now();
}

// ---------------------------------------------------------------------------
// Shared CDP connection (lazy, one connection per crawl run)
// ---------------------------------------------------------------------------

let sharedConnection = null;

async function getConnection(source) {
  if (sharedConnection) return sharedConnection;
  const preferUrl = source.base_url || source.discovery_urls?.[0] || null;
  const { session, target } = await connectBrowser({ preferUrl });
  sharedConnection = { session, target };
  return sharedConnection;
}

/** Called at the end of a crawl run to release the CDP WebSocket. */
export function closeBrowserConnection() {
  if (sharedConnection) {
    sharedConnection.session.close();
    sharedConnection = null;
  }
}

/** Reset the shared connection without closing the WebSocket (for testing). */
export function resetBrowserConnection() {
  sharedConnection = null;
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export const browserAdapter = {

  async discover(source, context) {
    const { session } = await getConnection(source);
    const items = [];
    let lastRequestMs = 0;

    for (const discoveryUrl of source.discovery_urls) {
      lastRequestMs = await enforceRateLimit(source, lastRequestMs);

      const renderDelayMs = source.adapter_config?.render_delay_ms || undefined;
      await navigateAndWait(session, discoveryUrl, { renderDelayMs });
      const html = await extractPageHtml(session);
      const finalUrl = await getCurrentUrl(session) || discoveryUrl;

      const document = parseDocument(html, 'text/html');
      const selector = source.adapter_config?.link_selector || 'a[href]';
      const includePatterns = source.adapter_config?.include_patterns || [];
      const excludePatterns = source.adapter_config?.exclude_patterns || [];

      for (const link of document.querySelectorAll(selector)) {
        const href = link.getAttribute('href');
        const url = absoluteUrl(href, finalUrl);
        if (!url) continue;
        if (!matchesAny(url, includePatterns)) continue;
        if (excludePatterns.some((p) => new RegExp(p, 'i').test(url))) continue;

        items.push({
          url,
          externalId: link.getAttribute('data-id') || null,
          title: text(source.adapter_config?.title_selector
            ? link.querySelector(source.adapter_config.title_selector)
            : link),
          publishedAt: link.querySelector('time[datetime]')?.getAttribute('datetime') || null,
          metadata: { discovery_url: finalUrl },
        });
      }
    }

    // Deduplicate by URL (same as the HTML adapter).
    return [...new Map(items.map((item) => [item.url, item])).values()];
  },

  async fetch(item, context) {
    const source = context.source;
    if (!source) throw new Error('browser adapter requires context.source (set by crawl runner)');
    const { session } = await getConnection(source);

    // Enforce rate limit between navigations.
    if (!context._browserLastRequestMs) context._browserLastRequestMs = 0;
    context._browserLastRequestMs = await enforceRateLimit(source, context._browserLastRequestMs);

    const renderDelayMs = source.adapter_config?.render_delay_ms || undefined;
    await navigateAndWait(session, item.url, { renderDelayMs });
    const html = await extractPageHtml(session);
    const finalUrl = await getCurrentUrl(session) || item.url;

    return attachItem(buildFetchResult(html, item.url, finalUrl), item);
  },

  async parse(result) {
    return [parseHtmlPage(result)];
  },

  async normalize(content, source, context) {
    return normalizeParsedContent(content, source, context);
  },
};
