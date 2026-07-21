import { readFile } from 'node:fs/promises';
import { publisherLocales } from './publisher.mjs';

export const translatableFields = ['title', 'summary'];

const canonicalLocales = new Set(publisherLocales);

export function validateTranslationPolicy(policy) {
  const errors = [];
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return ['policy must be an object'];
  if (policy.schema_version !== 1) errors.push('unsupported policy schema version');
  if (typeof policy.policy_version !== 'string' || !/^[1-9][0-9]*$/.test(policy.policy_version)) {
    errors.push('policy_version must be a positive integer string');
  }
  if (!Array.isArray(policy.targets) || policy.targets.length === 0) {
    errors.push('targets must be a non-empty array');
  } else {
    if (new Set(policy.targets).size !== policy.targets.length) errors.push('targets must be unique');
    for (const locale of policy.targets) {
      if (!canonicalLocales.has(locale)) errors.push(`unsupported target locale ${JSON.stringify(locale)}`);
    }
  }
  if (!policy.locale_aliases || typeof policy.locale_aliases !== 'object' || Array.isArray(policy.locale_aliases)) {
    errors.push('locale_aliases must be an object');
  } else {
    for (const [alias, locale] of Object.entries(policy.locale_aliases)) {
      if (!alias || !canonicalLocales.has(locale)) errors.push(`invalid locale alias ${JSON.stringify(alias)}`);
    }
  }
  if (!policy.modules || typeof policy.modules !== 'object' || Array.isArray(policy.modules)) {
    errors.push('modules must be an object');
  } else {
    for (const [module, rule] of Object.entries(policy.modules)) {
      const fields = rule?.fields;
      if (!module || !Array.isArray(fields) || fields.length === 0) {
        errors.push(`module ${JSON.stringify(module)} must declare fields`);
        continue;
      }
      if (new Set(fields).size !== fields.length) errors.push(`module ${module} fields must be unique`);
      for (const field of fields) {
        if (!translatableFields.includes(field)) errors.push(`module ${module} cannot translate field ${JSON.stringify(field)}`);
      }
    }
  }
  return errors;
}

export function assertTranslationPolicy(policy) {
  const errors = validateTranslationPolicy(policy);
  if (errors.length) throw new Error(`invalid translation policy: ${errors.join('; ')}`);
  return policy;
}

export async function readTranslationPolicy(policyPath) {
  return assertTranslationPolicy(JSON.parse(await readFile(policyPath, 'utf8')));
}

export function canonicalTranslationLocale(value, policy) {
  const canonical = policy.locale_aliases[value] || value;
  if (!canonicalLocales.has(canonical)) throw new Error(`unsupported locale ${JSON.stringify(value)}`);
  return canonical;
}

export function buildTranslationPlan({ projections, policy, targetLocales, module = null, offset = 0, limit = null }) {
  assertTranslationPolicy(policy);
  if (!Number.isInteger(offset) || offset < 0) throw new Error('offset must be a non-negative integer');
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) throw new Error('limit must be a positive integer');

  const requestedTargets = targetLocales?.length ? targetLocales : policy.targets;
  const targets = [...new Set(requestedTargets.map((locale) => canonicalTranslationLocale(locale, policy)))];
  const available = module ? projections.filter((projection) => projection.module === module) : projections;
  if (module && !policy.modules[module]) throw new Error(`no translation policy for module ${JSON.stringify(module)}`);
  const selected = [...available]
    .sort((left, right) => left.source_file.localeCompare(right.source_file))
    .slice(offset, limit === null ? undefined : offset + limit);
  const jobs = [];

  for (const projection of selected) {
    if (!/^sha256:[a-f0-9]{64}$/.test(projection.source_revision || '')) {
      throw new Error(`source_revision is required for ${projection.slug}`);
    }
    const modulePolicy = policy.modules[projection.module];
    if (!modulePolicy) throw new Error(`no translation policy for module ${JSON.stringify(projection.module)}`);
    const fields = modulePolicy.fields.filter((field) => (
      typeof projection[field] === 'string' && projection[field].trim().length > 0
    ));
    if (!fields.length) throw new Error(`no translatable source fields for ${projection.slug}`);
    if (fields.includes('body_html')) throw new Error('body_html translation is disabled');

    for (const targetLanguage of targets) {
      if (targetLanguage === projection.source_language) continue;
      jobs.push({
        policy_version: policy.policy_version,
        entity_type: 'series_content',
        series_id: projection.series_id,
        module: projection.module,
        slug: projection.slug,
        source_revision: projection.source_revision,
        source_language: projection.source_language,
        target_language: targetLanguage,
        fields,
      });
    }
  }

  const tally = (values) => Object.fromEntries([...values.entries()].sort(([a], [b]) => a.localeCompare(b)));
  const byLocale = new Map();
  const byModule = new Map();
  const byField = new Map();
  for (const job of jobs) {
    byLocale.set(job.target_language, (byLocale.get(job.target_language) || 0) + 1);
    byModule.set(job.module, (byModule.get(job.module) || 0) + 1);
    for (const field of job.fields) byField.set(field, (byField.get(field) || 0) + 1);
  }

  return {
    policy_version: policy.policy_version,
    summary: {
      content_available: available.length,
      content_selected: selected.length,
      jobs: jobs.length,
    },
    mappings: {
      locales: tally(byLocale),
      modules: tally(byModule),
      fields: tally(byField),
    },
    jobs,
  };
}
