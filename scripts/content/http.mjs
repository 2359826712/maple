import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { normalizeCanonicalUrl } from '../lib/resource-index.mjs';

const userAgent = 'MPStorys-Content-Indexer/1.0 (+https://mpstorys.com; public metadata crawler)';
const transientStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);

export function parseRobots(body, agentToken = 'mpstorys-content-indexer') {
  const groups = [];
  let agents = [];
  let rules = [];
  const flush = () => {
    if (agents.length) groups.push({ agents, rules });
    agents = [];
    rules = [];
  };
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === 'user-agent') {
      if (rules.length) flush();
      agents.push(value.toLowerCase());
    } else if (key === 'allow' || key === 'disallow') {
      rules.push({ type: key, path: value });
    }
  }
  flush();
  const specific = groups.filter((group) => group.agents.some((agent) => agentToken.includes(agent) || agent.includes(agentToken)));
  const applicable = specific.length ? specific : groups.filter((group) => group.agents.includes('*'));
  return applicable.flatMap((group) => group.rules);
}

function robotsRulePattern(path) {
  const anchored = path.endsWith('$');
  const source = (anchored ? path.slice(0, -1) : path)
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${source}${anchored ? '$' : ''}`);
}

export function robotsAllows(rules, url) {
  const target = `${url.pathname}${url.search}`;
  const matches = rules
    .filter((rule) => rule.path && robotsRulePattern(rule.path).test(target))
    .map((rule) => ({ ...rule, specificity: rule.path.replace(/[*$]/g, '').length }))
    .sort((left, right) => (
      right.specificity - left.specificity || (left.type === 'allow' ? -1 : 1)
    ));
  return matches.length === 0 || matches[0].type === 'allow';
}

export class CrawlHttpClient {
  constructor(source, state, {
    now = () => new Date(),
    fetchImpl = fetch,
    conditionalRequests = true,
  } = {}) {
    this.source = source;
    this.state = state;
    this.now = now;
    this.fetchImpl = fetchImpl;
    this.conditionalRequests = conditionalRequests;
    this.lastRequestAt = new Map();
    this.robots = new Map();
    this.metrics = { requests: 0, retries: 0 };
  }

  async checkRobots(url) {
    const origin = url.origin;
    if (!this.robots.has(origin)) {
      const robotsUrl = `${origin}/robots.txt`;
      try {
        const response = await this.fetchImpl(robotsUrl, { headers: { 'user-agent': userAgent }, redirect: 'follow' });
        const rules = response.ok ? parseRobots(await response.text()) : [];
        this.robots.set(origin, rules);
      } catch {
        this.robots.set(origin, null);
      }
    }
    const rules = this.robots.get(origin);
    if (rules === null) throw new Error(`Unable to verify robots.txt for ${origin}`);
    if (!robotsAllows(rules, url)) throw new Error(`robots.txt disallows ${url.href}`);
  }

  async rateLimit(url) {
    const interval = (this.source.rate_limit.per_seconds * 1000) / this.source.rate_limit.requests;
    const previous = this.lastRequestAt.get(url.origin) || 0;
    const wait = interval - (Date.now() - previous);
    if (wait > 0) await delay(wait);
    this.lastRequestAt.set(url.origin, Date.now());
  }

  async fetch(urlValue, requestOptions = {}) {
    const url = new URL(urlValue);
    await this.checkRobots(url);
    await this.rateLimit(url);
    const { conditional = this.conditionalRequests, ...transportOptions } = requestOptions;
    const method = String(transportOptions.method || 'GET').toUpperCase();
    const body = transportOptions.body;
    const requestFingerprint = method === 'GET'
      ? ''
      : `:${createHash('sha256').update(String(body || ''), 'utf8').digest('hex').slice(0, 16)}`;
    const key = method === 'GET'
      ? normalizeCanonicalUrl(url.href)
      : `${method}:${normalizeCanonicalUrl(url.href)}${requestFingerprint}`;
    const previous = this.state.urls[key] || {};
    const headers = {
      accept: 'text/html,application/xhtml+xml,application/xml,application/rss+xml,application/atom+xml,application/json;q=0.9,*/*;q=0.8',
      'user-agent': userAgent,
      ...(transportOptions.headers || {}),
    };
    if (conditional && method === 'GET' && previous.etag) headers['if-none-match'] = previous.etag;
    if (conditional && method === 'GET' && previous.last_modified) headers['if-modified-since'] = previous.last_modified;

    let response;
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      this.metrics.requests += 1;
      if (attempt > 0) this.metrics.retries += 1;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      try {
        response = await this.fetchImpl(url, {
          ...transportOptions,
          body,
          headers,
          method,
          redirect: 'follow',
          signal: controller.signal,
        });
        if (!transientStatuses.has(response.status) || attempt === 2) break;
      } catch (error) {
        lastError = error;
        if (attempt === 2) throw error;
      } finally {
        clearTimeout(timeout);
      }
      await delay(500 * (2 ** attempt));
    }
    if (!response) throw lastError || new Error(`No response for ${url.href}`);
    const fetchedAt = this.now().toISOString();
    const result = {
      requestUrl: url.href,
      finalUrl: response.url || url.href,
      status: response.status,
      contentType: response.headers.get('content-type'),
      etag: response.headers.get('etag'),
      lastModified: response.headers.get('last-modified'),
      fetchedAt,
      body: response.status === 304 ? '' : await response.text(),
    };
    this.state.urls[key] = {
      etag: result.etag,
      last_modified: result.lastModified,
      final_url: result.finalUrl,
      status: result.status,
      checked_at: fetchedAt,
    };
    return result;
  }
}
