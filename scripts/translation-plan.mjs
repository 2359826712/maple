import path from 'node:path';
import process from 'node:process';
import { buildPublisherPlan } from './content/publisher.mjs';
import { readContentReleaseSnapshot } from './content/release.mjs';
import { buildTranslationPlan, readTranslationPolicy } from './content/translation-policy.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function integerOption(args, name, fallback, { minimum = 0 } = {}) {
  const value = Number.parseInt(optionValue(args, name, String(fallback)), 10);
  if (!Number.isInteger(value) || value < minimum) throw new Error(`${name} must be an integer >= ${minimum}`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const releasePath = optionValue(args, '--release', 'generated/content-release.json');
  const policyPath = optionValue(args, '--policy', 'config/translation-policy.json');
  const targets = args.filter((argument) => argument.startsWith('--target='))
    .map((argument) => argument.slice('--target='.length));
  const module = optionValue(args, '--module');
  const offset = integerOption(args, '--offset', 0);
  const limitValue = optionValue(args, '--limit');
  const limit = limitValue === null ? null : integerOption(args, '--limit', 0, { minimum: 1 });
  const sample = integerOption(args, '--sample', 10);
  const format = optionValue(args, '--format', 'summary');
  if (!['summary', 'json'].includes(format)) throw new Error('--format must be summary or json');

  const [snapshot, policy] = await Promise.all([
    readContentReleaseSnapshot(path.resolve(releasePath)),
    readTranslationPolicy(path.resolve(policyPath)),
  ]);
  const publisherPlan = buildPublisherPlan({
    contentRecords: snapshot.contentRecords,
    sourceRecords: snapshot.sourceRecords,
    existingRows: [],
  });
  if (publisherPlan.errors.length) {
    throw new Error(`release contains ${publisherPlan.errors.length} invalid publisher projection(s)`);
  }
  const plan = buildTranslationPlan({
    projections: publisherPlan.records,
    policy,
    targetLocales: targets,
    module,
    offset,
    limit,
  });
  const output = {
    dry_run: true,
    database_writes: 0,
    release: snapshot.release,
    policy: {
      path: policyPath,
      version: policy.policy_version,
      targets: targets.length ? targets : policy.targets,
    },
    ...plan,
  };

  if (format === 'json') {
    console.log(JSON.stringify(output, null, 2));
    return;
  }
  console.log('Translation plan dry-run');
  console.log(`Release: ${snapshot.release.release_id}`);
  console.log(`Manifest: ${snapshot.release.manifest_hash}`);
  console.log(`Policy version: ${plan.policy_version}`);
  console.log(`Content available: ${plan.summary.content_available}`);
  console.log(`Content selected: ${plan.summary.content_selected}`);
  console.log(`Would create: ${plan.summary.jobs}`);
  console.log(`Locales: ${JSON.stringify(plan.mappings.locales)}`);
  console.log(`Modules: ${JSON.stringify(plan.mappings.modules)}`);
  console.log(`Fields: ${JSON.stringify(plan.mappings.fields)}`);
  console.log('Database writes: 0');
  if (sample > 0) {
    console.log('\nSample:');
    for (const job of plan.jobs.slice(0, sample)) console.log(JSON.stringify(job));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
