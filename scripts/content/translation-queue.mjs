function contentKey(value) {
  return `${value.series_id}\u0000${value.module}\u0000${value.slug}`;
}

export function buildTranslationQueueRows(plan, contentRows) {
  const contentByKey = new Map(contentRows.map((row) => [contentKey(row), row]));
  return plan.jobs.map((job) => {
    const content = contentByKey.get(contentKey(job));
    if (!content?.id) throw new Error(`cannot resolve content UUID for ${job.slug}`);
    if (content.source_revision !== job.source_revision) {
      throw new Error(`source revision changed for ${job.slug}`);
    }
    if (content.source_language !== job.source_language) {
      throw new Error(`source language changed for ${job.slug}`);
    }
    return {
      release_id: plan.release_id,
      content_id: content.id,
      entity_type: 'series_content',
      field_names: job.fields,
      source_revision: job.source_revision,
      source_language: job.source_language,
      target_language: job.target_language,
      policy_version: job.policy_version,
    };
  });
}

async function assertRegisteredRelease(client, release) {
  const result = await client.query(`
    select id, manifest_hash, file_count
    from public.content_releases
    where id = $1
  `, [release.release_id]);
  const stored = result.rows[0];
  if (!stored
    || stored.manifest_hash !== release.manifest_hash
    || stored.file_count !== release.files) {
    throw new Error(`content release ${release.release_id} is not registered or conflicts with the plan`);
  }
}

async function readContentRows(client, jobs) {
  const keys = jobs.map((job) => ({
    series_id: job.series_id,
    module: job.module,
    slug: job.slug,
  }));
  return (await client.query(`
    select content.id, content.series_id, content.module, content.slug,
           content.source_language, content.source_revision
    from public.series_content as content
    join jsonb_to_recordset($1::jsonb) as requested (
      series_id varchar(64), module varchar(24), slug varchar(160)
    ) using (series_id, module, slug)
  `, [JSON.stringify(keys)])).rows;
}

export async function enqueueTranslationPlan(client, { release, plan }) {
  if (!release?.release_id) throw new Error('queue apply requires a content release');
  if (!plan?.jobs?.length) throw new Error('queue apply requires at least one planned job');
  const queuePlan = { ...plan, release_id: release.release_id };

  await client.query('begin');
  try {
    await assertRegisteredRelease(client, release);
    const queueRows = buildTranslationQueueRows(queuePlan, await readContentRows(client, plan.jobs));
    const inserted = await client.query(`
      insert into public.translation_jobs (
        release_id, content_id, entity_type, field_names, source_revision,
        source_language, target_language, policy_version
      )
      select release_id, content_id, entity_type, field_names, source_revision,
             source_language, target_language, policy_version
      from jsonb_to_recordset($1::jsonb) as incoming (
        release_id varchar(160),
        content_id uuid,
        entity_type varchar(32),
        field_names text[],
        source_revision text,
        source_language varchar(16),
        target_language varchar(16),
        policy_version varchar(32)
      )
      on conflict (content_id, target_language, source_revision, policy_version) do nothing
      returning id, content_id, target_language, status
    `, [JSON.stringify(queueRows)]);
    await client.query('commit');
    return {
      requested: queueRows.length,
      created: inserted.rowCount,
      existing: queueRows.length - inserted.rowCount,
      rows: inserted.rows,
    };
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  }
}
