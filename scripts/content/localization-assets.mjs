import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const languages = new Set(['en', 'zh', 'zh-Hant', 'ja', 'ko']);
const memoryTypes = new Set(['official', 'manual', 'glossary', 'machine']);
const reviewStatuses = new Set(['pending', 'approved', 'rejected']);

export const localizationSourceHash = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

export function validateLocalizationAssets(assets) {
  const errors = [];
  if (!assets || typeof assets !== 'object' || Array.isArray(assets)) return ['assets must be an object'];
  if (assets.schema_version !== 1) errors.push('unsupported localization assets schema version');
  if (typeof assets.asset_version !== 'string' || !/^[1-9][0-9]*$/.test(assets.asset_version)) {
    errors.push('asset_version must be a positive integer string');
  }
  const ids = new Set();
  for (const entry of assets.glossary || []) {
    if (!entry?.id || ids.has(entry.id)) errors.push(`invalid or repeated asset id ${JSON.stringify(entry?.id)}`);
    ids.add(entry?.id);
    if (!entry?.source?.trim()) errors.push(`glossary ${entry?.id} requires source`);
    if (!languages.has(entry?.source_language)) errors.push(`glossary ${entry?.id} has invalid source language`);
    if (!memoryTypes.has(entry?.memory_type)) errors.push(`glossary ${entry?.id} has invalid memory type`);
    if (!entry?.localizations || typeof entry.localizations !== 'object' || Array.isArray(entry.localizations)) {
      errors.push(`glossary ${entry?.id} requires localizations`);
    } else {
      for (const [language, localized] of Object.entries(entry.localizations)) {
        if (!languages.has(language) || language === entry.source_language || !localized?.trim()) {
          errors.push(`glossary ${entry?.id} has invalid localization ${language}`);
        }
      }
    }
  }
  for (const entry of assets.exact || []) {
    if (!entry?.id || ids.has(entry.id)) errors.push(`invalid or repeated asset id ${JSON.stringify(entry?.id)}`);
    ids.add(entry?.id);
    if (!entry?.source?.trim() || !entry?.localized?.trim()) errors.push(`exact ${entry?.id} requires text`);
    if (!languages.has(entry?.source_language) || !languages.has(entry?.target_language)
        || entry.source_language === entry.target_language) errors.push(`exact ${entry?.id} has invalid languages`);
    if (!memoryTypes.has(entry?.memory_type)) errors.push(`exact ${entry?.id} has invalid memory type`);
    if (!reviewStatuses.has(entry?.review_status)) errors.push(`exact ${entry?.id} has invalid review status`);
  }
  for (const template of assets.templates || []) {
    if (!template?.id || ids.has(template.id)) errors.push(`invalid or repeated asset id ${JSON.stringify(template?.id)}`);
    ids.add(template?.id);
    if (!languages.has(template?.source_language) || !languages.has(template?.target_language)
        || template.source_language === template.target_language) errors.push(`template ${template?.id} has invalid languages`);
    if (!template?.localized_template?.trim()) errors.push(`template ${template?.id} requires localized_template`);
    if (template?.review_status !== 'approved') errors.push(`template ${template?.id} must be approved before use`);
    try {
      new RegExp(template?.source_pattern, 'u');
    } catch {
      errors.push(`template ${template?.id} has invalid source_pattern`);
    }
  }
  return errors;
}

export async function readLocalizationAssets(assetPath) {
  const assets = JSON.parse(await readFile(assetPath, 'utf8'));
  const errors = validateLocalizationAssets(assets);
  if (errors.length) throw new Error(`invalid localization assets: ${errors.join('; ')}`);
  return assets;
}

export function localizationMemoryRows(assets) {
  const rows = [];
  for (const entry of assets.glossary) {
    for (const [targetLanguage, localizedText] of Object.entries(entry.localizations)) {
      rows.push({
        asset_id: entry.id,
        source_hash: localizationSourceHash(entry.source),
        source_text: entry.source,
        source_language: entry.source_language,
        target_language: targetLanguage,
        localized_text: localizedText,
        memory_type: entry.memory_type,
        provider: 'localization-assets',
        review_status: 'approved',
      });
    }
  }
  for (const entry of assets.exact) {
    rows.push({
      asset_id: entry.id,
      source_hash: localizationSourceHash(entry.source),
      source_text: entry.source,
      source_language: entry.source_language,
      target_language: entry.target_language,
      localized_text: entry.localized,
      memory_type: entry.memory_type,
      provider: 'localization-assets',
      review_status: entry.review_status,
    });
  }
  return rows;
}

export async function syncLocalizationMemory(client, assets) {
  const rows = localizationMemoryRows(assets);
  for (const row of rows) {
    await client.query(`
      insert into public.localization_memory (
        asset_id, source_hash, source_text, source_language, target_language,
        localized_text, memory_type, provider, source_reference, review_status
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (source_hash, source_language, target_language, memory_type)
      do update set
        asset_id = excluded.asset_id,
        source_text = excluded.source_text,
        localized_text = excluded.localized_text,
        provider = excluded.provider,
        source_reference = excluded.source_reference,
        review_status = excluded.review_status,
        updated_at = now()
    `, [
      row.asset_id,
      row.source_hash,
      row.source_text,
      row.source_language,
      row.target_language,
      row.localized_text,
      row.memory_type,
      row.provider,
      `config:localization-assets:${assets.asset_version}`,
      row.review_status,
    ]);
  }
  return rows.length;
}
