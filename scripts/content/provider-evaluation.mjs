import { protectGlossaryFields, restoreAndCheckTranslation } from './translation-quality.mjs';
import { providerRuntime, translateWithProvider } from './provider-router.mjs';
import { providersForFields } from './translation-provider-policy.mjs';

const errorText = (error) => String(error instanceof Error ? error.message : error).slice(0, 4000);

export async function readProviderEvaluationSample(client, { limit, targetLanguage }) {
  const result = await client.query(`
    select job.release_id, job.content_id, job.field_names, job.source_revision,
           job.source_language, job.target_language, job.policy_version,
           content.module, content.title, content.summary
    from public.translation_jobs as job
    join public.series_content as content on content.id = job.content_id
    join public.series_content_translations as translation
      on translation.content_id = job.content_id
     and translation.locale = job.target_language
    where job.status = 'completed'
      and job.target_language = $1
      and translation.source_revision = job.source_revision
      and translation.glossary_version = '1'
      and translation.review_status = 'needs_review'
    order by job.created_at, job.content_id
    limit $2
  `, [targetLanguage, limit]);
  if (result.rowCount !== limit) {
    throw new Error(`provider evaluation requires exactly ${limit} quality-gated rows; found ${result.rowCount}`);
  }
  return result.rows;
}

export function buildProviderEvaluationPlan({ sample, policy, environment = process.env }) {
  const candidates = [];
  for (const content of sample) {
    const providers = providersForFields({
      module: content.module,
      fieldNames: content.field_names,
      policy,
    });
    for (const provider of providers) {
      const runtime = providerRuntime(provider, policy, environment);
      candidates.push({
        content_id: content.content_id,
        module: content.module,
        target_language: content.target_language,
        field_names: content.field_names,
        provider,
        model: runtime.model,
        availability: runtime.ready ? 'ready' : 'unavailable',
        missing_environment: runtime.missing,
      });
    }
  }
  return {
    routing_version: policy.routing_version,
    sample_size: sample.length,
    candidate_count: candidates.length,
    ready_count: candidates.filter((candidate) => candidate.availability === 'ready').length,
    unavailable_count: candidates.filter((candidate) => candidate.availability === 'unavailable').length,
    candidates,
  };
}

async function storeEvaluation(client, content, policy, glossary, result) {
  await client.query(`
    insert into public.translation_provider_evaluations (
      release_id, content_id, field_names, source_revision, source_language,
      target_language, policy_version, routing_version, glossary_version,
      provider, model, translated_fields, quality_checks, status,
      quality_status, review_status, reviewer_score, reviewer_notes,
      last_error, evaluated_at, reviewed_at
    ) values (
      $1, $2, $3::text[], $4, $5, $6, $7, $8, $9,
      $10, $11, $12::jsonb, $13::jsonb, $14, $15,
      'unreviewed', null, null, $16, now(), null
    )
    on conflict (
      content_id, target_language, source_revision, routing_version, provider, model
    ) do update set
      field_names = excluded.field_names,
      translated_fields = excluded.translated_fields,
      quality_checks = excluded.quality_checks,
      status = excluded.status,
      quality_status = excluded.quality_status,
      review_status = 'unreviewed',
      reviewer_score = null,
      reviewer_notes = null,
      last_error = excluded.last_error,
      evaluated_at = now(),
      reviewed_at = null,
      updated_at = now()
  `, [
    content.release_id,
    content.content_id,
    content.field_names,
    content.source_revision,
    content.source_language,
    content.target_language,
    content.policy_version,
    policy.routing_version,
    glossary.glossary_version,
    result.provider,
    result.model,
    JSON.stringify(result.fields || {}),
    JSON.stringify(result.quality_checks || {}),
    result.status,
    result.quality_status || null,
    result.last_error || null,
  ]);
}

export async function runProviderEvaluation({
  client,
  sample,
  policy,
  glossary,
  environment = process.env,
  fetchImpl = fetch,
}) {
  const results = [];
  for (const content of sample) {
    const providers = providersForFields({
      module: content.module,
      fieldNames: content.field_names,
      policy,
    });
    for (const provider of providers) {
      const runtime = providerRuntime(provider, policy, environment);
      if (!runtime.ready) {
        const result = {
          provider,
          model: runtime.model,
          status: 'unavailable',
          last_error: `missing environment: ${runtime.missing.join(', ')}`,
        };
        await storeEvaluation(client, content, policy, glossary, result);
        results.push({ content_id: content.content_id, ...result });
        continue;
      }
      try {
        const source = Object.fromEntries(content.field_names.map((field) => [field, content[field]]));
        const protectedFields = protectGlossaryFields({
          fieldNames: content.field_names,
          source,
          targetLanguage: content.target_language,
          glossary,
        });
        const translated = await translateWithProvider({
          provider,
          policy,
          environment,
          fetchImpl,
          fieldNames: content.field_names,
          source: protectedFields.fields,
          sourceLanguage: content.source_language,
          targetLanguage: content.target_language,
        });
        const quality = restoreAndCheckTranslation({
          fieldNames: content.field_names,
          source,
          translated: translated.fields,
          protectedFields,
          glossary,
        });
        const result = {
          provider,
          model: translated.model,
          fields: quality.fields,
          quality_checks: quality.quality_checks,
          quality_status: quality.review_status,
          status: 'completed',
        };
        await storeEvaluation(client, content, policy, glossary, result);
        results.push({ content_id: content.content_id, ...result });
      } catch (error) {
        const result = {
          provider,
          model: runtime.model,
          status: 'failed',
          last_error: errorText(error),
        };
        await storeEvaluation(client, content, policy, glossary, result);
        results.push({ content_id: content.content_id, ...result });
      }
    }
  }
  return results;
}
