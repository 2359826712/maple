# Content release contract

Phase 1D separates an immutable content release from a publisher execution and from translation work.

```text
content + sources
       |
       v
content-manifest.json
       |
       v
content-release.json
       |
       +--> publisher_runs
       |
       `--> translation plan (dry-run only)
```

`generated/content-release.json` conforms to `schemas/content-release.schema.json`. Its `manifest_hash`, `files`, and `generated_at` must match the referenced content manifest. The release ID is derived from the manifest hash, so rebuilding an unchanged snapshot produces the same release.

The release descriptor and its manifest are one package. A relative `manifest_uri` is resolved from the descriptor directory. A remote release must be downloaded and materialized before local planning or publishing.

## Translation policy

`config/translation-policy.json` uses database locale codes:

- `zh`
- `zh-Hant`
- `ja`
- `ko`

Public aliases are normalized at the boundary: `zh-CN` becomes `zh`, and `zh-TW` becomes `zh-Hant`.

Phase 1D permits only `title` and `summary`. `body_html` is intentionally rejected. Every candidate must have a `source_revision`; translation validity will later use `content_id + locale + source_revision`.

The policy has an explicit `policy_version`. Every planned candidate records that version, so a later field-policy change cannot silently reinterpret an older plan.

Generate the first read-only pilot plan with:

```powershell
npm run plan:translations -- --module=news --target=zh --limit=100
```

The command reads the release and policy, prints candidates, and performs zero database writes. It does not require or create `translation_jobs`.
