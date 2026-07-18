import { createHash } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';
import { translateTextsWithGoogle } from './googleTranslation';
import type {
  StaticContentLanguage,
  StaticTranslationFormat,
} from './staticTranslation';

type LocalizationPoolGlobal = typeof globalThis & {
  __mapleLocalizationPool?: Pool;
  __mapleLocalizationSchema?: Promise<void>;
};

type StoredTranslation = {
  source_hash: string;
  translated_text: string;
};

const globalState = globalThis as LocalizationPoolGlobal;

const sourceHash = (text: string) => createHash('sha256').update(text).digest('hex');

const getPool = () => {
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) return undefined;
  if (!globalState.__mapleLocalizationPool) {
    globalState.__mapleLocalizationPool = new Pool({
      connectionString,
      max: 4,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      allowExitOnIdle: true,
    });
  }
  return globalState.__mapleLocalizationPool;
};

const ensureSchema = async (pool: Pool) => {
  if (!globalState.__mapleLocalizationSchema) {
    globalState.__mapleLocalizationSchema = pool.query(`
      CREATE TABLE IF NOT EXISTS localization_translations (
        source_hash varchar(64) NOT NULL,
        source_language varchar(16) NOT NULL,
        target_language varchar(16) NOT NULL,
        content_format varchar(8) NOT NULL,
        source_text text NOT NULL,
        translated_text text NOT NULL,
        provider varchar(64) NOT NULL DEFAULT 'automatic',
        review_status varchar(16) NOT NULL DEFAULT 'automatic',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        last_used_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (source_hash, source_language, target_language, content_format),
        CHECK (source_language IN ('auto', 'en', 'zh', 'zh-Hant', 'ja', 'ko')),
        CHECK (target_language IN ('en', 'zh', 'zh-Hant', 'ja', 'ko')),
        CHECK (content_format IN ('text', 'html')),
        CHECK (review_status IN ('automatic', 'reviewed', 'rejected'))
      );
      ALTER TABLE localization_translations
        ADD COLUMN IF NOT EXISTS review_status varchar(16) NOT NULL DEFAULT 'automatic';
      ALTER TABLE localization_translations
        ALTER COLUMN source_hash TYPE varchar(64);
      CREATE INDEX IF NOT EXISTS localization_translations_last_used_idx
        ON localization_translations (last_used_at);
      CREATE INDEX IF NOT EXISTS localization_translations_locale_idx
        ON localization_translations (target_language, source_language);
    `).then(() => undefined).catch((error) => {
      globalState.__mapleLocalizationSchema = undefined;
      throw error;
    });
  }
  await globalState.__mapleLocalizationSchema;
};

const readStoredTranslations = async (
  client: PoolClient,
  hashes: string[],
  sourceLanguage: StaticContentLanguage | undefined,
  targetLanguage: StaticContentLanguage,
  format: StaticTranslationFormat,
) => {
  const source = sourceLanguage || 'auto';
  const result = await client.query<StoredTranslation>(`
    UPDATE localization_translations
    SET last_used_at = now()
    WHERE source_hash = ANY($1::varchar[])
      AND localization_translations.source_language = $2
      AND localization_translations.target_language = $3
      AND localization_translations.content_format = $4
    RETURNING localization_translations.source_hash, localization_translations.translated_text
  `, [hashes, source, targetLanguage, format]);
  return new Map(result.rows.map((row) => [row.source_hash, row.translated_text]));
};

const upsertTranslations = async (
  client: PoolClient,
  texts: string[],
  translations: string[],
  sourceLanguage: StaticContentLanguage | undefined,
  targetLanguage: StaticContentLanguage,
  format: StaticTranslationFormat,
) => {
  if (texts.length === 0) return;
  const source = sourceLanguage || 'auto';
  const values: unknown[] = [];
  const rows = texts.map((text, index) => {
    const offset = index * 7;
    values.push(sourceHash(text), source, targetLanguage, format, text, translations[index] || text, 'automatic');
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`;
  });
  await client.query(`
    INSERT INTO localization_translations (
      source_hash, source_language, target_language, content_format,
      source_text, translated_text, provider
    ) VALUES ${rows.join(', ')}
    ON CONFLICT (source_hash, source_language, target_language, content_format)
    DO UPDATE SET
      source_text = EXCLUDED.source_text,
      translated_text = CASE
        WHEN localization_translations.review_status = 'reviewed'
          THEN localization_translations.translated_text
        ELSE EXCLUDED.translated_text
      END,
      provider = CASE
        WHEN localization_translations.review_status = 'reviewed'
          THEN localization_translations.provider
        ELSE EXCLUDED.provider
      END,
      updated_at = now(),
      last_used_at = now()
  `, values);
};

export async function translatePersistedTexts(
  texts: string[],
  targetLanguage: StaticContentLanguage,
  sourceLanguage?: StaticContentLanguage,
  format: StaticTranslationFormat = 'text',
) {
  const pool = getPool();
  if (!pool) return translateTextsWithGoogle(texts, targetLanguage, sourceLanguage);

  const hashes = texts.map(sourceHash);
  let stored = new Map<string, string>();
  try {
    await ensureSchema(pool);
    const client = await pool.connect();
    try {
      stored = await readStoredTranslations(client, hashes, sourceLanguage, targetLanguage, format);
    } finally {
      client.release();
    }
  } catch {
    return translateTextsWithGoogle(texts, targetLanguage, sourceLanguage);
  }

  const missingTexts: string[] = [];
  const missingHashes: string[] = [];
  hashes.forEach((hash, index) => {
    if (!stored.has(hash) && !missingHashes.includes(hash)) {
      missingHashes.push(hash);
      missingTexts.push(texts[index]);
    }
  });

  if (missingTexts.length > 0) {
    const translated = await translateTextsWithGoogle(missingTexts, targetLanguage, sourceLanguage);
    translated.forEach((value, index) => stored.set(missingHashes[index], value || missingTexts[index]));
    try {
      const client = await pool.connect();
      try {
        await upsertTranslations(client, missingTexts, translated, sourceLanguage, targetLanguage, format);
      } finally {
        client.release();
      }
    } catch {
      // A database write failure must not make localized pages unavailable.
    }
  }

  return hashes.map((hash, index) => stored.get(hash) || texts[index]);
}
