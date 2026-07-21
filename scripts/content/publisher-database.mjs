import { buildPublisherPlan, projectionKey } from './publisher.mjs';

export const seriesContentSelect = `
  select id, series_id, edition_id, module, slug, source_language, title, summary, body_html,
         source_label, source_url, source_revision, published_at, source_updated_at,
         verified_at, status, content_data
  from public.series_content
`;

export async function readSeriesContent(client, projections = null) {
  if (!projections) return (await client.query(seriesContentSelect)).rows;
  if (!projections.length) return [];
  const keys = projections.map((row) => ({
    series_id: row.series_id,
    module: row.module,
    slug: row.slug,
  }));
  return (await client.query(`
    ${seriesContentSelect}
    join jsonb_to_recordset($1::jsonb) as requested (
      series_id varchar(64), module varchar(24), slug varchar(160)
    ) using (series_id, module, slug)
  `, [JSON.stringify(keys)])).rows;
}

async function registerContentRelease(client, release) {
  if (!release) return null;
  await client.query(`
    insert into public.content_releases (
      id, manifest_uri, manifest_hash, source, file_count, generated_at
    ) values ($1, $2, $3, $4, $5, $6)
    on conflict (id) do nothing
  `, [
    release.release_id,
    release.manifest_uri,
    release.manifest_hash,
    release.source,
    release.files,
    release.generated_at,
  ]);
  const result = await client.query(`
    select id, manifest_uri, manifest_hash, source, file_count, generated_at
    from public.content_releases
    where id = $1
  `, [release.release_id]);
  const stored = result.rows[0];
  const storedGeneratedAt = stored?.generated_at ? new Date(stored.generated_at).toISOString() : null;
  if (!stored
    || stored.manifest_uri !== release.manifest_uri
    || stored.manifest_hash !== release.manifest_hash
    || stored.source !== release.source
    || stored.file_count !== release.files
    || storedGeneratedAt !== release.generated_at) {
    throw new Error(`content release ${release.release_id} conflicts with its immutable registration`);
  }
  return stored.id;
}

async function createPublisherRun(client, runContext, releaseId) {
  const result = await client.query(`
    insert into public.publisher_runs (
      manifest_hash, source_count, selected_count, selector, release_id, status
    ) values ($1, $2, $3, $4::jsonb, $5, 'running')
    returning id, manifest_hash, started_at, status
  `, [
    runContext.manifestHash,
    runContext.sourceCount,
    runContext.selectedCount,
    JSON.stringify(runContext.selector),
    releaseId,
  ]);
  return result.rows[0];
}

async function markPublisherRunFailed(client, runId, plan, error) {
  await client.query(`
    update public.publisher_runs set
      insert_count = $2,
      update_count = $3,
      skip_count = $4,
      error_count = $5,
      status = 'failed',
      completed_at = now(),
      last_error = $6
    where id = $1
  `, [
    runId,
    plan?.summary.insert || 0,
    plan?.summary.update || 0,
    plan?.summary.skip || 0,
    plan?.summary.error || 1,
    String(error instanceof Error ? error.message : error).slice(0, 4000),
  ]);
}

async function upsertProjections(client, records) {
  if (!records.length) return [];
  const payload = records.map((record) => ({
    series_id: record.series_id,
    edition_id: record.edition_id,
    module: record.module,
    slug: record.slug,
    source_language: record.source_language,
    title: record.title,
    summary: record.summary,
    body_html: record.body_html,
    source_label: record.source_label,
    source_url: record.source_url,
    source_revision: record.source_revision,
    published_at: record.published_at,
    source_updated_at: record.source_updated_at,
    verified_at: record.verified_at,
    status: record.status,
    content_data: record.content_data,
  }));
  const result = await client.query(`
    insert into public.series_content (
      series_id, edition_id, module, slug, source_language, title, summary, body_html,
      source_label, source_url, source_revision, published_at, source_updated_at,
      verified_at, status, content_data
    )
    select
      series_id, edition_id, module, slug, source_language, title, summary, body_html,
      source_label, source_url, source_revision, published_at, source_updated_at,
      verified_at, status, content_data
    from jsonb_to_recordset($1::jsonb) as incoming (
      series_id varchar(64),
      edition_id varchar(96),
      module varchar(24),
      slug varchar(160),
      source_language varchar(16),
      title text,
      summary text,
      body_html text,
      source_label text,
      source_url text,
      source_revision text,
      published_at timestamptz,
      source_updated_at timestamptz,
      verified_at timestamptz,
      status varchar(16),
      content_data jsonb
    )
    on conflict (series_id, module, slug) do update set
      edition_id = excluded.edition_id,
      source_language = excluded.source_language,
      title = excluded.title,
      summary = excluded.summary,
      body_html = excluded.body_html,
      source_label = excluded.source_label,
      source_url = excluded.source_url,
      source_revision = excluded.source_revision,
      published_at = excluded.published_at,
      source_updated_at = excluded.source_updated_at,
      verified_at = excluded.verified_at,
      status = excluded.status,
      content_data = excluded.content_data,
      updated_at = now()
    returning id, series_id, module, slug, source_revision
  `, [JSON.stringify(payload)]);
  return result.rows;
}

