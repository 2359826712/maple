# Native localization rollout

`native-localization-v1` rewrites stored MapleStory content as native product,
editorial, or reference copy while preserving source facts. It never runs from
an HTTP request.

## Production boundaries

- `LocalizationWorker-repair.exe` remains the only executor allowed to claim
  and complete `translation_jobs`.
- The website reads only `automatic`, `approved`, or legacy `reviewed` rows and
  falls back to the current source text.
- Native rows that fail the automatic quality gate are failed and retried; they
  never enter a human-review queue or replace the source fallback.
- The Node content Worker remains preview-only.
- `wiki_localization_jobs` is isolated from the legacy EXE queue.
- The migration does not enqueue native content or Wiki work.

## UI copy

Export the stable English UI source contract:

```powershell
npm run localization:export-ui
```

Preview missing or stale entries:

```powershell
npm run localization:ui -- --locale=zh --limit=100
```

On the model machine, write quality-gated native UI copy:

```powershell
$env:LOCAL_MODEL_TRANSPORT='openai'
$env:LOCAL_MODEL_API_URL='http://127.0.0.1:8990/v1/chat/completions'
$env:LOCAL_MODEL_API_KEY='<local key>'
$env:MODEL_NAME='maplestory-qwen2.5-7b-q4_k_m'
$env:MODEL_VERSION='Qwen2.5-7B-Instruct-GGUF-Q4_K_M'
npm run localization:ui -- --locale=zh --limit=100 --apply --confirm=ui-localization
```

Repeat for `zh-Hant`, `ja`, and `ko`. Each replacement archives the previous
published row in `localization_audit`.

## Dynamic content and Wiki

After the EXE Worker supports `native-localization-v1`, `body_html`, and the
native prompt, enqueue dynamic content explicitly:

```sql
select public.enqueue_native_series_localization_jobs(100);
```

After a Wiki-capable local executor is installed, enqueue Wiki pages:

```sql
select public.enqueue_wiki_localization_jobs(100);
```

Do not call either enqueue function before its matching model-machine executor
is installed. This prevents the legacy EXE Worker from publishing literal
translations under the native policy.
