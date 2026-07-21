import path from 'node:path';
import process from 'node:process';
import { localizationMemoryRows, readLocalizationAssets, syncLocalizationMemory } from './content/localization-assets.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  if (apply && optionValue(args, '--confirm') !== 'localization-memory-v1') {
    throw new Error('apply requires --confirm=localization-memory-v1');
  }
  const assets = await readLocalizationAssets(path.resolve(
    optionValue(args, '--assets', 'config/localization-assets.json'),
  ));
  const rows = localizationMemoryRows(assets);
  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    asset_version: assets.asset_version,
    memory_rows: rows.length,
    by_type: Object.fromEntries([...new Set(rows.map((row) => row.memory_type))].sort().map((type) => [
      type,
      rows.filter((row) => row.memory_type === type).length,
    ])),
  }, null, 2));
  if (!apply) return;
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('LOCALIZATION_DATABASE_URL is required');
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('begin');
    const synced = await syncLocalizationMemory(client, assets);
    await client.query('commit');
    console.log(`Synced localization memory rows: ${synced}`);
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
