import type { IndexedContentRecord } from '@/domain/contentIndex';
import type {
  LocalizedSeriesContent,
  LocalizedSeriesContentField,
} from '@/services/seriesContentTranslation';

export type SeriesContentLocalization = {
  requestedLocale: string;
  databaseLocale: string;
  sourceLanguage: string;
  localizationKind: 'translated' | 'partial' | 'source';
  translatedFields: LocalizedSeriesContentField[];
  fallbackFields: LocalizedSeriesContentField[];
};

const translatedContentKeys = [
  'event_name',
  'eligibility',
  'requirements',
  'rewards',
  'event_currency',
  'event_shop',
  'participation_steps',
  'prerequisites',
  'steps',
  'recommended_items',
  'recommended_stats',
  'changes',
  'known_issues',
  'resolved_issues',
] as const;

const objectValue = (value: unknown): Record<string, unknown> | undefined => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
);

export function mergeLocalizedContentRecord(
  source: IndexedContentRecord,
  localized: LocalizedSeriesContent,
): IndexedContentRecord {
  const contentData = objectValue(localized.content_data);
  const merged = {
    ...source,
    title: localized.title,
    summary: localized.summary,
  } as IndexedContentRecord & Record<string, unknown>;

  for (const key of translatedContentKeys) {
    if (contentData && key in contentData) merged[key] = contentData[key];
  }

  const translatedMetadata = objectValue(contentData?.metadata);
  if (translatedMetadata && Array.isArray(translatedMetadata.sections)) {
    merged.metadata = {
      ...source.metadata,
      sections: translatedMetadata.sections,
    };
  }

  return merged;
}

export function getSeriesContentLocalization(
  localized: LocalizedSeriesContent,
): SeriesContentLocalization {
  return {
    requestedLocale: localized.requested_locale,
    databaseLocale: localized.database_locale,
    sourceLanguage: localized.source_language,
    localizationKind: localized.localizationKind,
    translatedFields: localized.translatedFields,
    fallbackFields: localized.fallbackFields,
  };
}
