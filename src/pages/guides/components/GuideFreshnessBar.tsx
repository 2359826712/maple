import { useTranslation } from 'react-i18next';

interface GuideFreshnessBarProps {
  sourceSyncedAt?: string;
  versions?: string[];
  compact?: boolean;
}

const formatSourceTime = (value: string | undefined, language: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default function GuideFreshnessBar({ sourceSyncedAt, versions = ['gms'], compact = false }: GuideFreshnessBarProps) {
  const { t, i18n } = useTranslation();
  const syncedLabel = formatSourceTime(sourceSyncedAt, i18n.language);
  const versionLabels = versions.map((version) => version.toUpperCase()).join(' · ');

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-lg border border-background-300 bg-background-100 text-foreground-700 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 font-bold text-accent-800">
        <i className="ri-global-line" aria-hidden="true"></i>
        {t('guides_applicable_to', { versions: versionLabels })}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <i className="ri-refresh-line text-primary-600" aria-hidden="true"></i>
        {syncedLabel
          ? t('guides_source_synced', { date: syncedLabel })
          : t('guides_source_sync_unknown')}
      </span>
      <span className="inline-flex items-center gap-1.5 text-foreground-600" title={t('guides_patch_unverified_help')}>
        <i className="ri-information-line" aria-hidden="true"></i>
        {t('guides_patch_unverified')}
      </span>
    </div>
  );
}

