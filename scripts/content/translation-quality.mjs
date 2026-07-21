import { readFile } from 'node:fs/promises';

const versionPattern = /^[1-9][0-9]*$/;
const placeholderPattern = /__MPG_[0-9]{4}__/g;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const occurrences = (text, value) => text.split(value).length - 1;
const tokens = (text, pattern) => [...text.matchAll(pattern)].map((match) => match[0]).sort();

export function validateTranslationGlossary(glossary) {
  const errors = [];
  if (!glossary || typeof glossary !== 'object' || Array.isArray(glossary)) return ['glossary must be an object'];
  if (glossary.schema_version !== 1) errors.push('unsupported glossary schema version');
  if (typeof glossary.glossary_version !== 'string' || !versionPattern.test(glossary.glossary_version)) {
    errors.push('glossary_version must be a positive integer string');
  }
  if (!glossary.locales || typeof glossary.locales !== 'object' || Array.isArray(glossary.locales)) {
    errors.push('locales must be an object');
  } else {
    for (const [locale, entries] of Object.entries(glossary.locales)) {
      if (!Array.isArray(entries)) {
        errors.push(`glossary locale ${locale} must be an array`);
        continue;
      }
      const sources = new Set();
      for (const entry of entries) {
        if (!entry?.source?.trim() || !entry?.target?.trim()) errors.push(`glossary locale ${locale} has an empty term`);
        if (sources.has(entry?.source)) errors.push(`glossary locale ${locale} repeats ${JSON.stringify(entry.source)}`);
        sources.add(entry?.source);
      }
    }
  }
  if (!glossary.locale_strategies || typeof glossary.locale_strategies !== 'object'
      || Array.isArray(glossary.locale_strategies)) {
    errors.push('locale_strategies must be an object');
  } else {
    for (const [locale, strategy] of Object.entries(glossary.locale_strategies)) {
      if (!['enabled', 'blocked'].includes(strategy?.status)) {
        errors.push(`locale strategy ${locale} must be enabled or blocked`);
      }
      if (strategy?.status === 'enabled' && !Array.isArray(strategy.pipeline)) {
        errors.push(`enabled locale strategy ${locale} must define a pipeline`);
      }
      if (strategy?.status === 'blocked' && !strategy.reason?.trim()) {
        errors.push(`blocked locale strategy ${locale} must explain why`);
      }
    }
  }
  return errors;
}

export async function readTranslationGlossary(path) {
  const glossary = JSON.parse(await readFile(path, 'utf8'));
  const errors = validateTranslationGlossary(glossary);
  if (errors.length) throw new Error(`invalid translation glossary: ${errors.join('; ')}`);
  return glossary;
}

export function protectGlossaryFields({ fieldNames, source, targetLanguage, glossary }) {
  const strategy = glossary.locale_strategies[targetLanguage];
  if (!strategy || strategy.status !== 'enabled') {
    const reason = strategy?.reason || 'no translation pipeline is configured';
    throw new Error(`target language ${targetLanguage} is blocked: ${reason}`);
  }
  const entries = [...(glossary.locales[targetLanguage] || [])]
    .sort((left, right) => right.source.length - left.source.length);
  const replacements = [];
  const fields = {};
  let sequence = 0;
  for (const field of fieldNames) {
    let value = source[field];
    for (const entry of entries) {
      const expression = new RegExp(escapeRegExp(entry.source), 'g');
      value = value.replace(expression, () => {
        const token = `__MPG_${String(sequence).padStart(4, '0')}__`;
        sequence += 1;
        replacements.push({ field, token, source: entry.source, target: entry.target });
        return token;
      });
    }
    fields[field] = value;
  }
  return { fields, replacements };
}

function fieldQuality(source, translated, replacements) {
  const expectedPlaceholders = replacements.map((entry) => entry.token).sort();
  const actualPlaceholders = tokens(translated, placeholderPattern);
  const placeholdersMatch = JSON.stringify(expectedPlaceholders) === JSON.stringify(actualPlaceholders);
  let restored = translated;
  for (const replacement of replacements) restored = restored.replaceAll(replacement.token, replacement.target);
  const glossaryMatch = placeholdersMatch && replacements.every((entry) => (
    occurrences(restored, entry.target) >= occurrences(source, entry.source)
  ));
  const sourceNumbers = tokens(source, /\d+(?:[.,]\d+)*/g);
  const translatedNumbers = tokens(restored, /\d+(?:[.,]\d+)*/g);
  const sourceUrls = tokens(source, /https?:\/\/[^\s)\]}]+/g);
  const translatedUrls = tokens(restored, /https?:\/\/[^\s)\]}]+/g);
  const sourceLength = source.replace(/\s/g, '').length;
  const translatedLength = restored.replace(/\s/g, '').length;
  const ratio = sourceLength ? translatedLength / sourceLength : 1;
  return {
    text: restored,
    checks: {
      numbers_match: JSON.stringify(sourceNumbers) === JSON.stringify(translatedNumbers),
      urls_match: JSON.stringify(sourceUrls) === JSON.stringify(translatedUrls),
      glossary_match: glossaryMatch,
      placeholders_match: placeholdersMatch,
      length_ratio_ok: ratio >= 0.15 && ratio <= 4,
    },
  };
}

export function restoreAndCheckTranslation({ fieldNames, source, translated, protectedFields, glossary }) {
  const fields = {};
  const fieldChecks = {};
  for (const field of fieldNames) {
    const quality = fieldQuality(
      source[field],
      translated[field],
      protectedFields.replacements.filter((entry) => entry.field === field),
    );
    fields[field] = quality.text;
    fieldChecks[field] = quality.checks;
  }
  const aggregate = Object.fromEntries([
    'numbers_match',
    'urls_match',
    'glossary_match',
    'placeholders_match',
    'length_ratio_ok',
  ].map((name) => [name, Object.values(fieldChecks).every((checks) => checks[name])]));
  return {
    fields,
    glossary_version: glossary.glossary_version,
    quality_checks: { ...aggregate, fields: fieldChecks },
    review_status: Object.values(aggregate).every(Boolean) ? 'automatic' : 'needs_review',
  };
}
