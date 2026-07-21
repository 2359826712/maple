import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import pg from 'pg'

const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim()
if (!connectionString) {
  console.log('Supabase migrations skipped: LOCALIZATION_DATABASE_URL is not configured.')
  process.exit(0)
}

const migrationsDirectory = resolve('supabase/migrations')
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_[a-z0-9_]+\.sql$/i.test(file))
  .sort()

const pool = new pg.Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 5_000,
  allowExitOnIdle: true,
})

const client = await pool.connect()
const applied = []

try {
  await client.query('begin')
  await client.query('create schema if not exists supabase_migrations')
  await client.query(`
    create table if not exists supabase_migrations.schema_migrations (
      version text not null primary key
    )
  `)
  await client.query(`
    alter table supabase_migrations.schema_migrations
      add column if not exists statements text[],
      add column if not exists name text
  `)

  const history = await client.query(
    'select version from supabase_migrations.schema_migrations',
  )
  const appliedVersions = new Set(history.rows.map((row) => row.version))

  for (const file of migrationFiles) {
    const [version, ...nameParts] = basename(file, '.sql').split('_')
    if (appliedVersions.has(version)) continue

    const sql = await readFile(resolve(migrationsDirectory, file), 'utf8')
    await client.query(sql)
    await client.query(
      `
        insert into supabase_migrations.schema_migrations
          (version, statements, name)
        values ($1, $2, $3)
      `,
      [version, [sql], nameParts.join('_')],
    )
    applied.push(file)
  }

  await client.query('commit')
  console.log(
    applied.length > 0
      ? `Applied Supabase migrations: ${applied.join(', ')}`
      : 'Supabase migrations are up to date.',
  )

  const verification = await client.query(`
    select
      to_regclass('public.content_series') is not null as content_series,
      to_regclass('public.series_editions') is not null as series_editions,
      to_regclass('public.series_content') is not null as series_content,
      to_regclass('public.series_content_translations') is not null as content_translations,
      to_regclass('public.series_wiki_pages') is not null as wiki_pages,
      to_regclass('public.series_wiki_translations') is not null as wiki_translations,
      to_regclass('public.series_tools') is not null as series_tools,
      to_regclass('public.content_releases') is not null as content_releases,
      to_regclass('public.translation_jobs') is not null as translation_jobs,
      to_regclass('public.translation_provider_evaluations') is not null as provider_evaluations,
      (select count(*)::int from public.content_series) as series_count,
      (select count(*)::int from public.series_editions) as edition_count
  `)
  const schema = verification.rows[0]
  const requiredTables = [
    'content_series',
    'series_editions',
    'series_content',
    'content_translations',
    'wiki_pages',
    'wiki_translations',
    'series_tools',
    'content_releases',
    'translation_jobs',
    'provider_evaluations',
  ]
  if (requiredTables.some((table) => !schema[table])) {
    throw new Error('Supabase series schema verification failed')
  }
  console.log(
    `Verified Supabase series schema: ${schema.series_count} series, ${schema.edition_count} editions.`,
  )
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  client.release()
  await pool.end()
}
