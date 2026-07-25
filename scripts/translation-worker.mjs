import process from 'node:process';
import path from 'node:path';
import { createLocalModelProvider } from './content/local-model-provider.mjs';
import { previewTranslationWorker } from './content/translation-worker.mjs';
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
  if (apply) {
    throw new Error(
      'Node Worker apply is disabled while LocalizationWorker-repair.exe owns translation_jobs',
    );
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
  const glossary = await readTranslationGlossary(path.resolve(
    optionValue(args, '--glossary', 'config/translation-glossary.json'),
  ));
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
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
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
