# Content source development

## Data boundaries

`resources/` describes useful sites and tools. `sources/` describes public locations that can be monitored. `content/` contains one structured record per article, announcement, guide, patch note, or independent event. `raw/`, `snapshots/`, and `crawl-state/` are separate because source responses, revision history, and crawler progress have different retention rules.

Do not convert individual articles into resources. Do not copy a source body into a content record unless the source is explicitly configured as `full-text-permitted`.

## Adding a source

1. Check for an official API, RSS/Atom feed, or sitemap before HTML.
2. Open the exact discovery URL and verify the series, region, language, and operator.
3. Review robots.txt and applicable terms. Sources requiring login, CAPTCHA bypass, private account data, or a paywall cannot be enabled.
4. Copy the fields required by `schemas/source.schema.json` into `sources/{series}/{id}.json`.
5. Select a reusable adapter and keep selectors or field paths in `adapter_config`.
6. Run `npm run validate:sources` and a dry run: `npm run crawl:source -- --source=<source-id> --max-items=5`.
7. Inspect every proposed URL and classification. Use `--execute` only after the parser output is accurate.

The reusable runtime adapters are under `adapters/`:

- `rss` also handles Atom entries and preserves GUID/ID and feed publication dates.
- `sitemap` preserves each `lastmod` value for incremental checks.
- `html` discovers links using `link_selector`, `include_patterns`, and `exclude_patterns`.
- `json-api` uses `items_path`, `url_field`, `id_field`, `title_field`, and `published_field` mappings.
- `browser` renders JavaScript-heavy pages through a real Chrome/Chromium/Edge instance via the Chrome DevTools Protocol (CDP). The browser must be started with `--remote-debugging-port=9222` (configurable via `CDP_PORT` / `CDP_HOST` env vars). The user should navigate to the target site once in that browser to establish any WAF or JS-challenge session before running the crawler. The adapter reuses a single browser tab for discovery and fetch, respects `rate_limit` between page navigations, and supports `render_delay_ms` in `adapter_config` to wait for client-side rendering. GraphQL, GitHub, and YouTube names remain reserved by the schema and intentionally fail closed until compliant adapters are implemented.

## Crawl behavior

The crawler uses a descriptive User-Agent, follows redirects, evaluates robots.txt, limits each domain independently, retries transient failures with exponential backoff, sends `If-None-Match` and `If-Modified-Since`, records final URLs and response validators, and continues after a single source fails. It processes at most 25 discovered items per source by default; use `--max-items` to lower the limit.

Dry runs never write content, snapshots, or state. Executed runs store local conditional-request state in `crawl-state/state.json`. Unchanged hashes are not rewritten. Changed records retain their stable ID, snapshot the prior structured record, and receive an updated hash. The crawler never stores cookies or tokens. Sources using the `browser` adapter bypass HTTP fetch entirely and navigate pages through the connected Chrome CDP session, relying on the browser's existing cookies and WAF clearance rather than the crawler's User-Agent.

## Events and revisions

An announcement containing several independent events must generate a separate event record for each. Parser code must retain the source timezone and leave unknown windows as `null`. `npm run update:event-status -- --execute` derives `upcoming`, `active`, `ending-soon`, `ended`, or `unknown`; it snapshots changes and marks ended events expired without deleting them.

## Historical backfill

Start with one enabled official source and a small date range. Run discovery with `--max-items=5`, validate classifications and stable IDs, then execute and run:

```bash
npm run validate
npm run check:duplicates
npm run update:event-status -- --execute
npm run build:data
npm test
```

Expand page-by-page or cursor-by-cursor only after the prior batch is clean. Recheck recent content for edits, preserve redirects/removals, and link regional equivalents through `related_content_ids` instead of merging them.
