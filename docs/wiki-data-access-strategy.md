# Wiki data-access strategy (TRUST-12)

This document defines how MPStorys obtains, stores, and presents wiki material. It is part of the repository so builds and tests do not depend on a private sibling directory.

## Principles

- Use only publicly available pages or APIs whose access rules permit the request.
- Preserve the canonical source URL, source identity, and last-sync metadata with mirrored records.
- Sanitize mirrored HTML before rendering it and reject records that fail validation.
- Cache requests and use the local mirror to reduce unnecessary traffic to source sites.
- Keep a visible route to the original source when content cannot be rendered reliably.

## Database mirror

The application reads the MPStorys wiki mirror first through the `/wiki/mirror/pages` API. A title lookup uses the mirror record when it contains validated HTML. Mirror records retain the source page ID, source URL, text or sanitized HTML, tags, and available synchronization timestamps.

The mirror is a read-optimized copy, not an authority that replaces the original wiki. Canonical source links remain attached to entries, and source corrections should be picked up by an authorized synchronization process rather than edited into the client as invented facts.

## Fallback behavior

If the Database mirror is unavailable or does not contain usable HTML, the application may use a documented public wiki API as a read-only fallback. Responses are cached, validated, and sanitized before display. A failure does not trigger retries that bypass source controls; the UI keeps the original-source link available and may show a plain-text or unavailable-content state.

Raw wikitext and redirect pages are detected before rendering. Content that cannot be rendered safely is not injected as trusted HTML.

## No circumvention

MPStorys uses **No circumvention** as a hard rule:

- Do not bypass CAPTCHA, login requirements, paywalls, robots restrictions, rate limits, IP blocks, or anti-bot challenges.
- Do not reuse browser cookies, private tokens, or authenticated user sessions for mirroring.
- Do not rotate identities or endpoints to evade a denial or quota.
- Treat HTTP 401, 403, 429, and equivalent access denials as a stop or defer signal.

When access is denied, retain the canonical link and existing lawful metadata, record only minimal verification evidence where required, and wait for an authorized access path or source-state change.

## Operational checks

Changes to the wiki access path must keep these controls intact:

1. Local mirror lookup remains the preferred article-data path.
2. Source URLs and synchronization timestamps remain attributable.
3. Mirrored HTML passes the shared sanitizer and wiki-data validator.
4. The article UI preserves safe fallback and original-source actions.
5. Tests confirm that article rendering does not directly scrape source HTML in the page component.

Any new source or ingestion process requires a separate review of its terms, robots policy, request rate, storage permission, and attribution requirements before activation.
