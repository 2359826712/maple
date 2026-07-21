# Historical backfill

Historical backfill is a separate crawl mode for walking an adapter-owned archive one page at a time. It does not change incremental `crawl:source` behavior, content schemas, stable IDs, or source parsers.

## Commands

```bash
npm run crawl:backfill -- --source=<source-id> --dry-run
npm run crawl:backfill -- --source=<source-id> --max-pages=10 --execute
npm run crawl:backfill -- --source=<source-id> --resume --execute
```

Omitting `--execute` is a dry run. Dry runs traverse pages and calculate statistics, but do not write content, snapshots, checkpoints, or generated indexes. `--execute` validates and deduplicates every page, checkpoints immediately after the page, and rebuilds generated/search data once when the run stops.

## Pagination ownership

The engine calls four optional adapter methods:

- `discoverPages(source, context)` returns support status, the first page descriptor, and an optional total page count.
- `fetchPage(page, source, context)` performs the rate-limited, robots-aware request.
- `discoverItems(result, page, source, context)` extracts article candidates from that page.
- `discoverNextPage(page, result, items, source, context)` returns the next descriptor or a stop reason.

HTML, JSON API, RSS/Atom, and sitemap adapters implement these methods. Their source-specific settings live under `adapter_config.pagination`; the engine never hard-codes a site's page parameter.

Supported strategies are:

- HTML: `page`, `offset`, and `next-url`.
- JSON API: `page`, `offset`, `cursor`, `before`, `after`, `next-token`, and `next-url`.
- RSS/Atom: numbered pages, `before`, `after`, and feed `rel=next` URLs.
- Sitemap: sitemap indexes and configured sitemap URL queues.
- Nexon CMS: verified client-side slicing of configured official current/archive endpoints.
- Nexon community: `nexon-keyset`, using the official `pageNo`, `pageSize`, `blockStartKey`, and `blockStartNo` contract returned by the board API.

An adapter without a configured or implemented strategy reports `No pagination supported` and exits successfully.

The browser adapter does not expose historical pagination. Compressed sitemap archives, JavaScript-only pagination, arbitrary unverified POST-body cursors, and feeds without either an archive parameter or `rel=next` are not inferred automatically.

Nexon community keysets are stored in the next-page checkpoint so resume does not regenerate or guess paging state. The adapter verifies descending non-sticky publication order, permits pinned records and equal timestamps, removes duplicate external IDs within a response, and leaves cross-page identity handling to the normal content deduplicator.

Example numbered HTML configuration:

```json
{
  "pagination": {
    "strategy": "page",
    "param": "page",
    "start": 1,
    "page_size": 20
  }
}
```

Example cursor JSON API configuration:

```json
{
  "pagination": {
    "strategy": "cursor",
    "param": "cursor",
    "next_token_path": "paging.next_cursor",
    "page_size": 50
  }
}
```

## Checkpoints and resume

Execute-mode checkpoints are stored at:

```text
crawl-state/history/<source-id>.json
```

The file contains the completed page, next page descriptor, last cursor and URL, processed/saved/skipped counts, errors, retries, timestamps, completion flag, and stop reason. Writes use a temporary file followed by an atomic rename.

`Ctrl+C` requests a controlled stop after the current page checkpoint. Run the same source again with `--resume --execute`; the engine starts from `next_page`, not page 1. Checkpoint files are runtime state and are ignored by Git.

## Stop rules

A run stops and records its reason when:

- `--max-pages` is reached;
- 100 consecutive processed candidates are duplicates (override with `--duplicate-threshold=N`);
- three consecutive pages return 404 (override with `--consecutive-404s=N`);
- the adapter identifies the final or empty page;
- the next page URL/token is missing; or
- an interrupt is requested.

Parser and item HTTP errors are counted and skipped. They do not mark historical content as removed or terminate the entire source.

## Validation, snapshots, and indexes

Each candidate passes the existing quality gate, schema validation, canonical/stable/external ID checks, content-hash checks, and conservative similarity review before writing. Existing records keep their permanent IDs and editorial fields. Changed records use the existing snapshot engine.

After every execute-mode page, the complete content set is schema-validated and checked for duplicate identifiers. Generated and unified search indexes are rebuilt once at the end, not once per article.

## Common errors

- `No pagination supported`: add a tested `adapter_config.pagination` strategy or adapter capability before running history.
- `No historical checkpoint exists`: omit `--resume` for the first execute run.
- `next-page-missing`: confirm the configured token path, URL selector, or parameter.
- Repeated 404 stop: verify the page start and step without treating existing records as removed.
- Parser errors: add a local page/article fixture and parser test before resuming.

Use a small dry run such as `--max-pages=2` before any real backfill. Increase the limit only after reviewing page boundaries, duplicate rates, parser warnings, and checkpoint output.

## MapleStory N official boards

The MapleStory N community source family uses the shared `nexon-community` adapter and the official public board API. Board identity, frontend routes, classification rules, and pagination settings remain source configuration; the adapter does not hard-code MapleStory N source or board IDs.

| Source | Board | Verified frontend route | Default classification |
| --- | ---: | --- | --- |
| `n-official-events` | 5289 | `/maplestoryn/news/events/{threadId}` | `event`, with result, winner, reward-distribution, cancellation, postponement, extension, and schedule-change announcements overridden to `news` |
| `n-official-updates` | 5290 | `/maplestoryn/news/update/{threadId}` | `news`; explicit patch notes, developer/director notes, maintenance notices, and known-issue announcements are classified by configured title/body evidence |
| `n-official-guides` | 5291 | `/maplestoryn/news/Beginner's%20Guide/{threadId}` | `guide`, with only explicit contrary evidence overriding that type |

The existing Notices source remains `n-official-documentation-announcements` on board 5288. Event periods are read from structured official listing tags when present; claim periods remain separate metadata, and unknown dates stay `null`. Independently addressable event occurrences receive stable occurrence keys without changing the parent thread identity.

Configure and review these sources independently. The initial acceptance procedure is a maximum two-page dry run for each source; do not create a historical checkpoint or run execute mode until its classification and boundary report has been approved.
