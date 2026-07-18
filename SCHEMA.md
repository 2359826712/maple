# Resource Data Schema

The repository has three separate data layers: reusable resources, monitored sources, and individual content records. Their authoritative Draft 2020-12 schemas live in `schemas/`.

Every resource is stored as an individual UTF-8 JSON file at `resources/{series}/{category}/{id}.json`, formatted with two-space indentation and a final newline. All fields are required, including nullable fields.

The authoritative machine-readable definition is `schemas/resource.schema.json` using JSON Schema Draft 2020-12.

## Fields

| Field | Type | Rules |
| --- | --- | --- |
| `id` | string | Globally unique, permanent, lowercase slug matching the filename. |
| `name` | string | Public resource name. |
| `website` | string | Parent site, application, organization, or project. |
| `page` | string | Exact page or feature title. |
| `url` | string | Exact absolute HTTPS resource URL without marketing tracking. |
| `series` | enum | `maplestory`, `classic`, `m`, `worlds`, `n`, or `idle`. |
| `regions` | string[] | One or more verified regions, sorted and unique. |
| `languages` | string[] | One or more supported language codes, sorted and unique. |
| `category` | enum | One primary category from the JSON Schema. |
| `subcategory` | string/null | A specific lowercase slug, or `null` when none is meaningful. |
| `description` | string | One or two factual sentences explaining the exact function. |
| `official` | boolean | True only for publisher/operator-controlled resources. |
| `opensource` | boolean | True only when corresponding public source code is verified. |
| `github_url` | string/null | Exact corresponding repository URL. |
| `api_url` | string/null | Exact API root, specification, or documentation URL. |
| `mobile_support` | enum | `native`, `responsive`, `partial`, `unsupported`, or `unknown`. |
| `login_required` | boolean/null | Whether the indexed function requires login. |
| `status` | enum | `active`, `maintenance`, `inactive`, `archived`, `deprecated`, or `unknown`. |
| `last_checked` | string | Exact verification date in `YYYY-MM-DD` format. |
| `tags` | string[] | Sorted, unique, specific lowercase slugs. |
| `source_urls` | string[] | Sorted with the exact resource URL first; at least one source is required. |
| `notes` | string/null | Factual caveats and uncertainty only. |

## Canonical URLs

Duplicate comparison lowercases hostnames, removes default ports, removes common tracking parameters, removes unnecessary trailing slashes, removes fragments unless functionally required, preserves meaningful and locale query parameters, sorts query parameters, and prefers HTTPS.

Known removable parameters include `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, and `gclid`.

## Consistency

- Directory series and category must match the JSON fields.
- Filename without `.json` must match `id`.
- IDs and normalized URLs must be globally unique.
- Arrays must be sorted and contain no duplicates.
- `source_urls[0]` must be the exact `url`.
- `opensource: true` normally requires `github_url` or an explanatory note.
- Empty strings and placeholder values such as `N/A` are invalid.

## Source Registry

Store one source at `sources/{series}/{id}.json` following `schemas/source.schema.json`. A source records discovery entry points, adapter/parser selection, content types, crawl frequency, per-domain rate limit, access requirements, robots policy, and copyright-aware storage mode.

Allowed storage modes are:

- `metadata-only`: retain only identifying and source metadata.
- `summary-and-metadata`: retain metadata, structured facts, and an original summary; this is the default.
- `full-text-permitted`: retain source text only when explicit permission or licensing allows it.

Source runtime timestamps describe crawler activity, not manual URL verification. Disabled sources remain registered and explain the blocker in `notes`.

## Content Records

Store individual items at `content/{type}/{series}/{year}/{id}.json`. The directory type maps to the singular `content_type`: `news`, `events`, `guides`, `patch-notes`, `maintenance`, `cash-shop`, `developer-notes`, `roadmaps`, `api-announcements`, or `creator-announcements`.

The common fields and enums are defined by `schemas/article.schema.json`. Event, guide, and patch-note records must also satisfy `schemas/event.schema.json`, `schemas/guide.schema.json`, or `schemas/patch-note.schema.json`.

Content IDs are permanent. Prefer a source-provided ID and publication date; title changes must not change an existing ID. `canonical_url`, source external ID, RSS GUID, content hash, normalized title/publication time, redirects, and regional relationships are duplicate signals. Similar regional or translated announcements remain separate and use `related_content_ids`.

Dates use ISO 8601 and retain the source timezone. Date-only values stay date-only. Missing dates are `null`, never invented. Events add independent registration, event, claim, and shop windows plus a derived `calendar_status`. Ended events and outdated guides remain historical records.

`content_hash` is a deterministic SHA-256 hash of semantic structured fields. Changes keep the same content ID and write the previous structured record to `snapshots/` before replacement. Crawl-only timestamps are excluded from semantic hashing.
