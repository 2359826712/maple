import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { readContentRecords, readSourceRecords } from './content/data.mjs';
import { readPublisherSnapshot } from './content/manifest.mjs';
import { applySeriesContent, readSeriesContent } from './content/publisher-database.mjs';
import { buildPublisherPlan } from './content/publisher.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function createDatabaseClient() {
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('database access requires LOCALIZATION_DATABASE_URL');
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

async function readExistingRows(args, projections = null) {
  const snapshotPath = optionValue(args, '--existing');
  if (snapshotPath) {
    const value = JSON.parse(await readFile(snapshotPath, 'utf8'));
    if (!Array.isArray(value)) throw new Error('--existing must point to a JSON array');
    return { comparison: `snapshot:${snapshotPath}`, rows: value };
  }

  if (!args.includes('--compare-database')) return { comparison: 'empty-target', rows: [] };
  const client = await createDatabaseClient();
  try {
    await client.query('begin read only');
    const rows = [];
    const batches = projections
      ? Array.from({ length: Math.ceil(projections.length / 100) }, (_, index) => (
        projections.slice(index * 100, (index + 1) * 100)
      ))
      : [null];
    for (const batch of batches) rows.push(...await readSeriesContent(client, batch));
    await client.query('rollback');
    return { comparison: 'database-read-only', rows };
  } finally {
    await client.end();
  }
}

function selectContentRecords(records, args, applyMode) {
  const series = optionValue(args, '--series');
  const contentType = optionValue(args, '--type');
  const id = optionValue(args, '--id');
  const limitValue = optionValue(args, '--limit');
  const offsetValue = optionValue(args, '--offset', '0');
  const limit = limitValue === null ? null : Number.parseInt(limitValue, 10);
  const offset = Number.parseInt(offsetValue, 10);

  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) {
    throw new Error('--limit must be a positive integer');
  }
  if (!Number.isInteger(offset) || offset < 0) throw new Error('--offset must be a non-negative integer');
  if (applyMode && (limit === null || limit > 500)) {
    throw new Error('--apply requires an explicit --limit between 1 and 500');
  }
  if (applyMode && !series && !contentType && !id) {
    throw new Error('--apply requires at least one explicit --series, --type, or --id selector');
  }

  const selected = records
    .filter((record) => !series || record.data.series === series)
    .filter((record) => !contentType || record.data.content_type === contentType)
    .filter((record) => !id || record.data.id === id)
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const limited = limit === null ? selected.slice(offset) : selected.slice(offset, offset + limit);
  if (!limited.length) throw new Error('publisher selectors matched no content records');
  return limited;
}

async function readPublisherInput(args, applyMode) {
  const manifestPath = optionValue(args, '--manifest');
  if (applyMode && !manifestPath) throw new Error('--apply requires --manifest=<path>');
  if (manifestPath) {
    const snapshot = await readPublisherSnapshot(manifestPath);
    return {
      snapshot: `manifest:${manifestPath}#${snapshot.manifest.root_sha256}`,
      manifest: snapshot.manifest,
      contentRecords: snapshot.contentRecords,
      sourceRecords: snapshot.sourceRecords,
    };
  }
  const [contentRecords, sourceRecords] = await Promise.all([readContentRecords(), readSourceRecords()]);
  return { snapshot: 'live-directory', contentRecords, sourceRecords };
}

