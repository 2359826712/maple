# Translation queue contract

Phase 2A introduces durable translation demand without starting a translation worker.

Each queue row represents one content revision and target locale. The row bundles the policy-selected fields in `field_names`; it is not one row per field. This keeps the first pilot at exactly 100 news records × one `zh` target = 100 jobs and matches the authoritative `series_content_translations` row shape.

Queue correctness is identified by:

```text
content_id + target_language + source_revision + policy_version
```

`release_id` provides batch progress and audit context but is not part of the deduplication identity. The same unchanged content may appear in several releases without requiring duplicate translation work.

`series_content_translations` remains the authoritative current display row keyed by `content_id + locale`. Phase 2A does not alter it. A future worker may replace that row only after confirming the job revision still matches the current source; the queue's revision-aware unique key prevents duplicate work and preserves stale detection.

The database claim function changes eligible `pending` or `retry` rows to `processing` using `FOR UPDATE SKIP LOCKED`. It returns after the claim transaction; a future worker must call the provider outside that transaction.

The first production pilot is deliberately bounded:

```powershell
npm run enqueue:translations -- --apply --release=generated/content-release.json --module=news --target=zh --limit=100 --confirm=translation-jobs-only
```

The command only inserts queue rows. It does not call LibreTranslate or write `series_content_translations`.
