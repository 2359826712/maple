# Translation worker MVP

Phase 2B processes one explicitly bounded batch and exits. It is not a daemon or Railway cron service.

The current LibreTranslate image advertises `en`, `zh-Hans`, `ja`, and `ko`. This pilot maps database locale `zh` to provider locale `zh-Hans`; `zh-Hant` remains unsupported until a provider with Traditional Chinese output is configured.

```text
claim up to 5 jobs
        |
        v
read title + summary as separate fields
        |
        v
LibreTranslate (Argos)
        |
        v
series_content_translations
        |
        v
mark job completed
```

The provider request sends an array of field values and reconstructs a keyed field object. It never concatenates title and summary into an opaque string. Provider calls happen after the atomic claim transaction has committed.

On failure the Worker records `failed`, clears its lease, and exits non-zero after finishing the claimed batch. At startup it moves processing leases older than 30 minutes to `retry`. Phase 2B deliberately does not implement automatic provider retries, routing, or a continuous loop.

Run the first private-network pilot inside the Railway `maple` container:

```powershell
railway ssh --service maple --environment production -- node scripts/translation-worker.mjs --limit=5 --confirm=translation-worker-pilot
```

The public read endpoint is `GET /api/content-translations?content_id=<uuid>&locale=zh`. It only returns a translation whose `source_revision` still matches the current content row.
