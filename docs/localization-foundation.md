# Phase 2D Localization Foundation

Phase 2D resolves MapleStory language assets before any external translation call.
The existing queue, revision checks, Worker lease model, and display quality gate stay
unchanged. DeepL, Ollama, and LibreTranslate remain optional final fallbacks.

Resolution order in translation policy v2:

1. exact approved localization;
2. fully covered glossary composition;
3. approved localization memory;
4. approved deterministic template;
5. external provider, currently disabled for the pilot.

Partial glossary replacement is rejected. For example, `MapleStory Maintenance Notice`
can resolve to `冒险岛 维护公告`, while an arbitrary sentence containing only the term
`MapleStory` remains unresolved and is not published.

## Data boundaries

- `localization_memory` stores exact, official, manual, glossary, and future machine assets.
- `localization_resolutions` stores private resolver candidates and their audit metadata.
- `translation_jobs.resolution_type` records how a completed task was resolved.
- `series_content_translations` is not written by Phase 2D. Promotion requires a separate
  reviewed action in a later phase.

Both new tables have RLS enabled and grant no access to `anon` or `authenticated`.

## Commands

Preview the versioned memory assets:

```powershell
npm run localization:sync-memory
```

Sync the approved asset set:

```powershell
npm run localization:sync-memory -- `
  --apply `
  --confirm=localization-memory-v1
```

Preview the fixed five-row production pilot:

```powershell
npm run localization:resolve-pilot -- --limit=5 --target=zh
```

Persist private candidates without changing display translations:

```powershell
npm run localization:resolve-pilot -- `
  --apply `
  --limit=5 `
  --target=zh `
  --confirm=localization-pilot-five-only
```

Assets live in `config/localization-assets.json`. Any semantic change requires a new
`asset_version`; resolution behavior changes require a new translation `policy_version`.
