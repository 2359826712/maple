import process from 'node:process';
import { Pool } from 'pg';
import { createJiti } from 'jiti';
import { buildUiTranslationManifest, interpolationVariables } from './content/ui-translation-manifest.mjs';
import { createLocalModelProvider } from './content/local-model-provider.mjs';
import { invokeLocalizationProvider } from './content/localization-provider.mjs';
import { readTranslationGlossary } from './content/translation-quality.mjs';

const promptVersion = 'native-ui-v1';
const allowedLocales = new Set(['zh', 'zh-Hant', 'ja', 'ko']);

function optionValue(args, name, fallback) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function positiveInteger(value, name) {
  const number = Number.parseInt(value, 10);
  if (!Number.isInteger(number) || number < 1) throw new Error(`${name} must be a positive integer`);
  return number;
}

function qualityChecks(sourceText, localizedText) {
  const sourceVariables = interpolationVariables(sourceText);
  const localizedVariables = interpolationVariables(localizedText);
  const sourceLength = sourceText.replace(/\s/g, '').length;
  const localizedLength = localizedText.replace(/\s/g, '').length;
  const ratio = sourceLength ? localizedLength / sourceLength : 1;
  const checks = {
    placeholders_match: JSON.stringify(sourceVariables) === JSON.stringify(localizedVariables),
    length_ratio_ok: ratio >= 0.1 && ratio <= 5,
  };
  return {
    ...checks,
    status: Object.values(checks).every(Boolean) ? 'passed' : 'failed',
    pipeline_version: promptVersion,
  };
}

async function loadManifest() {
  const jiti = createJiti(import.meta.url);
  const messages = await jiti.import('../src/i18n/local/en/common.ts', { default: true });
  return buildUiTranslationManifest(messages);
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const locale = optionValue(args, '--locale', 'zh');
  const limit = positiveInteger(optionValue(args, '--limit', '100'), '--limit');
  if (!allowedLocales.has(locale)) throw new Error(`unsupported locale ${JSON.stringify(locale)}`);
  if (apply && optionValue(args, '--confirm', '') !== 'ui-localization') {
    throw new Error('--apply requires --confirm=ui-localization');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const manifest = await loadManifest();
    const existing = await pool.query(
      `
        select translation_key, source_hash, review_status
        from public.ui_translations
        where namespace = 'common' and locale = $1
      `,
      [locale],
    );
    const current = new Map(existing.rows.map((row) => [row.translation_key, row]));
    const candidates = manifest.entries
      .filter((entry) => current.get(entry.key)?.source_hash !== entry.source_hash)
      .slice(0, limit);

    const summary = {
      mode: apply ? 'apply' : 'dry-run',
      locale,
      prompt_version: promptVersion,
      source_entries: manifest.entries.length,
      existing_rows: existing.rowCount,
      candidates: candidates.length,
      remaining_after_limit: Math.max(
        0,
        manifest.entries.filter((entry) => current.get(entry.key)?.source_hash !== entry.source_hash).length
          - candidates.length,
      ),
      sample: candidates.slice(0, 10).map((entry) => ({
        key: entry.key,
        source_text: entry.source_text,
        action: current.has(entry.key) ? 'replace-stale' : 'insert',
      })),
    };
    if (!apply) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    const provider = createLocalModelProvider();
    if (provider.transport !== 'openai') {
      throw new Error('--apply requires LOCAL_MODEL_TRANSPORT=openai');
    }
    const glossary = await readTranslationGlossary(
      optionValue(args, '--glossary', 'config/translation-glossary.json'),
    );
    let completed = 0;
    for (const entry of candidates) {
      const localized = await invokeLocalizationProvider({
        provider,
        request: {
          fieldNames: ['translated_text'],
          source: { translated_text: entry.source_text },
          sourceLanguage: 'en',
          targetLanguage: locale,
          glossary: glossary.locales[locale] || [],
          mode: 'native',
          domain: 'ui',
          policyVersion: promptVersion,
        },
      });
      const translatedText = localized.fields.translated_text.trim();
      const checks = qualityChecks(entry.source_text, translatedText);
      if (checks.status !== 'passed') {
        throw new Error(`quality gate failed for UI key ${entry.key}`);
      }

      await pool.query(
        `
          insert into public.ui_translations (
            translation_key, locale, namespace, source_language, source_text,
            source_hash, translated_text, provider, model, glossary_version,
            quality_checks, review_status, context, prompt_version
          ) values (
            $1, $2, 'common', 'en', $3, $4, $5, $6, $7, $8,
            $9::jsonb, 'automatic', $10::jsonb, $11
          )
          on conflict (translation_key, locale) do update set
            source_text = excluded.source_text,
            source_hash = excluded.source_hash,
            translated_text = excluded.translated_text,
            provider = excluded.provider,
            model = excluded.model,
            glossary_version = excluded.glossary_version,
            quality_checks = excluded.quality_checks,
            review_status = excluded.review_status,
            context = excluded.context,
            prompt_version = excluded.prompt_version,
            updated_at = now()
        `,
        [
          entry.key,
          locale,
          entry.source_text,
          entry.source_hash,
          translatedText,
          localized.provider,
          localized.model,
          glossary.glossary_version,
          JSON.stringify({
            ...checks,
            model_version: localized.model_version,
            latency_ms: localized.latency_ms,
            usage: localized.usage,
          }),
          JSON.stringify(entry.context),
          promptVersion,
        ],
      );
      completed += 1;
    }

    console.log(JSON.stringify({ ...summary, completed }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
