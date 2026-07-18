import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSourceAdapter } from '../adapters/index.mjs';
import { closeBrowserConnection } from '../adapters/browser/index.mjs';
import { CrawlHttpClient } from './content/http.mjs';
import { contentRecordPath, readContentRecords, readSourceRecords, writeJson } from './content/data.mjs';
import { createContentHash, normalizeContentUrl } from './content/identity.mjs';
import { createRevisionSnapshot } from './content/snapshots.mjs';
import { readCrawlState, sourceState, writeCrawlState } from './content/state.mjs';

function optionsFromArgs(args) {
  const value = (name) => args.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
  return {
    execute: args.includes('--execute'),
    official: args.includes('--official'),
    sourceId: value('source'),
    contentType: value('type'),
    maxItems: Number(value('max-items') || 25),
  };
}

async function existingContentIndex() {
  const records = await readContentRecords();
  return {
    byUrl: new Map(records.flatMap((record) => [
      [normalizeContentUrl(record.data.canonical_url), record],
      [normalizeContentUrl(record.data.source_url), record],
      ...record.data.related_urls.map((url) => [normalizeContentUrl(url), record]),
    ])),
    byId: new Map(records.map((record) => [record.data.id, record])),
    byExternalId: new Map(records
      .filter((record) => record.data.external_id)
      .map((record) => [`${record.data.source_id}:${record.data.external_id}`, record])),
  };
}

function candidateAudit(candidate, existing, previous) {
  const warnings = Array.isArray(candidate.metadata.parser_warnings) ? candidate.metadata.parser_warnings : [];
  const unconfirmedFields = Array.isArray(candidate.metadata.unconfirmed_fields) ? candidate.metadata.unconfirmed_fields : [];
  const idMatch = existing.byId.get(candidate.id);
  const externalMatch = candidate.external_id
    ? existing.byExternalId.get(`${candidate.source_id}:${candidate.external_id}`)
    : undefined;
  const duplicateSignals = [
    ...(previous ? ['canonical-url'] : []),
    ...(idMatch ? ['stable-content-id'] : []),
    ...(externalMatch ? ['source-external-id'] : []),
  ];
  const eventDates = candidate.content_type === 'event' ? {
    registration_start: candidate.registration_start,
    registration_end: candidate.registration_end,
    event_start: candidate.event_start,
    event_end: candidate.event_end,
    claim_start: candidate.claim_start,
    claim_end: candidate.claim_end,
    shop_start: candidate.shop_start,
    shop_end: candidate.shop_end,
    timezone: candidate.timezone,
  } : null;
  const requiredConfirmed = [
    candidate.original_title,
    candidate.canonical_url,
    candidate.external_id,
    candidate.published_at,
    candidate.series,
    candidate.regions.length,
    candidate.languages.length,
    candidate.content_type,
    candidate.id,
  ].every(Boolean);
  const eventConfirmed = candidate.content_type !== 'event'
    || Boolean(candidate.event_start && candidate.event_end && candidate.timezone);
  const bodyExtractable = candidate.metadata.body_extractable === true;

  return {
    original_title: candidate.original_title,
    canonical_url: candidate.canonical_url,
    source_external_id: candidate.external_id,
    published_at: candidate.published_at,
    updated_at: candidate.updated_at,
    series: candidate.series,
    regions: candidate.regions,
    languages: candidate.languages,
    content_type: candidate.content_type,
    subcategory: candidate.subcategory,
    stable_content_id: candidate.id,
    duplicate: { detected: duplicateSignals.length > 0, signals: duplicateSignals },
    body_extractable: bodyExtractable,
    storage_mode: candidate.storage_mode,
    event_dates: eventDates,
    parser_warnings: warnings,
    unconfirmed_fields: unconfirmedFields,
    quality_gate_passed: requiredConfirmed && bodyExtractable && eventConfirmed && warnings.length === 0,
  };
}

export function preserveEditorialReview(candidate, previous) {
  if (previous?.metadata?.editorial_reviewed !== true) return candidate;
  return {
    ...candidate,
    summary: previous.summary,
    metadata: {
      ...candidate.metadata,
      sections: previous.metadata.sections,
      editorial_reviewed: true,
      editorial_reviewed_at: previous.metadata.editorial_reviewed_at,
    },
  };
}

