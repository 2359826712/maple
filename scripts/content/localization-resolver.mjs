const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const comparableTokens = (text, pattern) => [...text.matchAll(pattern)].map((match) => match[0]).sort();

export async function readApprovedLocalizationMemory(client, { sourceLanguage, targetLanguage }) {
  return (await client.query(`
    select id, asset_id, source_text, localized_text, memory_type, provider, source_reference
    from public.localization_memory
    where source_language = $1
      and target_language = $2
      and review_status = 'approved'
    order by case memory_type
      when 'official' then 4
      when 'manual' then 3
      when 'glossary' then 2
      else 1
    end desc, length(source_text) desc, asset_id
  `, [sourceLanguage, targetLanguage])).rows;
}

function exactResolution(text, memory) {
  const match = memory.find((entry) => entry.source_text === text);
  if (!match) return null;
  return {
    text: match.localized_text,
    resolution_type: match.memory_type === 'glossary' ? 'glossary'
      : match.memory_type === 'machine' ? 'memory' : 'exact',
    references: [{
      memory_id: match.id || null,
      asset_id: match.asset_id,
      memory_type: match.memory_type,
      provider: match.provider,
    }],
  };
}

function glossaryResolution(text, memory) {
  const glossary = memory
    .filter((entry) => ['official', 'glossary'].includes(entry.memory_type))
    .sort((left, right) => right.source_text.length - left.source_text.length);
  let masked = text;
  let localized = text;
  const references = [];
  let sequence = 0;
  for (const entry of glossary) {
    const expression = new RegExp(escapeRegExp(entry.source_text), 'g');
    if (!expression.test(masked)) continue;
    expression.lastIndex = 0;
    const marker = `\uE000${sequence}\uE001`;
    sequence += 1;
    masked = masked.replace(expression, marker);
    localized = localized.replace(new RegExp(escapeRegExp(entry.source_text), 'g'), entry.localized_text);
    references.push({
      memory_id: entry.id || null,
      asset_id: entry.asset_id,
      memory_type: entry.memory_type,
      provider: entry.provider,
    });
  }
  if (!references.length) return null;
  const uncovered = masked.replace(/\uE000[0-9]+\uE001/g, '');
  if (/\p{L}/u.test(uncovered)) return null;
  return { text: localized, resolution_type: 'glossary', references };
}

function interpolate(template, values) {
  return template.replace(/\{\{([a-z][a-z0-9_]*)\}\}/gi, (_match, name) => values[name] ?? '');
}

function templateResolution({ text, sourceLanguage, targetLanguage, memory, assets }) {
  for (const template of assets.templates) {
    if (template.source_language !== sourceLanguage || template.target_language !== targetLanguage) continue;
    const match = new RegExp(template.source_pattern, 'u').exec(text);
    if (!match?.groups) continue;
    const values = {};
    const references = [{ template_id: template.id }];
    let unresolved = false;
    for (const [name, mode] of Object.entries(template.variables)) {
      const value = match.groups[name];
      if (typeof value !== 'string') {
        unresolved = true;
        break;
      }
      if (mode === 'preserve') {
        values[name] = value;
        continue;
      }
      const resolved = exactResolution(value, memory) || glossaryResolution(value, memory);
      if (!resolved) {
        unresolved = true;
        break;
      }
      values[name] = resolved.text;
      references.push(...resolved.references);
    }
    if (!unresolved) {
      return {
        text: interpolate(template.localized_template, values),
        resolution_type: 'template',
        references,
      };
    }
  }
  return null;
}

export function resolveLocalizedField({ text, sourceLanguage, targetLanguage, memory, assets }) {
  return exactResolution(text, memory)
    || glossaryResolution(text, memory)
    || templateResolution({ text, sourceLanguage, targetLanguage, memory, assets })
    || {
      text: null,
      resolution_type: 'unresolved',
      references: [],
      next: 'provider',
    };
}

function fieldQuality(source, localized, resolved) {
  if (!resolved) {
    return { numbers_match: false, urls_match: false, resolved: false, approved_assets: false };
  }
  const sourceNumbers = comparableTokens(source, /\d+(?:[.,]\d+)*/g);
  const localizedNumbers = comparableTokens(localized, /\d+(?:[.,]\d+)*/g);
  const sourceUrls = comparableTokens(source, /https?:\/\/[^\s)\]}]+/g);
  const localizedUrls = comparableTokens(localized, /https?:\/\/[^\s)\]}]+/g);
  return {
    numbers_match: JSON.stringify(sourceNumbers) === JSON.stringify(localizedNumbers),
    urls_match: JSON.stringify(sourceUrls) === JSON.stringify(localizedUrls),
    resolved: true,
    approved_assets: true,
  };
}

