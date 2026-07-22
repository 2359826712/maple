# MPStorys Resource and Content Index

MPStorys is a Next.js MapleStory series hub. The repository contains a resource index plus infrastructure for lawful discovery, structured storage, revision history, and presentation of news, events, guides, patch notes, maintenance notices, Cash Shop updates, developer notes, and roadmaps.

## Resource Index

Each source record lives at:

```text
resources/{series}/{category}/{id}.json
```

Supported series are `maplestory`, `classic`, `m`, `worlds`, `n`, and `idle`. See [AGENTS.md](AGENTS.md), [SCHEMA.md](SCHEMA.md), and [CONTRIBUTING.md](CONTRIBUTING.md) before changing data.

The machine-readable schema is `schemas/resource.schema.json`. Generated files under `generated/` are deterministic build artifacts and must not be edited manually.

## Sources and Content

Monitored sources live in `sources/{series}/{id}.json`. Individual articles and events live in `content/{type}/{series}/{year}/{id}.json`. Source responses, structured revision snapshots, and local crawl progress are kept separately in `raw/`, `snapshots/`, and `crawl-state/`.

The source registry defaults to summary and metadata storage. Full source text is neither retained nor displayed without explicit permission. See [Content Source Development](docs/content-source-development.md) for adapters, crawl safety, parser development, and historical backfill procedures.

```bash
npm run validate
npm run validate:sources
npm run validate:content
npm run check:duplicates
npm run check:links
npm run crawl
npm run crawl:source -- --source=maplestory-gms-official-news
npm run update:event-status
npm run build:search
npm run build:data
npm test
npm run type-check
npm run build
```

Crawler commands are dry-run by default. Add `-- --execute` (or append `--execute` after existing arguments) only after reviewing discovery output. `npm run build:data` creates resource, source, content, statistics, and unified search indexes. `npm test` covers schemas, stable IDs, hashing, snapshots, adapters, event status, duplicate signals, six-series coverage, and reproducible generation in addition to the application suite.

`npm run check:links` uses dated records in `verification/browser-checks.json` and `verification/indexed-checks.json` for official sites that block automated requests. Fresh evidence can satisfy a 401/403/429 result for 30 days; its method remains visible in the output, and it never hides 404 or 410 failures.

## Application Development

This frontend is wired to the Go backend in `D:/Desktop/maple_sql/backend`.

Development flow:

```bash
# 1. Start PostgreSQL
cd D:/Desktop/maple_sql/db/postgres
docker compose up -d

# 2. Run backend migrations
cd D:/Desktop/maple_sql/backend
go run ./cmd/migrate up

# 3. Start backend API
go run ./cmd/api

# 4. Start this frontend
cd D:/Desktop/maple
npm run dev
```

The frontend runs on Next.js. Set `MAPLE_SQL_API_ORIGIN=http://127.0.0.1:8080` to proxy `/api` requests to the local backend.

Published content localization is read from PostgreSQL. A missing approved localization
falls back to the original source; website requests never invoke a translation provider.

The Phase 2E worker uses a mock local-model transport by default. When the separate model
server is ready, configure its adapter at runtime:

```env
LOCAL_MODEL_PROVIDER=local
LOCAL_MODEL_TRANSPORT=http
LOCAL_MODEL_API_URL=http://model-host:PORT/v1/localize
MODEL_NAME=runtime-model-name
MODEL_VERSION=runtime-model-version
LOCAL_MODEL_PUBLISHABLE=false
```

Model names and versions are configuration, not application constants. Keep
`LOCAL_MODEL_PUBLISHABLE=false` until the model and quality policy have been approved.

Production uses hybrid rendering: stable localized routes are generated with SSG and refreshed with ISR, while news, events, guides, wiki, source, and upcoming-update routes render on request. Client-side navigation and route prefetching remain enabled after hydration. Remote news, rankings, maps, wiki, guide, tool, and upcoming-update data is requested only through the backend's database-backed static snapshot endpoint. The backend stores the first successful response in PostgreSQL and refreshes stored snapshots every 12 hours; browsers never contact those upstream data APIs directly.
