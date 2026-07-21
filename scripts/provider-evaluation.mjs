import path from 'node:path';
import process from 'node:process';
import { readTranslationGlossary } from './content/translation-quality.mjs';
import { readProviderPolicy } from './content/translation-provider-policy.mjs';
import {
  buildProviderEvaluationPlan,
  readProviderEvaluationSample,
  runProviderEvaluation,
} from './content/provider-evaluation.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  if (apply && optionValue(args, '--confirm') !== 'provider-evaluation-five-only') {
    throw new Error('apply requires --confirm=provider-evaluation-five-only');
  }
  const limit = Number.parseInt(optionValue(args, '--limit', '5'), 10);
  const targetLanguage = optionValue(args, '--target', 'zh');
  if (limit !== 5) throw new Error('provider evaluation must remain exactly 5 rows');
  if (targetLanguage !== 'zh') throw new Error('phase 2D provider evaluation target must remain zh');
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('LOCALIZATION_DATABASE_URL is required');
  const policy = await readProviderPolicy(path.resolve(
    optionValue(args, '--policy', 'config/translation-provider-policy.json'),
  ));
  const glossary = await readTranslationGlossary(path.resolve(
    optionValue(args, '--glossary', 'config/translation-glossary.json'),
  ));
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const sample = await readProviderEvaluationSample(client, { limit, targetLanguage });
    const plan = buildProviderEvaluationPlan({ sample, policy });
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...plan }, null, 2));
    if (!apply) return;
    const results = await runProviderEvaluation({ client, sample, policy, glossary });
    const counts = results.reduce((output, result) => {
      output[result.status] = (output[result.status] || 0) + 1;
      return output;
    }, {});
    console.log(JSON.stringify({ stored: results.length, status: counts }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
