# MPStorys website restructure baseline

Baseline date: 2026-07-27

This document is the implementation contract for the website-centered restructure.
Historical phase names remain useful for release notes, but they no longer define
the product architecture.

## Product navigation

The primary user journeys are:

1. Updates: news, patch notes, maintenance, events, Cash Shop posts, developer
   notes, creator announcements, and roadmaps.
2. Knowledge: guides, Wiki articles, bosses, maps, and source-linked reference
   material.
3. Tools: native calculators, planners, simulators, checklists, rankings, and
   map utilities.
4. Series: separate hubs for MapleStory, Classic World, MapleStory M,
   MapleStory N, MapleStory Worlds, and MapleStory: Idle RPG.

The compact primary navigation is Home, Updates, Events, Knowledge, Tools,
Series, and Search. Rankings, Shop, Community, Feedback, and account functions
remain available as contextual or secondary destinations.

## Canonical routes

- `/` is the default English/GMS homepage.
- `/updates` is the canonical updates hub.
- `/events`, `/guides`, `/wiki`, `/tools`, `/search`, and `/series` are canonical
  public hubs.
- `/series/{series-id}` and its module/detail routes preserve explicit series
  scope. Series modules use clean paths such as
  `/series/maplestory-n/updates` and `/series/maplestory-worlds/tools`; the
  sitemap does not publish `?series=` filter URLs.
- Legacy default routes ending in `/en/GMS` permanently redirect to their bare
  canonical route.
- `/news` permanently redirects to `/updates`.
- `/mapler-house` permanently redirects to the native `/tools` workspace.
- Database IDs, source revisions, and translation job identities do not change
  when public URLs change.

## Generated data snapshot

Homepage proof is generated from repository indexes instead of hard-coded copy.
The current generated snapshot contains:

- 1,600 content records
- 1,693 search records
- 93 verified resources
- 17 monitored sources
- 6 supported series

`generated/content-statistics.json` records both total and per-series coverage.
The homepage uses those values so weaker series are not presented as if their
coverage were identical to the mature MapleStory, MapleStory N, and Worlds
collections.

## Server rendering

Public pages use SSR or ISR. Their initial HTML includes the title, description,
H1, primary content, internal links, canonical URL, language alternates, and
structured data. Client components enhance filters, search, saved state, and
tool interactions; they do not supply the only copy visible to crawlers.

Default English/GMS pages do not require a locale/server suffix. Search,
account, admin, and temporary filter combinations remain noindex where
appropriate.

## Translation read contract

The website reads translations without creating jobs. Database locale mapping
stays at the route boundary:

- `zh-CN` -> `zh`
- `zh-TW`, `zh-HK`, `zh-Hant` -> `zh-Hant`
- `ja-*` -> `ja`
- `ko-*` -> `ko`
- `en-*` -> `en`

Published translations must match the current `source_revision` and have
`review_status` equal to `automatic` or `approved`.

Localization is resolved per field. Missing or empty translated title, summary,
body HTML, or structured content falls back to the corresponding source field.
One translated field must never cause another empty translated field to hide
valid source content.

While the existing Worker is running, the website does not modify the identity,
status, lease, or RPC contract of `translation_jobs`,
`series_content_translations`, full-text translation tables, or Wiki
translation tables.

## Tool contract

An available tool is an on-site working experience, not an introduction plus an
external redirect. Each supported series/tool pair supplies input validation,
calculation or query behavior, an explained result, error handling, mobile
interaction, provenance, and tests.

Shared presentation may be reused, but series-specific rules and data remain
behind adapters or versioned rule sets. Unsupported combinations are labelled
unavailable, planned, or external instead of silently using another series'
rules.

News content remains in `series_content`; translations remain in translation
tables; reusable resource records remain in `resources`; Wiki mirrors remain in
`wiki_mirror_page`; game entities and calculation rules remain separate from
the content translation queue.

## Release gates

Before production deployment:

1. Validate source/content schemas and duplicate detection.
2. Run the complete test, type-check, and production build suites.
3. Verify public pages from returned HTML with JavaScript disabled.
4. Verify legacy redirects, canonical URLs, sitemap entries, and language
   alternates.
5. Verify every tool marked available with deterministic fixtures.
6. Use a read-only database role for the website.
7. Schedule a controlled integration window for any Worker RPC, lease,
   translation constraint, or schema change.
8. Add atomic translation completion, revision rechecks, lease recovery, and
   durable cache-invalidation outbox support before the translation pipeline is
   treated as unattended production infrastructure.
