# Translation quality layer

Phase 2C keeps the production pilot at five rows and adds deterministic checks before any further queue expansion.

The versioned glossary in `config/translation-glossary.json` protects exact terms and recurring source phrases with placeholders before LibreTranslate runs. The Worker then restores each field independently and records:

- number preservation;
- URL preservation;
- glossary restoration;
- placeholder preservation;
- a broad length-ratio sanity bound.

Results that pass structural checks remain `automatic`. Any failed check is stored as `needs_review` and is excluded from the public read API. Human-approved rows use `approved`; the Worker cannot overwrite them.

The five Phase 2B rows are requeued through a deliberately bounded command. Their previous automatic translations are marked `needs_review` before execution, so an interrupted quality pilot cannot continue serving known low-quality copy.

```powershell
npm run translation:quality-requeue -- --limit=5 --confirm=quality-pilot-five-only
npm run translation:worker -- --limit=5 --confirm=translation-worker-pilot
```

`zh-Hant` is explicitly blocked for the current provider. A future Traditional Chinese pipeline must use a capable provider or a separately reviewed Simplified-to-Traditional conversion stage.
