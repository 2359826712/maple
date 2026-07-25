import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { VerifiedSeriesResource } from '@/pages/series/verifiedContent';
import { getVerifiedSeriesResourceSlug } from '@/pages/series/verifiedContent';
import { getSeriesResourceHref } from '@/pages/series/scope';
import { getCommunityDestinationDetails } from './communityDestinationDetails';

type Props = {
  seriesId: string;
  destinations: VerifiedSeriesResource[];
  fallbackImage: string;
  localizeHref: (href: string) => string;
};

const getCommunityKind = (resource: VerifiedSeriesResource) => {
  const value = `${resource.category || ''} ${resource.sourceUrl} ${resource.title}`.toLowerCase();
  if (value.includes('discord')) return { icon: 'ri-discord-fill', labelKey: 'community_kind_discord' };
  if (value.includes('reddit')) return { icon: 'ri-reddit-line', labelKey: 'community_kind_reddit' };
  if (value.includes('youtube')) return { icon: 'ri-youtube-fill', labelKey: 'community_kind_video' };
  if (value.includes('telegram')) return { icon: 'ri-message-3-line', labelKey: 'community_kind_updates' };
  if (value.includes('medium')) return { icon: 'ri-article-line', labelKey: 'community_kind_articles' };
  if (value.includes('forum')) return { icon: 'ri-chat-3-line', labelKey: 'community_kind_forum' };
  if (value.includes('x.com') || value.includes('twitter')) return { icon: 'ri-twitter-x-line', labelKey: 'community_kind_updates' };
  return { icon: 'ri-group-line', labelKey: 'community_kind_hub' };
};

