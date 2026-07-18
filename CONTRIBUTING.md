# Contributing to MapleStory Resource Index

Contributions should improve accuracy, categorization, and long-term maintainability. Ten fully verified resources are better than one hundred speculative records.

The project separately stores reusable resource entry points, monitored sources, and each discovered article or event. All lawfully and reliably discoverable routine news, event announcements, updates, patch notes, maintenance notices, Cash Shop posts, developer notes, roadmaps, and independent guides are eligible for individual `content/` records. Do not place those article records in `resources/`.

## Accepted Resources

Resources must serve an active MapleStory series. Accepted categories include official pages, news, events, patch notes, wikis, databases, calculators, simulators, planners, builders, optimizers, guides, lookups, rankings, APIs, SDKs, libraries, developer tools, repositories, creator documentation, and maintained community references.

Do not add discontinued games unless requested, private servers, piracy, cheats, bots, exploits, real-money trading, account sales, malware, duplicates, search result pages, placeholders, fabricated claims, or unrelated resources.

## Add a Resource

1. Search existing records by exact URL, normalized URL, website, page title, aliases, function, series, and category.
2. Open the exact resource page and verify its function, series, regions, languages, official/open-source status, login requirement, mobile support, and current status.
3. Create `resources/{series}/{category}/{id}.json` following `schemas/resource.schema.json`.
4. Write a concrete, non-promotional description.
5. Put the exact resource URL first in `source_urls` and record today's verification date.
6. Run all required commands below.

Different functions on distinct routes should be separate records. Do not split one page merely because it contains several fields.

## Add a Monitored Source

1. Prefer an official API, RSS/Atom feed, or sitemap over HTML; use browser automation only when no stable public alternative exists.
2. Verify the exact public discovery URL, robots policy, access requirements, supported series/regions/languages, and source terms.
3. Create `sources/{series}/{id}.json` using `schemas/source.schema.json`.
4. Default to `summary-and-metadata`. Use `full-text-permitted` only with explicit permission.
5. Put selectors and field mappings in `adapter_config`; keep source-specific parsing separate from reusable adapters.
6. Test with `npm run crawl:source -- --source=<id>` before using `--execute`.

## Add or Update Content

Create one record per independently-addressable article and one additional event record for every independent event described by an announcement. Preserve source timezones and use `null` for unknown dates. Do not delete ended events, removed pages, or outdated guides; update their status and retain revision snapshots.

Never reproduce a protected article body unless the source is configured as `full-text-permitted`. Public display defaults to title, source, dates, original summary, structured facts, tags, and the canonical source link.

## Status and Redirects

One automated failure is not enough to mark a resource inactive. Investigate browser access, redirects, DNS/TLS failures, regional restrictions, login, anti-bot protection, maintenance notices, and replacement domains.

When an official page returns 401, 403, or 429 to the link checker but loads in a normal browser, add a dated entry to `verification/browser-checks.json`. Record only the exact URL, page title, verification date, and a short content match; never store cookies, tokens, or browser profile data. Browser checks expire after 30 days and must then be repeated.

When the page is independently visible in a current official search index but direct and browser checks are blocked, record that distinct evidence in `verification/indexed-checks.json`. Use `method: "official-search-index"`; do not label it as a browser check. Indexed checks also expire after 30 days.

When a page permanently moves, update `url`, preserve the stable ID, retain the old URL in `source_urls` or `notes`, and check for a duplicate at the destination.

## Validation

```bash
npm run validate
npm run validate:sources
npm run validate:content
npm run check:duplicates
npm run check:links
npm run build:data
npm test
npm run type-check
npm run build
```

Never manually edit `generated/`. Include counts, covered series/categories, verification date, validation results, and known uncertainties in the change summary.
