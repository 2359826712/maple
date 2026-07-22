import { invokeLocalizationProvider } from './localization-provider.mjs';
import { protectGlossaryFields, restoreAndCheckTranslation } from './translation-quality.mjs';

const lastErrorText = (error) => String(error instanceof Error ? error.message : error).slice(0, 4000);

export async function recoverStaleTranslationJobs(client, staleMinutes = 30) {
  const result = await client.query(`
    update public.translation_jobs
    set status = 'retry',
        locked_at = null,
        worker_id = null,
        next_attempt_at = now(),
        updated_at = now(),
        last_error = 'processing lease expired'
    where status = 'processing'
      and locked_at < now() - ($1::text || ' minutes')::interval
    returning id
  `, [String(staleMinutes)]);
  return result.rowCount;
}

export async function claimTranslationJobs(client, workerId, limit) {
  return (await client.query(
    'select * from public.claim_translation_jobs($1, $2)',
    [workerId, limit],
  )).rows;
}

async function readSource(client, job) {
  return (await client.query(`
    select id, title, summary, body_html, source_revision, source_language
    from public.series_content
    where id = $1
  `, [job.content_id])).rows[0];
}

async function failJob(client, job, workerId, error) {
  await client.query(`
    update public.translation_jobs
    set status = 'failed',
        locked_at = null,
        worker_id = null,
        updated_at = now(),
        last_error = $3
    where id = $1
      and status = 'processing'
      and worker_id = $2
  `, [job.id, workerId, lastErrorText(error)]);
}

async function completeJob(client, { job, workerId, translated }) {
  await client.query('begin');
  try {
    const source = (await client.query(`
      select id, title, summary, source_revision, source_language
      from public.series_content
      where id = $1
      for update
    `, [job.content_id])).rows[0];
    const currentJob = (await client.query(`
      select id, status, worker_id, source_revision
      from public.translation_jobs
      where id = $1
      for update
    `, [job.id])).rows[0];
    if (!source || source.source_revision !== job.source_revision) {
      throw new Error('source revision changed after provider translation');
    }
    if (!currentJob || currentJob.status !== 'processing' || currentJob.worker_id !== workerId) {
      throw new Error('translation job lease was lost');
    }

    const title = translated.fields.title;
    if (typeof title !== 'string' || !title.trim()) throw new Error('translated title is required');
    const summary = typeof translated.fields.summary === 'string' ? translated.fields.summary : '';
    const stored = await client.query(`
      insert into public.series_content_translations (
        content_id, locale, title, summary, body_html, source_revision,
        provider, model, glossary_version, quality_checks, review_status
      ) values ($1, $2, $3, $4, '', $5, $6, $7, $8, $9::jsonb, $10)
      on conflict (content_id, locale) do update set
        title = excluded.title,
        summary = excluded.summary,
        body_html = excluded.body_html,
        source_revision = excluded.source_revision,
        provider = excluded.provider,
        model = excluded.model,
        glossary_version = excluded.glossary_version,
        quality_checks = excluded.quality_checks,
        review_status = excluded.review_status,
        updated_at = now()
      where public.series_content_translations.review_status <> 'approved'
      returning content_id, locale, source_revision, provider, model,
                glossary_version, quality_checks, review_status
    `, [
      job.content_id,
      job.target_language,
      title,
      summary,
      job.source_revision,
      translated.provider,
      translated.model,
      translated.glossary_version,
      JSON.stringify(translated.quality_checks),
      translated.review_status,
    ]);
    if (stored.rowCount !== 1) throw new Error('approved translation cannot be overwritten automatically');
    const completed = await client.query(`
      update public.translation_jobs
      set status = 'completed',
          locked_at = null,
          worker_id = null,
          updated_at = now(),
          completed_at = now(),
          glossary_version = $3,
          resolution_type = 'provider',
          resolution_metadata = $4::jsonb,
          last_error = null
      where id = $1
        and status = 'processing'
        and worker_id = $2
      returning id
    `, [
      job.id,
      workerId,
      translated.glossary_version,
      JSON.stringify({
        provider: translated.provider,
        transport: translated.transport,
        model: translated.model,
        model_version: translated.model_version,
        latency_ms: translated.latency_ms,
        usage: translated.usage,
      }),
    ]);
    if (completed.rowCount !== 1) throw new Error('translation job could not be completed');
    await client.query('commit');
    return stored.rows[0];
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  }
}

async function localizeJob({ job, source, provider, glossary }) {
  if (!source) throw new Error('source content does not exist');
  if (source.source_revision !== job.source_revision) throw new Error('source revision is stale');
  if (source.source_language !== job.source_language) throw new Error('source language changed');
  const protectedFields = protectGlossaryFields({
    fieldNames: job.field_names,
    source,
    targetLanguage: job.target_language,
    glossary,
  });
  const translated = await invokeLocalizationProvider({
    provider,
    request: {
      fieldNames: job.field_names,
      source: protectedFields.fields,
      sourceLanguage: job.source_language,
      targetLanguage: job.target_language,
      glossary: glossary.locales[job.target_language] || [],
    },
  });
  const quality = restoreAndCheckTranslation({
    fieldNames: job.field_names,
    source,
    translated: translated.fields,
    protectedFields,
    glossary,
  });
  return {
    ...translated,
    ...quality,
    review_status: provider.publishable ? quality.review_status : 'needs_review',
    quality_checks: {
      ...quality.quality_checks,
      provider: {
        transport: translated.transport,
        model_version: translated.model_version,
        latency_ms: translated.latency_ms,
        usage: translated.usage,
        publishable: provider.publishable,
      },
    },
  };
}

export async function previewTranslationWorker({
  client,
  provider,
  glossary,
  limit,
  targetLanguage,
}) {
  const jobs = (await client.query(`
    select job.*, content.title, content.summary, content.body_html,
           content.source_revision as current_source_revision,
           content.source_language as current_source_language
    from public.translation_jobs as job
    join public.series_content as content on content.id = job.content_id
    where job.status in ('pending', 'retry')
      and job.target_language = $1
      and job.next_attempt_at <= now()
    order by job.priority desc, job.next_attempt_at, job.created_at
    limit $2
  `, [targetLanguage, limit])).rows;
  const previews = [];
  for (const job of jobs) {
    const source = {
      id: job.content_id,
      title: job.title,
      summary: job.summary,
      body_html: job.body_html,
      source_revision: job.current_source_revision,
      source_language: job.current_source_language,
    };
    previews.push({
      job_id: job.id,
      content_id: job.content_id,
      target_language: job.target_language,
      translated: await localizeJob({ job, source, provider, glossary }),
    });
  }
  return previews;
}

export async function runTranslationWorker({
  client,
  workerId,
  limit,
  glossary,
  provider,
}) {
  if (!provider?.publishable) {
    throw new Error('non-publishable localization providers may only run in preview mode');
  }
  const recovered = await recoverStaleTranslationJobs(client);
  const jobs = await claimTranslationJobs(client, workerId, limit);
  const completed = [];
  const failed = [];

  for (const job of jobs) {
    try {
      const source = await readSource(client, job);
      const translated = await localizeJob({ job, source, provider, glossary });
      completed.push(await completeJob(client, {
        job,
        workerId,
        translated,
      }));
    } catch (error) {
      await failJob(client, job, workerId, error);
      failed.push({ id: job.id, error: lastErrorText(error) });
    }
  }

  return { recovered, claimed: jobs.length, completed, failed };
}
