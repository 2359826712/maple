import process from 'node:process';

function optionValue(args, name, fallback = null) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  if (optionValue(args, '--confirm') !== 'quality-pilot-five-only') {
    throw new Error('requeue requires --confirm=quality-pilot-five-only');
  }
  const limit = Number.parseInt(optionValue(args, '--limit', '5'), 10);
  if (limit !== 5) throw new Error('quality pilot must requeue exactly 5 jobs');
  const connectionString = process.env.LOCALIZATION_DATABASE_URL?.trim();
  if (!connectionString) throw new Error('LOCALIZATION_DATABASE_URL is required');
  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('begin');
    const selected = await client.query(`
      select job.id, job.content_id
      from public.translation_jobs as job
      join public.series_content_translations as translation
        on translation.content_id = job.content_id
       and translation.locale = job.target_language
      where job.status = 'completed'
        and job.target_language = 'zh'
        and translation.provider = 'libretranslate'
        and translation.review_status = 'automatic'
      order by job.completed_at
      for update of job
      limit $1
    `, [limit]);
    if (selected.rowCount !== limit) throw new Error(`expected 5 completed pilot jobs, found ${selected.rowCount}`);
    const ids = selected.rows.map((row) => row.id);
    const contentIds = selected.rows.map((row) => row.content_id);
    await client.query(`
      update public.series_content_translations
      set review_status = 'needs_review', updated_at = now()
      where content_id = any($1::uuid[]) and locale = 'zh'
    `, [contentIds]);
    const reset = await client.query(`
      update public.translation_jobs
      set status = 'pending', completed_at = null, next_attempt_at = now(),
          locked_at = null, worker_id = null, last_error = null, updated_at = now()
      where id = any($1::uuid[])
      returning id
    `, [ids]);
    await client.query('commit');
    console.log(`Requeued: ${reset.rowCount}`);
    console.log('Remaining jobs changed: 0');
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
