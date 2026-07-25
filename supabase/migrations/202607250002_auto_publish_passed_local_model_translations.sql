create or replace function public.auto_publish_passed_local_model_translation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.review_status = 'needs_review'
    and new.provider = 'local_model'
    and new.model = 'maplestory-qwen2.5-7b-q4_k_m'
    and new.quality_checks->>'pipeline_version' = 'series-title-summary-v2-20260724'
    and new.quality_checks @> '{
      "status": "passed",
      "glossary": true,
      "glossary_occurrences": true,
      "html": true,
      "line_breaks": true,
      "numbers_and_dates": true,
      "placeholders": true,
      "untranslated_common_english": true,
      "urls": true
    }'::jsonb
    and btrim(new.title) <> ''
    and exists (
      select 1
      from public.series_content as content
      where content.id = new.content_id
        and content.source_revision = new.source_revision
    ) then
    new.review_status := 'automatic';
  end if;
  return new;
end;
$$;

drop trigger if exists auto_publish_passed_local_model_translation
  on public.series_content_translations;

create trigger auto_publish_passed_local_model_translation
before insert or update of
  provider,
  model,
  source_revision,
  title,
  quality_checks,
  review_status
on public.series_content_translations
for each row
execute function public.auto_publish_passed_local_model_translation();

update public.series_content_translations as translation
set review_status = 'automatic',
    updated_at = now()
from public.series_content as content
where content.id = translation.content_id
  and translation.review_status = 'needs_review'
  and translation.provider = 'local_model'
  and translation.model = 'maplestory-qwen2.5-7b-q4_k_m'
  and translation.source_revision = content.source_revision
  and translation.quality_checks->>'pipeline_version' = 'series-title-summary-v2-20260724'
  and translation.quality_checks @> '{
    "status": "passed",
    "glossary": true,
    "glossary_occurrences": true,
    "html": true,
    "line_breaks": true,
    "numbers_and_dates": true,
    "placeholders": true,
    "untranslated_common_english": true,
    "urls": true
  }'::jsonb
  and btrim(translation.title) <> '';

comment on function public.auto_publish_passed_local_model_translation() is
  'Publishes current local-model title and summary translations after all deterministic quality checks pass.';