function printSummary(result, context, sampleSize, title = 'Content Publisher dry-run') {
  const { summary } = result;
  console.log(title);
  console.log(`Snapshot: ${context.snapshot}`);
  console.log(`Comparison: ${context.comparison}`);
  console.log(`Files: ${summary.files}`);
  console.log(`Insert: ${summary.insert}`);
  console.log(`Update: ${summary.update}`);
  console.log(`Skip: ${summary.skip}`);
  console.log(`Errors: ${summary.error}`);
  console.log(`Series: ${JSON.stringify(result.mappings.series)}`);
  console.log(`Editions: ${JSON.stringify(result.mappings.editions)}`);
  console.log(`Modules: ${JSON.stringify(result.mappings.modules)}`);

  if (result.errors.length) {
    console.log('\nErrors:');
    for (const error of result.errors.slice(0, sampleSize)) {
      console.log(`- ${error.source_file}: ${error.error}`);
    }
  }

  if (sampleSize > 0 && result.records.length) {
    console.log('\nSample:');
    for (const record of result.records.slice(0, sampleSize)) {
      console.log(JSON.stringify({
        source_file: record.source_file,
        series: record.series_id,
        edition: record.edition_id,
        module: record.module,
        slug: record.slug,
        action: record.action,
        title: record.title,
        source_revision: record.source_revision,
        translations_needed: record.translations_needed,
      }));
    }
  }
}

async function runDryRun(args, input, format, sampleSize) {
  const candidates = args.includes('--compare-database')
    ? buildPublisherPlan({
      contentRecords: input.contentRecords,
      sourceRecords: input.sourceRecords,
      existingRows: [],
    })
    : null;
  const target = await readExistingRows(args, candidates?.records || null);
  const result = buildPublisherPlan({
    contentRecords: input.contentRecords,
    sourceRecords: input.sourceRecords,
    existingRows: target.rows,
  });
  const context = { snapshot: input.snapshot, comparison: target.comparison };
  if (format === 'json') console.log(JSON.stringify({ dry_run: true, ...context, ...result }, null, 2));
  else printSummary(result, context, sampleSize);
  if (result.errors.length) process.exitCode = 1;
}

async function runApply(args, input, format, sampleSize) {
  if (optionValue(args, '--confirm') !== 'series-content-only') {
    throw new Error('--apply requires --confirm=series-content-only');
  }
  if (args.some((argument) => argument.startsWith('--existing=')) || args.includes('--compare-database')) {
    throw new Error('--apply cannot be combined with --existing or --compare-database');
  }

  const client = await createDatabaseClient();
  try {
    const applied = await applySeriesContent(client, {
      ...input,
      runContext: {
        manifestHash: input.manifest.root_sha256,
        sourceCount: input.manifest.file_count,
        selectedCount: input.contentRecords.length,
        selector: {
          series: optionValue(args, '--series'),
          content_type: optionValue(args, '--type'),
          content_id: optionValue(args, '--id'),
          offset: Number.parseInt(optionValue(args, '--offset', '0'), 10),
          limit: Number.parseInt(optionValue(args, '--limit'), 10),
        },
      },
    });
    const context = { snapshot: input.snapshot, comparison: 'database-transaction' };
    const output = {
      applied: true,
      series_content_only: true,
      ...context,
      ...applied.plan,
      written: applied.written,
      verified: applied.verified,
      publisher_run: applied.publisherRun,
    };
    if (format === 'json') console.log(JSON.stringify(output, null, 2));
    else {
      printSummary(applied.plan, context, sampleSize, 'Content Publisher apply');
      console.log(`Written: ${applied.written.length}`);
      console.log(`Verified: ${applied.verified}`);
      console.log(`Publisher run: ${applied.publisherRun.id}`);
      console.log('Translation jobs created: 0');
    }
  } finally {
    await client.end();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const applyMode = args.includes('--apply');
  if (dryRun === applyMode) throw new Error('pass exactly one of --dry-run or --apply');

  const format = optionValue(args, '--format', 'summary');
  const sampleSize = Number.parseInt(optionValue(args, '--sample', '3'), 10);
  if (!['summary', 'json'].includes(format)) throw new Error('--format must be summary or json');
  if (!Number.isInteger(sampleSize) || sampleSize < 0) throw new Error('--sample must be a non-negative integer');

  const input = await readPublisherInput(args, applyMode);
  input.contentRecords = selectContentRecords(input.contentRecords, args, applyMode);
  if (dryRun) await runDryRun(args, input, format, sampleSize);
  else await runApply(args, input, format, sampleSize);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