function assertReconciled(result, expectedCount, stage) {
  if (result.errors.length || result.summary.skip !== expectedCount || result.summary.insert || result.summary.update) {
    throw new Error(`${stage} reconciliation failed: ${JSON.stringify(result.summary)}`);
  }
}

export async function applySeriesContent(client, { contentRecords, sourceRecords, runContext }) {
  if (!runContext) throw new Error('publisher apply requires run context');
  const releaseId = await registerContentRelease(client, runContext.release);
  const publisherRun = await createPublisherRun(client, runContext, releaseId);
  let committed = false;
  let plan;
  try {
    await client.query('begin');
    const candidates = buildPublisherPlan({ contentRecords, sourceRecords, existingRows: [] });
    if (candidates.errors.length) throw new Error(`publisher plan contains ${candidates.errors.length} error(s)`);
    const existingRows = await readSeriesContent(client, candidates.records);
    plan = buildPublisherPlan({ contentRecords, sourceRecords, existingRows });
    if (plan.errors.length) throw new Error(`publisher plan contains ${plan.errors.length} error(s)`);

    const written = await upsertProjections(
      client,
      plan.records.filter((record) => record.action !== 'skip'),
    );

    const reconciled = await readSeriesContent(client, plan.records);
    const beforeCommit = buildPublisherPlan({
      contentRecords,
      sourceRecords,
      existingRows: reconciled,
    });
    assertReconciled(beforeCommit, contentRecords.length, 'pre-commit');

    const reconciledRows = new Map(
      reconciled.map((row) => [projectionKey(row), row]),
    );
    const runItems = plan.records.map((record) => {
      const content = reconciledRows.get(projectionKey(record));
      if (!content?.id) throw new Error(`cannot resolve content UUID for ${record.slug}`);
      return {
        publisher_run_id: publisherRun.id,
        content_id: content.id,
        action: record.action,
        source_revision: record.source_revision,
      };
    });
    await client.query(`
      insert into public.publisher_run_items (
        publisher_run_id, content_id, action, source_revision
      )
      select publisher_run_id, content_id, action, source_revision
      from jsonb_to_recordset($1::jsonb) as incoming (
        publisher_run_id uuid,
        content_id uuid,
        action varchar(16),
        source_revision text
      )
    `, [JSON.stringify(runItems)]);
    await client.query(`
      update public.publisher_runs set
        insert_count = $2,
        update_count = $3,
        skip_count = $4,
        error_count = $5,
        status = 'completed',
        completed_at = now(),
        last_error = null
      where id = $1
    `, [
      publisherRun.id,
      plan.summary.insert,
      plan.summary.update,
      plan.summary.skip,
      plan.summary.error,
    ]);
    await client.query('commit');
    committed = true;

    const afterCommit = buildPublisherPlan({
      contentRecords,
      sourceRecords,
      existingRows: await readSeriesContent(client, plan.records),
    });
    assertReconciled(afterCommit, contentRecords.length, 'post-commit');
    return {
      plan,
      publisherRun: { ...publisherRun, status: 'completed' },
      written,
      verified: afterCommit.summary.skip,
    };
  } catch (error) {
    if (!committed) await client.query('rollback').catch(() => {});
    await markPublisherRunFailed(client, publisherRun.id, plan, error).catch(() => {});
    throw error;
  }
}
