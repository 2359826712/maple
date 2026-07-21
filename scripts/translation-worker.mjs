import { hostname } from 'node:os';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { runTranslationWorker } from './content/translation-worker.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  if (optionValue(args, '--confirm') !== 'translation-worker-pilot') {
    throw new Error('worker requires --confirm=translation-worker-pilot');
  }
  const limit = Number.parseInt(optionValue(args, '--limit', '5'), 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    throw new Error('--limit must be between 1 and 10');
  }
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  const endpoint = process.env.LIBRETRANSLATE_API_URL?.trim();
  if (!connectionString) throw new Error('LOCALIZATION_DATABASE_URL is required');
  if (!endpoint) throw new Error('LIBRETRANSLATE_API_URL is required');
  const workerId = `pilot-${hostname()}-${randomUUID()}`.slice(0, 160);
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await runTranslationWorker({ client, workerId, limit, endpoint });
    console.log('Translation worker pilot');
    console.log(`Worker: ${workerId}`);
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
