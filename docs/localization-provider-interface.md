# Phase 2E Backend Preparation

Phase 2E prepares the backend independently from the local model server. It does not add
or change database tables and does not introduce a cloud translation provider.

## Provider boundary

`LocalizationProvider` accepts structured fields and returns structured fields plus
runtime metadata. The local adapter is configured only through server-side environment
variables:

```text
LOCAL_MODEL_PROVIDER
LOCAL_MODEL_TRANSPORT=mock|http
LOCAL_MODEL_API_URL
LOCAL_MODEL_API_KEY
MODEL_NAME
MODEL_VERSION
LOCAL_MODEL_TIMEOUT_MS
LOCAL_MODEL_PUBLISHABLE=false|true
```

Mock is the default transport. It is deterministic, makes no network request, cannot
claim queue jobs, and can only run the read-only Worker preview.

The future HTTP request contract is:

```json
{
  "provider": "local",
  "model": "configured-at-runtime",
  "source_language": "en",
  "target_language": "zh",
  "fields": {
    "title": "Source title",
    "summary": "Source summary"
  },
  "glossary": [
    { "source": "MapleStory", "target": "冒险岛" }
  ]
}
```

Expected response:

```json
{
  "translated_fields": {
    "title": "Localized title",
    "summary": "Localized summary"
  },
  "model": "configured-at-runtime",
  "version": "server-version",
  "usage": {
    "input_tokens": 0,
    "output_tokens": 0
  }
}
```

The adapter records provider, transport, model, model version, latency, usage, glossary
version, and quality checks in existing Worker metadata columns. No model-specific
database schema is required.

## Commands

Read-only mock preview:

```powershell
npm run localization:worker -- --limit=5 --target=zh
```

The preview reads pending jobs but does not claim or update them. Real execution remains
blocked unless all three conditions are explicit:

1. `LOCAL_MODEL_TRANSPORT=http`;
2. `LOCAL_MODEL_PUBLISHABLE=true`;
3. `--apply --confirm=local-model-worker`.

## Website boundary

The website reads current `automatic` or `approved` rows from
`series_content_translations`. If no current row exists, the content API returns the
original `series_content` fields with `localization_kind=source`. The legacy realtime
`POST /api/translations` endpoint returns HTTP 410 and never calls a provider.