export function resolveLocalization({ content, memory, assets, policy }) {
  const localizedFields = {};
  const fieldMetadata = {};
  const fieldChecks = {};
  const types = new Set();
  for (const field of content.field_names) {
    const resolved = resolveLocalizedField({
      text: content[field],
      sourceLanguage: content.source_language,
      targetLanguage: content.target_language,
      memory,
      assets,
    });
    if (resolved.text !== null) localizedFields[field] = resolved.text;
    fieldMetadata[field] = {
      resolution_type: resolved.resolution_type,
      references: resolved.references,
      ...(resolved.next ? { next: resolved.next } : {}),
    };
    fieldChecks[field] = fieldQuality(content[field], resolved.text, resolved.text !== null);
    types.add(resolved.resolution_type);
  }
  const resolvedCount = Object.keys(localizedFields).length;
  const status = resolvedCount === content.field_names.length ? 'resolved'
    : resolvedCount > 0 ? 'partial' : 'unresolved';
  const resolutionType = types.size === 1 ? [...types][0] : 'mixed';
  const aggregateNames = ['numbers_match', 'urls_match', 'resolved', 'approved_assets'];
  const aggregate = Object.fromEntries(aggregateNames.map((name) => [
    name,
    Object.values(fieldChecks).every((checks) => checks[name]),
  ]));
  return {
    content_id: content.content_id,
    job_id: content.job_id,
    source_revision: content.source_revision,
    target_language: content.target_language,
    policy_version: policy.policy_version,
    asset_version: assets.asset_version,
    localized_fields: localizedFields,
    resolution_type: resolutionType,
    resolution_metadata: {
      resolution_order: policy.resolution_order,
      fields: fieldMetadata,
      provider_fallback_enabled: policy.provider_fallback.enabled,
    },
    quality_checks: { ...aggregate, fields: fieldChecks },
    status,
  };
}

export async function readLocalizationPilotSample(client, { limit, targetLanguage }) {
  const result = await client.query(`
    select job.id as job_id, job.content_id, job.field_names, job.source_revision,
           job.source_language, job.target_language, job.policy_version as job_policy_version,
           content.module, content.title, content.summary
    from public.translation_jobs as job
    join public.series_content as content on content.id = job.content_id
    join public.series_content_translations as translation
      on translation.content_id = job.content_id
     and translation.locale = job.target_language
    where job.status = 'completed'
      and job.target_language = $1
      and translation.source_revision = job.source_revision
      and translation.review_status = 'needs_review'
    order by job.created_at, job.content_id
    limit $2
  `, [targetLanguage, limit]);
  if (result.rowCount !== limit) {
    throw new Error(`localization pilot requires exactly ${limit} quality-gated rows; found ${result.rowCount}`);
  }
  return result.rows;
}

export async function storeLocalizationResolution(client, resolution) {
  await client.query(`
    insert into public.localization_resolutions (
      job_id, content_id, target_language, source_revision, policy_version,
      asset_version, localized_fields, resolution_type, resolution_metadata,
      quality_checks, status, review_status
    ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb, $10::jsonb, $11, 'unreviewed')
    on conflict (job_id, source_revision, policy_version, asset_version)
    do update set
      localized_fields = excluded.localized_fields,
      resolution_type = excluded.resolution_type,
      resolution_metadata = excluded.resolution_metadata,
      quality_checks = excluded.quality_checks,
      status = excluded.status,
      review_status = 'unreviewed',
      reviewer_notes = null,
      reviewed_at = null,
      updated_at = now()
  `, [
    resolution.job_id,
    resolution.content_id,
    resolution.target_language,
    resolution.source_revision,
    resolution.policy_version,
    resolution.asset_version,
    JSON.stringify(resolution.localized_fields),
    resolution.resolution_type,
    JSON.stringify(resolution.resolution_metadata),
    JSON.stringify(resolution.quality_checks),
    resolution.status,
  ]);
  await client.query(`
    update public.translation_jobs
    set resolution_type = $2,
        resolution_metadata = $3::jsonb,
        updated_at = now()
    where id = $1
  `, [resolution.job_id, resolution.resolution_type, JSON.stringify({
    policy_version: resolution.policy_version,
    asset_version: resolution.asset_version,
    status: resolution.status,
  })]);
}
