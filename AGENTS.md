# MapleStory Resource Index Instructions

## Goal

Maintain a structured, searchable, deduplicated index and lawful content archive for the six active MapleStory series: MapleStory, MapleStory Classic, MapleStory M, MapleStory Worlds, MapleStory N, and MapleStory Idle.

Index exact useful pages, not generic domains. A site with several independently useful calculators should have one record per calculator.

All news, events, announcements, patch notes, maintenance notices, Cash Shop updates, developer notes, roadmaps, and independently-addressable guides that can be discovered lawfully and reliably should become individual `content/` records. They are not ordinary `resources/` records.

## Quality Rules

- Verify the exact URL and recorded function before adding a resource.
- Never invent URLs, capabilities, regions, languages, API access, repositories, or status.
- Prefer first-party sources, official documentation, established wikis, and maintained specialist tools.
- Do not add private servers, cheats, bots, exploits, real-money trading, account sales, piracy, suspicious downloads, search result pages, or low-value one-off posts.
- Preserve inactive resources by updating `status`; do not silently delete records.
- Use `null`, `unknown`, or a factual note when a property cannot be confirmed.
- Accuracy is more important than record count. Do not bulk-collect until validation and duplicate checks are working.
- Respect robots.txt, source terms, rate limits, login boundaries, paywalls, and anti-bot controls. Never bypass CAPTCHA or access restrictions.
- Default to `summary-and-metadata`. Store or publish full source text only when permission is explicit, and always retain the canonical source link.

## Storage

Store one UTF-8 JSON record per file:

```text
resources/{series}/{category}/{id}.json
```

The directory series and category must match the record. The filename must equal `{id}.json`. IDs are permanent, globally unique, lowercase, hyphen-separated, and URL-safe.

Follow [SCHEMA.md](SCHEMA.md) and `schemas/resource.schema.json`. Never manually edit `generated/`; rebuild it with `npm run build:data`.

Keep the data layers separate:

- `resources/{series}/{category}/{id}.json`: reusable sites, tools, APIs, indexes, and resource entry points.
- `sources/{series}/{id}.json`: monitored source registry.
- `content/{type}/{series}/{year}/{id}.json`: individual articles, announcements, guides, patch notes, and events.
- `raw/`: source responses only when the configured storage mode and source terms permit retention.
- `snapshots/{content-id}/{timestamp}.json`: prior structured revisions.
- `crawl-state/state.json`: local conditional-request, cursor, and crawl progress state.

## Required Workflow

Before adding or changing data:

1. Search exact and canonical URLs, names, aliases, titles, functions, series, and categories.
2. Open the exact page and verify its purpose and metadata.
3. Store the exact resource URL first in `source_urls`.
4. Run `npm run validate` and `npm run check:duplicates`.
5. Run `npm run check:links` when URLs change.
6. Run `npm run build:data`, `npm test`, `npm run type-check`, and `npm run build` before finishing.

For monitored content, also preserve stable IDs across title edits, snapshot changed records before overwriting them, retain ended or outdated items as history, and never guess missing event dates.

For anti-bot 401/403/429 responses, verify the exact page in a normal browser and record minimal evidence in `verification/browser-checks.json`. Never commit browser cookies, tokens, or profile data.

## Generated Data

Generated output must be deterministic and reproducible from `resources/`, `sources/`, and `content/`. It includes combined resources, source and content indexes, website/category/series/region/language/tag indexes, statistics, and unified search data.

The MPStorys application consumes the generated resource index. Resource categories are mapped to the matching on-site News, Upcoming Updates, Guides, Events, Tools, Wiki, Rankings, or Community module.
