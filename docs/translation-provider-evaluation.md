# Translation Provider Evaluation

Phase 2D compares providers without changing `translation_jobs` or the authoritative
`series_content_translations` display rows. Candidate output is stored only in the
private `translation_provider_evaluations` table; the public API never reads it.

The fixed pilot is five existing `zh` rows that are already blocked by the Phase 2C
quality gate. Routing version `1` compares DeepL, Ollama, and LibreTranslate for the
same `title + summary` source revision. Missing providers are recorded as
`unavailable`, not silently replaced by another provider.

```powershell
npm run translation:evaluate-providers -- --limit=5 --target=zh
```

The default command is a read-only dry run. It reports candidate count, provider
availability, and missing environment variable names without printing their values.

Execution requires the migration plus an explicit confirmation:

```powershell
npm run translation:evaluate-providers -- `
  --apply `
  --limit=5 `
  --target=zh `
  --confirm=provider-evaluation-five-only
```

Provider configuration:

- `LIBRETRANSLATE_API_URL`
- `DEEPL_API_KEY` and optional `DEEPL_API_URL`
- `OLLAMA_API_URL` and `OLLAMA_MODEL`

DeepL uses ordered array translation, explicit `ZH-HANS` / `ZH-HANT` targets, and
the quality-optimized model preference. Ollama uses `/api/chat`, temperature zero,
a strict translate-only prompt, and a JSON schema that preserves field boundaries.

Every completed candidate passes through the same glossary restoration and structural
quality checks used by Phase 2C. Human review remains separate through
`reviewer_score`, `reviewer_notes`, and `review_status`. Candidate rows never become
display translations automatically.

Provider policy lives in `config/translation-provider-policy.json`. Changing routing
semantics requires a new `routing_version` so old comparisons remain explainable.