export default function CommunitySelector({
  seriesId,
  destinations,
  fallbackImage,
  localizeHref,
}: Props) {
  const { t } = useTranslation();
  const destinationIds = useMemo(
    () => destinations.map((destination) => getVerifiedSeriesResourceSlug(destination)),
    [destinations],
  );
  const preferredId = useMemo(() => {
    const preferredIndex = destinations.findIndex((destination) => Boolean(destination.resourceId));
    return destinationIds[Math.max(0, preferredIndex)] || '';
  }, [destinationIds, destinations]);
  const [selectedId, setSelectedId] = useState(preferredId);

  useEffect(() => {
    setSelectedId(preferredId);
  }, [preferredId]);

  const selectedIndex = Math.max(0, destinationIds.indexOf(selectedId));
  const selected = destinations[selectedIndex];
  if (!selected) return null;

  const selectedKind = getCommunityKind(selected);
  const details = getCommunityDestinationDetails(selected);
  const onSiteHref = localizeHref(getSeriesResourceHref(
    seriesId,
    'community',
    getVerifiedSeriesResourceSlug(selected),
  ));

  return (
    <section className="overflow-hidden rounded-2xl border border-background-300 bg-background-50 shadow-sm">
      <div className="border-b border-background-200 bg-background-100 px-5 py-5 md:px-7">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
          {t('community_choose_eyebrow')}
        </p>
        <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground-950">
          {t('community_choose_title')}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-600">
          {t('community_choose_desc')}
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.7fr)]">
        <div
          className="border-b border-background-200 p-3 lg:border-b-0 lg:border-r"
          role="tablist"
          aria-label={t('community_destination_list')}
        >
          {destinations.map((destination, index) => {
            const destinationId = destinationIds[index];
            const kind = getCommunityKind(destination);
            const selectedDestination = destinationId === selectedId;
            return (
              <button
                key={`${destination.sourceUrl}-${destination.title}`}
                type="button"
                role="tab"
                aria-selected={selectedDestination}
                aria-controls="community-destination-preview"
                onClick={() => setSelectedId(destinationId)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                  selectedDestination
                    ? 'bg-primary-100 text-primary-900 ring-1 ring-primary-200'
                    : 'text-foreground-700 hover:bg-background-100 hover:text-foreground-950',
                ].join(' ')}
              >
                <span className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg',
                  selectedDestination ? 'bg-primary-600 text-background-50' : 'bg-background-200 text-foreground-600',
                ].join(' ')}>
                  <i className={kind.icon} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{destination.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-foreground-500">
                    <span>{t(kind.labelKey)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{t(getCommunityDestinationDetails(destination).authority === 'official'
                      ? 'community_authority_official'
                      : 'community_authority_player')}</span>
                  </span>
                </span>
                <i className="ri-arrow-right-s-line ml-auto text-foreground-400" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <article id="community-destination-preview" role="tabpanel" className="min-w-0">
          <div className="relative aspect-[16/6] min-h-44 overflow-hidden bg-foreground-950">
            <img
              src={selected.imageUrl || fallbackImage}
              alt={selected.imageAlt || selected.title}
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground-950/90 via-foreground-950/60 to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-background-50 md:p-7">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-background-50/20 bg-foreground-950/40 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                <i className={selectedKind.icon} aria-hidden="true" />
                {t(selectedKind.labelKey)}
              </span>
              <h3 className="mt-3 font-heading text-2xl font-semibold md:text-3xl">{selected.title}</h3>
            </div>
          </div>

          <div className="p-5 md:p-7">
            <p className="text-sm leading-6 text-foreground-700">{selected.description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-background-200 bg-background-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-500">
                  {t('community_authority')}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground-900">
                  {t(details.authority === 'official'
                    ? 'community_authority_official'
                    : 'community_authority_player')}
                </p>
              </div>
              <div className="rounded-xl border border-background-200 bg-background-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-500">
                  {t('community_operator')}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground-900">{details.operator}</p>
              </div>
              <div className="rounded-xl border border-background-200 bg-background-100 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-500">
                  {t('community_access')}
                </p>
                <p className="mt-2 text-sm leading-5 text-foreground-700">{details.access}</p>
              </div>
            </div>

            <div className="mt-7 grid gap-7 md:grid-cols-2">
              <section>
                <h4 className="text-sm font-semibold text-foreground-950">{t('community_sections')}</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {details.sections.map((section) => (
                    <span
                      key={section}
                      className="rounded-full border border-background-300 bg-background-50 px-3 py-1.5 text-xs text-foreground-700"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-sm font-semibold text-foreground-950">{t('community_preview_title')}</h4>
                <ul className="mt-3 space-y-3">
                  {details.content.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-6 text-foreground-700">
                      <i className="ri-check-line mt-1 text-primary-600" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {details.samples.length > 0 ? (
              <section className="mt-7">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground-950">
                      {t('community_content_snapshot')}
                    </h4>
                    <p className="mt-1 text-xs leading-5 text-foreground-500">
                      {t('community_content_snapshot_desc')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-foreground-500">
                    {details.verifiedAt}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {details.samples.map((sample) => (
                    <article
                      key={sample.title}
                      className="rounded-xl border border-background-200 bg-background-100 p-4"
                    >
                      <p className="text-sm font-semibold leading-5 text-foreground-950">{sample.title}</p>
                      <p className="mt-2 text-xs leading-5 text-foreground-600">{sample.summary}</p>
                      {sample.url ? (
                        <a
                          href={sample.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                        >
                          {t('community_open_sample')}
                          <i className="ri-external-link-line" aria-hidden="true" />
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="mt-7 rounded-xl border border-primary-200 bg-primary-50 p-4 md:p-5">
              <div className="flex items-start gap-3">
                <i className="ri-shield-check-line mt-0.5 text-xl text-primary-700" aria-hidden="true" />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-foreground-950">{t('community_verified_destination')}</h4>
                  <p className="mt-1 text-xs leading-5 text-foreground-600">
                    {t('community_verified_on')} {details.verifiedAt}. {t('community_exact_url_note')}
                  </p>
                  <a
                    href={details.canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all font-mono text-xs font-semibold text-primary-700 hover:underline"
                  >
                    {details.canonicalUrl}
                  </a>
                  <p className="mt-3 border-t border-primary-200 pt-3 text-xs leading-5 text-foreground-600">
                    <span className="font-semibold text-foreground-800">{t('community_caution')}: </span>
                    {details.caution}
                  </p>
                  <a
                    href={details.verificationSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline"
                  >
                    {t('community_verification_evidence')}
                    <i className="ri-external-link-line" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={details.canonicalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-semibold text-background-50 hover:bg-primary-700"
              >
                {t('community_visit_selected')}
                <i className="ri-external-link-line" aria-hidden="true" />
              </a>
              <Link
                to={onSiteHref}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-background-300 bg-background-50 px-4 text-sm font-semibold text-foreground-700 hover:border-primary-400 hover:text-primary-700"
              >
                {t('community_view_on_site')}
                <i className="ri-arrow-right-line" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
