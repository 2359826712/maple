import path from 'node:path';
import { unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getSourceAdapter } from '../adapters/index.mjs';
import { closeBrowserConnection } from '../adapters/browser/index.mjs';
import { buildResourceIndex } from './build-index.mjs';
import { candidateAudit, preserveDerivedEventState, preserveEditorialReview } from './crawl.mjs';
import { createProgressLogger, runBackfillEngine } from './content/backfill-engine.mjs';
import {
  createHistoricalState,
  readHistoricalState,
  writeHistoricalState,
} from './content/backfill-state.mjs';
import { CrawlHttpClient } from './content/http.mjs';
import {
  contentDirectory,
  contentRecordPath,
  readContentRecords,
  readSourceRecords,
  snapshotsDirectory,
  writeJson,
} from './content/data.mjs';
import { findContentDuplicates } from './content/duplicates.mjs';
import { createContentHash, normalizeContentUrl, normalizeTitle } from './content/identity.mjs';
import { createRevisionSnapshot } from './content/snapshots.mjs';
import { sourceState } from './content/state.mjs';
import { validateContentSet } from './content/validation.mjs';
import { repositoryRoot } from './lib/resource-index.mjs';

export function backfillOptions(args) {
  const value = (name) => args.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
  const number = (name, fallback) => {
    const parsed = Number(value(name));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };
  return {
    sourceId: value('source'),
    execute: args.includes('--execute'),
    dryRun: args.includes('--dry-run') || !args.includes('--execute'),
    resume: args.includes('--resume'),
    maxPages: number('max-pages', Infinity),
    duplicateThreshold: number('duplicate-threshold', 100),
    consecutive404Limit: number('consecutive-404s', 3),
  };
}

const textTokens = (value) => new Set(normalizeTitle(value || '').split(/[^\p{L}\p{N}]+/u).filter(Boolean));

