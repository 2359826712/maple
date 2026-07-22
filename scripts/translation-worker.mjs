import { hostname } from 'node:os';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { createLocalModelProvider } from './content/local-model-provider.mjs';
import { previewTranslationWorker, runTranslationWorker } from './content/translation-worker.mjs';
import { readTranslationGlossary } from './content/translation-quality.mjs';

const targetLanguages = new Set(['zh', 'zh-Hant', 'ja', 'ko']);

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  if (apply && optionValue(args, '--confirm') !== 'local-model-worker') {
    throw new Error('apply requires --confirm=local-model-worker');
  }
  const limit = Number.parseInt(optionValue(args, '--limit', '5'), 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    throw new Error('--limit must be between 1 and 10');
  }
  const targetLanguage = optionValue(args, '--target', 'zh');
  if (!targetLanguages.has(targetLanguage)) throw new Error('--target must be zh, zh-Hant, ja, or ko');
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('LOCALIZATION_DATABASE_URL is required');
  const provider = createLocalModelProvider();
  if (apply && !provider.publishable) {
    throw new Error('apply requires the http transport and LOCAL_MODEL_PUBLISHABLE=true');
  }
  const workerId = `localization-${hostname()}-${randomUUID()}`.slice(0, 160);
  const glossary = await readTranslationGlossary(path.resolve(
    optionValue(args, '--glossary', 'config/translation-glossary.json'),
  ));
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    if (!apply) {
      const previews = await previewTranslationWorker({
        client,
        provider,
        glossary,
        limit,
        targetLanguage,
      });
      console.log('Localization worker preview');
      console.log(`Provider: ${provider.id}`);
      console.log(`Transport: ${provider.transport}`);
      console.log(`Candidates: ${previews.length}`);
      console.log('Database writes: 0');
      for (const preview of previews) console.log(JSON.stringify(preview));
      return;
    }
    const result = await runTranslationWorker({ client, workerId, limit, glossary, provider });
    console.log('Localization worker');
    console.log(`Worker: ${workerId}`);
    console.log(`Provider: ${provider.id}`);
    console.log(`Transport: ${provider.transport}`);
    console.log(`Glossary version: ${glossary.glossary_version}`);
    console.log(`Recovered: ${result.recovered}`);
    console.log(`Claimed: ${result.claimed}`);
    console.log(`Completed: ${result.completed.length}`);
    console.log(`Failed: ${result.failed.length}`);
    for (const row of result.completed) console.log(JSON.stringify(row));
    for (const failure of result.failed) console.error(JSON.stringify(failure));
    if (result.failed.length) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
