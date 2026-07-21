import path from 'node:path';
import process from 'node:process';
import { buildPublisherPlan } from './content/publisher.mjs';
import { readContentReleaseSnapshot } from './content/release.mjs';
import { buildTranslationPlan, readTranslationPolicy } from './content/translation-policy.mjs';
import { enqueueTranslationPlan } from './content/translation-queue.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function integerOption(args, name, fallback, { minimum = 0, maximum = null } = {}) {
  const value = Number.parseInt(optionValue(args, name, String(fallback)), 10);
  if (!Number.isInteger(value) || value < minimum || (maximum !== null && value > maximum)) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum ?? 'unbounded'}`);
  }
  return value;
}

async function createDatabaseClient() {
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('database access requires LOCALIZATION_DATABASE_URL');
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--apply')) throw new Error('enqueue requires --apply');
  if (optionValue(args, '--confirm') !== 'translation-jobs-only') {
    throw new Error('--apply requires --confirm=translation-jobs-only');
  }
  const releasePath = optionValue(args, '--release');
  const module = optionValue(args, '--module');
  const target = optionValue(args, '--target');
  if (!releasePath || !module || !target) {
    throw new Error('--release, --module, and --target are required');
  }
  const policyPath = optionValue(args, '--policy', 'config/translation-policy.json');
  const offset = integerOption(args, '--offset', 0);
  const limit = integerOption(args, '--limit', 0, { minimum: 1, maximum: 100 });
  const sample = integerOption(args, '--sample', 3);

  const [snapshot, policy] = await Promise.all([
    readContentReleaseSnapshot(path.resolve(releasePath)),
    readTranslationPolicy(path.resolve(policyPath)),
  ]);
  const publisherPlan = buildPublisherPlan({
    contentRecords: snapshot.contentRecords,
    sourceRecords: snapshot.sourceRecords,
    existingRows: [],
  });
  if (publisherPlan.errors.length) throw new Error('release contains invalid publisher projections');
  const plan = buildTranslationPlan({
    projections: publisherPlan.records,
    policy,
    targetLocales: [target],
    module,
    offset,
    limit,
  });
  if (plan.summary.jobs !== limit) {
    throw new Error(`pilot expected ${limit} jobs but planned ${plan.summary.jobs}`);
  }

  const client = await createDatabaseClient();
  try {
    const result = await enqueueTranslationPlan(client, { release: snapshot.release, plan });
    console.log('Translation queue apply');
    console.log(`Release: ${snapshot.release.release_id}`);
    console.log(`Policy version: ${plan.policy_version}`);
    console.log(`Target: ${target}`);
    console.log(`Module: ${module}`);
    console.log(`Requested: ${result.requested}`);
    console.log(`Created: ${result.created}`);
    console.log(`Existing: ${result.existing}`);
    console.log('Worker started: no');
    for (const row of result.rows.slice(0, sample)) console.log(JSON.stringify(row));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