async function crawlSource(source, state, existing, options) {
  if (!source.enabled) throw new Error('source is disabled');
  if (source.requires_login) throw new Error('login-required sources cannot be crawled');
  if (source.requires_javascript && source.adapter !== 'browser') {
    throw new Error('source requires JavaScript and has no compliant browser adapter');
  }
  const currentState = sourceState(state, source.id);
  const client = new CrawlHttpClient(source, currentState);
  const now = new Date().toISOString();
  const context = {
    now,
    dryRun: !options.execute,
    cursor: currentState.cursor,
    setCursor: (cursor) => { currentState.cursor = cursor; },
    fetch: (url, requestOptions) => client.fetch(url, requestOptions),
    source,
  };
  const adapter = getSourceAdapter(source.adapter);
  const discovered = await adapter.discover(source, context);
  const items = discovered.slice(0, options.maxItems);
  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let qualityPassed = 0;
  let qualityFailed = 0;

  for (const item of items) {
    const fetched = await adapter.fetch(item, context);
    if (fetched.status === 304) {
      unchanged += 1;
      continue;
    }
    if (fetched.status === 404 || fetched.status === 410) {
      const previous = existing.byUrl.get(normalizeContentUrl(item.url));
      if (previous) {
        const removed = { ...previous.data, status: 'removed', last_checked: now };
        removed.content_hash = createContentHash(removed);
        if (previous.data.status === 'removed') {
          unchanged += 1;
          continue;
        }
        if (options.execute) {
          await createRevisionSnapshot(previous.data, removed, { detectedAt: now });
          await writeJson(previous.filePath, removed);
        }
        updated += 1;
        continue;
      }
    }
    if (fetched.status >= 400) throw new Error(`${item.url} returned HTTP ${fetched.status}`);
    const parsedItems = await adapter.parse(fetched, context);
    for (const parsed of parsedItems) {
      const normalizedItems = await adapter.normalize(parsed, source, context);
      for (const candidate of normalizedItems) {
        const key = normalizeContentUrl(candidate.canonical_url);
        const requestKey = normalizeContentUrl(item.url);
        const previous = existing.byUrl.get(key) || existing.byUrl.get(requestKey);
        const audit = candidateAudit(candidate, existing, previous);
        if (audit.quality_gate_passed) qualityPassed += 1;
        else qualityFailed += 1;
        if (!options.execute) console.log(`DRY_RUN_CANDIDATE ${JSON.stringify(audit)}`);
        if (previous) {
          candidate.id = previous.data.id;
          candidate.discovered_at = previous.data.discovered_at;
          candidate.related_content_ids = previous.data.related_content_ids;
          candidate.related_urls = previous.data.related_urls;
          candidate.tags = [...new Set([...previous.data.tags, ...candidate.tags])].sort();
          candidate.translation_status = previous.data.translation_status;
          candidate.notes = previous.data.notes;
          Object.assign(candidate, preserveEditorialReview(candidate, previous.data));
          const redirected = normalizeContentUrl(previous.data.canonical_url) !== key;
          if (redirected) {
            candidate.related_urls = [...new Set([...candidate.related_urls, previous.data.canonical_url])].sort();
          }
          candidate.content_hash = createContentHash(candidate);
          if (!redirected && candidate.content_hash === previous.data.content_hash) {
            unchanged += 1;
            continue;
          }
          candidate.status = redirected ? 'redirected' : 'updated';
          candidate.content_hash = createContentHash(candidate);
          if (options.execute) {
            await createRevisionSnapshot(previous.data, candidate, { detectedAt: now });
            await writeJson(previous.filePath, candidate);
          }
          const indexed = { ...previous, data: candidate };
          existing.byUrl.set(key, indexed);
          existing.byId.set(candidate.id, indexed);
          if (candidate.external_id) existing.byExternalId.set(`${candidate.source_id}:${candidate.external_id}`, indexed);
          updated += 1;
        } else {
          if (options.execute) await writeJson(contentRecordPath(candidate), candidate);
          const indexed = { data: candidate, filePath: contentRecordPath(candidate) };
          existing.byUrl.set(key, indexed);
          existing.byId.set(candidate.id, indexed);
          if (candidate.external_id) existing.byExternalId.set(`${candidate.source_id}:${candidate.external_id}`, indexed);
          added += 1;
        }
      }
    }
  }
  currentState.last_checked = now;
  currentState.last_success = now;
  currentState.last_error = null;
  return { discovered: discovered.length, inspected: items.length, added, updated, unchanged, qualityPassed, qualityFailed };
}

export async function runCrawl(args = process.argv.slice(2)) {
  const options = optionsFromArgs(args);
  const sourceRecords = await readSourceRecords();
  const state = await readCrawlState();
  const existing = await existingContentIndex();
  const selected = sourceRecords
    .map((record) => record.data)
    .filter((source) => !options.sourceId || source.id === options.sourceId)
    .filter((source) => !options.official || source.official)
    .filter((source) => !options.contentType || source.content_types.includes(options.contentType))
    .filter((source) => source.enabled || options.sourceId === source.id);
  if (options.sourceId && selected.length === 0) throw new Error(`Unknown source ${options.sourceId}`);

  const results = [];
  try {
    for (const source of selected) {
      try {
        const counts = await crawlSource(source, state, existing, options);
        results.push({ source: source.id, ok: true, ...counts });
        console.log(`${source.id}: discovered ${counts.discovered}, inspected ${counts.inspected}, added ${counts.added}, updated ${counts.updated}, unchanged ${counts.unchanged}, quality passed ${counts.qualityPassed}, failed ${counts.qualityFailed}`);
      } catch (error) {
        const currentState = sourceState(state, source.id);
        currentState.last_checked = new Date().toISOString();
        currentState.last_error = error instanceof Error ? error.message : String(error);
        results.push({ source: source.id, ok: false, error: currentState.last_error });
        console.warn(`${source.id}: ${currentState.last_error}`);
      }
    }
  } finally {
    closeBrowserConnection();
  }
  if (options.execute) await writeCrawlState(state);
  else console.log('Dry run complete; pass --execute to write content, snapshots, and crawl state.');
  return results;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const results = await runCrawl();
  if (results.length === 1 && !results[0].ok) process.exitCode = 1;
}
