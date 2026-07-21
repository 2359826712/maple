import path from 'node:path';
import process from 'node:process';
import { readLocalizationAssets } from './content/localization-assets.mjs';
import {
  readApprovedLocalizationMemory,
  readLocalizationPilotSample,
  resolveLocalization,
  storeLocalizationResolution,
} from './content/localization-resolver.mjs';
import { readTranslationPolicy } from './content/translation-policy.mjs';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  if (apply && optionValue(args, '--confirm') !== 'localization-pilot-five-only') {
    throw new Error('apply requires --confirm=localization-pilot-five-only');
  }
  const limit = Number.parseInt(optionValue(args, '--limit', '5'), 10);
  const targetLanguage = optionValue(args, '--target', 'zh');
  if (limit !== 5) throw new Error('localization pilot must remain exactly 5 rows');
  if (targetLanguage !== 'zh') throw new Error('phase 2D localization pilot target must remain zh');
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('LOCALIZATION_DATABASE_URL is required');
  const assets = await readLocalizationAssets(path.resolve(
    optionValue(args, '--assets', 'config/localization-assets.json'),
  ));
  const policy = await readTranslationPolicy(path.resolve(
    optionValue(args, '--policy', 'config/translation-policy.json'),
  ));
  if (policy.policy_version !== '2' || !Array.isArray(policy.resolution_order)) {
    throw new Error('localization resolver requires translation policy v2');
  }
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const sample = await readLocalizationPilotSample(client, { limit, targetLanguage });
    const memory = await readApprovedLocalizationMemory(client, {
      sourceLanguage: sample[0].source_language,
      targetLanguage,
    });
    const resolutions = sample.map((content) => resolveLocalization({ content, memory, assets, policy }));
    console.log(JSON.stringify({
      mode: apply ? 'apply' : 'dry-run',
      policy_version: policy.policy_version,
      asset_version: assets.asset_version,
      sample_size: sample.length,
      resolved: resolutions.filter((entry) => entry.status === 'resolved').length,
      partial: resolutions.filter((entry) => entry.status === 'partial').length,
      unresolved: resolutions.filter((entry) => entry.status === 'unresolved').length,
      resolutions,
    }, null, 2));
    if (!apply) return;
    await client.query('begin');
    try {
      for (const resolution of resolutions) await storeLocalizationResolution(client, resolution);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback').catch(() => {});
      throw error;
    }
    console.log(`Stored localization candidates: ${resolutions.length}`);
    console.log('Display translations changed: 0');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
