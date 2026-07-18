import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useVersion } from '@/hooks/VersionContext';
import { getVersionDefinition, type OfficialContentKind } from '@/domain/regionModel';
import { getLocalizedVersionPresentation } from '@/domain/versionPresentation';

const linkMeta: Array<{ kind: OfficialContentKind; labelKey: string; icon: string; to?: string }> = [
  { kind: 'website', labelKey: 'server_source_website', icon: 'ri-global-line' },
  { kind: 'events', labelKey: 'server_source_events', icon: 'ri-calendar-event-line', to: '/events' },
  { kind: 'news', labelKey: 'server_source_news', icon: 'ri-megaphone-line', to: '/news' },
  { kind: 'rankings', labelKey: 'server_source_rankings', icon: 'ri-bar-chart-box-line', to: '/rankings' },
];

export default function OfficialServerLinks({ preferred }: { preferred?: OfficialContentKind }) {
  const { t } = useTranslation();
  const { version } = useVersion();
  const versionInfo = getVersionDefinition(version);
  const versionPresentation = getLocalizedVersionPresentation(versionInfo, t);
  const links = [...linkMeta]
    .sort((a, b) => Number(b.kind === preferred) - Number(a.kind === preferred))
    .filter(({ kind, to }) => Boolean(to || versionInfo.officialLinks[kind]));

  return (
    <aside className="rounded-xl border border-background-200 bg-background-100/70 px-4 py-3" aria-label={t('server_source_title')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground-900">{versionPresentation.name}</span>
            <span className="rounded-full bg-background-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-600">
              {versionPresentation.region}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-600">
            {t('server_source_desc')}
          </p>
        </div>

        {links.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {links.map(({ kind, labelKey, icon, to }) => {
              const internalTo = kind === preferred && versionInfo.officialLinks[kind] ? undefined : to;
              const className = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  kind === preferred
                    ? 'border-primary-500 bg-primary-500 text-background-50 hover:bg-primary-600'
                    : 'border-background-300 bg-background-50 text-foreground-700 hover:border-primary-300 hover:text-primary-700'
                }`;
              const content = <><i className={icon} aria-hidden="true" />{t(labelKey)}</>;

              return internalTo ? (
                <Link key={kind} to={internalTo} className={className}>{content}</Link>
              ) : (
                <a key={kind} href={versionInfo.officialLinks[kind]} target="_blank" rel="noreferrer" className={className}>
                  {content}<i className="ri-external-link-line text-[10px]" aria-hidden="true" />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