export function contentSimilarity(left, right) {
  const a = textTokens(left);
  const b = textTokens(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return (2 * intersection) / (a.size + b.size);
}

export async function createBackfillContentIndex(root = contentDirectory) {
  const records = await readContentRecords(root);
  return {
    records,
    byUrl: new Map(records.flatMap((record) => [
      [normalizeContentUrl(record.data.canonical_url), record],
      [normalizeContentUrl(record.data.source_url), record],
      ...record.data.related_urls.map((url) => [normalizeContentUrl(url), record]),
    ])),
    byId: new Map(records.map((record) => [record.data.id, record])),
    byExternalId: new Map(records.filter((record) => record.data.external_id)
      .map((record) => [`${record.data.source_id}:${record.data.external_id}`, record])),
    byHash: new Map(records.map((record) => [record.data.content_hash, record])),
    bySourceDate: new Map(records.map((record) => [
      `${record.data.source_id}:${record.data.published_at?.slice(0, 10) || 'unknown'}`,
      record,
    ])),
  };
}

function indexCandidate(existing, candidate, filePath) {
  const record = { data: candidate, filePath, relativePath: path.relative(repositoryRoot, filePath).replaceAll(path.sep, '/') };
  existing.records.push(record);
  existing.byUrl.set(normalizeContentUrl(candidate.canonical_url), record);
  existing.byId.set(candidate.id, record);
  if (candidate.external_id) existing.byExternalId.set(`${candidate.source_id}:${candidate.external_id}`, record);
  existing.byHash.set(candidate.content_hash, record);
  existing.bySourceDate.set(`${candidate.source_id}:${candidate.published_at?.slice(0, 10) || 'unknown'}`, record);
  return record;
}

function replaceIndexedCandidate(existing, previous, candidate) {
  previous.data = candidate;
  existing.byUrl.set(normalizeContentUrl(candidate.canonical_url), previous);
  existing.byId.set(candidate.id, previous);
  if (candidate.external_id) existing.byExternalId.set(`${candidate.source_id}:${candidate.external_id}`, previous);
  existing.byHash.set(candidate.content_hash, previous);
}

export function duplicateForCandidate(candidate, existing, previous) {
  if (previous) return { record: previous, signal: 'identity' };
  const hashMatch = existing.byHash.get(candidate.content_hash);
  if (hashMatch?.data.source_id === candidate.source_id) return { record: hashMatch, signal: 'content-hash' };
  const sameDate = existing.bySourceDate.get(`${candidate.source_id}:${candidate.published_at?.slice(0, 10) || 'unknown'}`);
  if (sameDate && contentSimilarity(candidate.summary || candidate.title, sameDate.data.summary || sameDate.data.title) >= 0.995) {
    return { record: sameDate, signal: 'content-similarity' };
  }
  return null;
}

function previousCandidate(candidate, item, existing) {
  const key = normalizeContentUrl(candidate.canonical_url);
  const requestKey = normalizeContentUrl(item.url);
  const identity = candidate.external_id
    ? existing.byExternalId.get(`${candidate.source_id}:${candidate.external_id}`)
    : existing.byId.get(candidate.id);
  return identity || (!candidate.metadata.event_occurrence_key
    ? existing.byUrl.get(key) || existing.byUrl.get(requestKey)
    : undefined);
}

async function validateCandidate(candidate, filePath, sourceRecords) {
  const record = {
    data: candidate,
    filePath,
    relativePath: path.relative(repositoryRoot, filePath).replaceAll(path.sep, '/'),
  };
  return validateContentSet([record], { sourceRecords });
}

export async function persistCandidateUpdate(previous, candidate, options = {}) {
  const contentRoot = options.contentRoot || contentDirectory;
  const snapshotRoot = options.snapshotRoot || snapshotsDirectory;
  const targetFilePath = contentRecordPath(candidate, contentRoot);
  await createRevisionSnapshot(previous.data, candidate, {
    detectedAt: options.detectedAt,
    root: snapshotRoot,
  });
  await writeJson(targetFilePath, candidate);
  if (targetFilePath !== previous.filePath) await unlink(previous.filePath);
  previous.filePath = targetFilePath;
  previous.relativePath = path.relative(repositoryRoot, targetFilePath).replaceAll(path.sep, '/');
  return targetFilePath;
}

function createPageProcessor({ source, sourceRecords, adapter, context, existing, options, log }) {
  return async (items, page) => {
    const counts = {
      processed: 0, added: 0, updated: 0, duplicates: 0, skipped: 0,
      parserErrors: 0, httpErrors: 0, trailingDuplicates: 0,
      parserWarnings: 0, eventSplitArticles: 0, eventSplitRecords: 0,
      contentTypes: {},
      firstExternalId: items[0]?.externalId || null,
      lastExternalId: items.at(-1)?.externalId || null,
      firstPublishedAt: items[0]?.publishedAt || null,
      lastPublishedAt: items.at(-1)?.publishedAt || null,
    };
    const markProcessed = (duplicate = false) => {
      counts.processed += 1;
      counts.trailingDuplicates = duplicate ? counts.trailingDuplicates + 1 : 0;
    };
    const reportCandidate = (candidate, audit, outcome, duplicateSignal = null) => {
      if (!options.dryRun) return;
      log(`BACKFILL_CANDIDATE ${JSON.stringify({
        page: page?.index ?? null,
        external_id: candidate.external_id,
        stable_content_id: candidate.id,
        title: candidate.title,
        content_type: candidate.content_type,
        canonical_url: candidate.canonical_url,
        published_at: candidate.published_at,
        event_start: candidate.event_start ?? null,
        event_end: candidate.event_end ?? null,
        claim_end: candidate.claim_end ?? null,
        parser_warnings: audit.parser_warnings,
        duplicate_signal: duplicateSignal,
        outcome,
      })}`);
    };
    for (const item of items) {
      let fetched;
      try {
        fetched = await adapter.fetch(item, context);
      } catch (error) {
        markProcessed();
        counts.skipped += 1;
        counts.httpErrors += 1;
        log(`${source.id}: item fetch failed for ${item.url}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (fetched.status === 304) {
        markProcessed(true);
        counts.duplicates += 1;
        counts.skipped += 1;
        continue;
      }
      if (fetched.status >= 400) {
        markProcessed();
        counts.skipped += 1;
        counts.httpErrors += 1;
        continue;
      }
      let parsedItems;
      try {
        parsedItems = await adapter.parse(fetched, context);
      } catch (error) {
        markProcessed();
        counts.skipped += 1;
        counts.parserErrors += 1;
        log(`${source.id}: parser failed for ${item.url}: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }
      if (parsedItems.length > 1) {
        counts.eventSplitArticles += 1;
        counts.eventSplitRecords += parsedItems.length;
      }
      for (const parsed of parsedItems) {
        let candidates;
        try {
          candidates = await adapter.normalize(parsed, source, context);
        } catch (error) {
          markProcessed();
          counts.skipped += 1;
          counts.parserErrors += 1;
          continue;
        }
        for (const candidate of candidates) {
          markProcessed();
          counts.contentTypes[candidate.content_type] = (counts.contentTypes[candidate.content_type] || 0) + 1;
          counts.parserWarnings += Array.isArray(candidate.metadata.parser_warnings)
            ? candidate.metadata.parser_warnings.length
            : 0;
          const previous = previousCandidate(candidate, item, existing);
          const audit = candidateAudit(candidate, existing, previous);
          if (!audit.quality_gate_passed) {
            reportCandidate(candidate, audit, 'invalid');
            counts.skipped += 1;
            counts.parserErrors += 1;
            continue;
          }
          const duplicate = duplicateForCandidate(candidate, existing, previous);
          if (duplicate && !previous) {
            reportCandidate(candidate, audit, 'duplicate', duplicate.signal);
            counts.duplicates += 1;
            counts.skipped += 1;
            counts.trailingDuplicates += 1;
            continue;
          }
          if (previous) {
            candidate.id = previous.data.id;
            candidate.discovered_at = previous.data.discovered_at;
            candidate.related_content_ids = previous.data.related_content_ids;
            candidate.related_urls = previous.data.related_urls;
            candidate.tags = [...new Set([...previous.data.tags, ...candidate.tags])].sort();
            candidate.translation_status = previous.data.translation_status;
            candidate.notes = previous.data.notes;
            Object.assign(candidate, preserveDerivedEventState(candidate, previous.data));
            Object.assign(candidate, preserveEditorialReview(candidate, previous.data));
            candidate.content_hash = createContentHash(candidate);
            if (candidate.content_hash === previous.data.content_hash) {
              reportCandidate(candidate, audit, 'unchanged', 'identity');
              counts.duplicates += 1;
              counts.skipped += 1;
              counts.trailingDuplicates += 1;
              continue;
            }
            candidate.status = 'updated';
            candidate.content_hash = createContentHash(candidate);
            const targetFilePath = contentRecordPath(candidate, contentDirectory);
            const errors = await validateCandidate(candidate, targetFilePath, sourceRecords);
            if (errors.length) {
              reportCandidate(candidate, audit, 'invalid-update');
              counts.skipped += 1;
              counts.parserErrors += 1;
              log(`${source.id}: invalid update ${candidate.id}: ${errors.join('; ')}`);
              continue;
            }
            if (options.execute) {
              await persistCandidateUpdate(previous, candidate, { detectedAt: context.now });
            } else {
              previous.filePath = targetFilePath;
              previous.relativePath = path.relative(repositoryRoot, targetFilePath).replaceAll(path.sep, '/');
            }
            replaceIndexedCandidate(existing, previous, candidate);
            reportCandidate(candidate, audit, 'updated', 'identity');
            counts.updated += 1;
            continue;
          }

          const filePath = contentRecordPath(candidate, contentDirectory);
          const errors = await validateCandidate(candidate, filePath, sourceRecords);
          if (errors.length) {
            reportCandidate(candidate, audit, 'invalid-new');
            counts.skipped += 1;
            counts.parserErrors += 1;
            log(`${source.id}: invalid candidate ${candidate.id}: ${errors.join('; ')}`);
            continue;
          }
          if (options.execute) await writeJson(filePath, candidate);
          indexCandidate(existing, candidate, filePath);
          reportCandidate(candidate, audit, 'added');
          counts.added += 1;
        }
      }
    }

    if (options.execute) {
      const records = await readContentRecords();
      const validationErrors = await validateContentSet(records, { sourceRecords });
      const duplicates = findContentDuplicates(records);
      if (validationErrors.length) log(`${source.id}: page validation reported ${validationErrors.length} error(s)`);
      if (duplicates.ids.length || duplicates.urls.length || duplicates.externalIds.length) {
        log(`${source.id}: page duplicate validation reported an identifier conflict`);
      }
    }
    return counts;
  };
}

export async function runBackfill(args = process.argv.slice(2), runtime = {}) {
  const options = backfillOptions(args);
  const sourceRecords = runtime.sourceRecords || await readSourceRecords();
  const sources = sourceRecords.map((record) => record.data)
    .filter((source) => !options.sourceId || source.id === options.sourceId);
  if (options.sourceId && sources.length === 0) throw new Error(`Unknown source ${options.sourceId}`);
  const log = runtime.log || createProgressLogger();
  const existing = runtime.existing || await createBackfillContentIndex();
  const results = [];
  let interrupted = false;
  const interrupt = () => { interrupted = true; };
  process.once('SIGINT', interrupt);

  try {
    for (const source of sources) {
      if (!source.enabled || source.requires_login) {
        log(`${source.id}: source is disabled or requires login`);
        continue;
      }
      const adapter = (runtime.getAdapter || getSourceAdapter)(source.adapter);
      const savedState = options.resume ? await (runtime.readState || readHistoricalState)(source.id) : null;
      if (options.resume && !savedState) throw new Error(`No historical checkpoint exists for ${source.id}`);
      const now = new Date().toISOString();
      const state = savedState || createHistoricalState(source.id, now);
      const httpState = state.http_state || sourceState({ sources: {} }, source.id);
      state.http_state = httpState;
      const client = runtime.clientFactory
        ? runtime.clientFactory(source, httpState)
        : new CrawlHttpClient(source, httpState, { conditionalRequests: options.execute });
      const context = {
        now,
        dryRun: options.dryRun,
        source,
        clientMetrics: client.metrics,
        fetch: (url, requestOptions) => client.fetch(url, requestOptions),
      };
      const processItems = runtime.processItems || createPageProcessor({
        source, sourceRecords, adapter, context, existing, options, log,
      });
      const result = await runBackfillEngine({
        source,
        adapter,
        context,
        initialState: state,
        maxPages: options.maxPages,
        duplicateThreshold: options.duplicateThreshold,
        consecutive404Limit: options.consecutive404Limit,
        processItems,
        checkpoint: options.execute
          ? (value) => (runtime.writeState || writeHistoricalState)(value)
          : async () => {},
        log,
        stopRequested: () => interrupted,
      });
      results.push({ source: source.id, ...result });
      log(`${source.id}: stop=${result.state.stop_reason} metrics=${JSON.stringify(result.metrics)}`);
      if (interrupted) break;
    }
  } finally {
    process.removeListener('SIGINT', interrupt);
    closeBrowserConnection();
  }

  if (options.execute && results.some((result) => result.supported)) {
    const indexes = await (runtime.buildIndexes || buildResourceIndex)();
    log(`Historical backfill rebuilt unified search with ${indexes.search.length} record(s).`);
  } else if (options.dryRun) {
    log('Historical backfill dry run complete; content, snapshots, checkpoints, and generated indexes were not written.');
  }
  return results;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await runBackfill();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
