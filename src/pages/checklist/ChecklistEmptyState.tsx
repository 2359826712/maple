import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BossInfo } from '@/mocks/bosses';

export type ChecklistEmptyReason = 'no-eligible' | 'no-selected' | 'search' | 'filter';

interface ChecklistEmptyStateProps {
  reason: ChecklistEmptyReason;
  characterLevel: number;
  nextBoss: BossInfo | null;
  query: string;
  filterLabel: string;
  onEdit: () => void;
  onClearSearch: () => void;
  onShowAll: () => void;
}

export default function ChecklistEmptyState({
  reason,
  characterLevel,
  nextBoss,
  query,
  filterLabel,
  onEdit,
  onClearSearch,
  onShowAll,
}: ChecklistEmptyStateProps) {
  const { t, i18n } = useTranslation();

  const content = reason === 'no-eligible'
    ? {
      icon: 'ri-seedling-line',
      title: t('checklist_empty_no_eligible_title', { level: characterLevel }),
      description: t('checklist_empty_no_eligible_desc'),
      primary: (
        <Link to="/guides/level" className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">
          {t('checklist_level_guide')}
        </Link>
      ),
    }
    : reason === 'no-selected'
      ? {
        icon: 'ri-list-check-3',
        title: t('checklist_empty_no_selected_title'),
        description: t('checklist_empty_no_selected_desc'),
        primary: (
          <button type="button" onClick={onEdit} className="min-h-11 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">
            {t('checklist_empty_choose_tasks')}
          </button>
        ),
      }
      : reason === 'search'
        ? {
          icon: 'ri-search-eye-line',
          title: t('checklist_empty_search_title', { query }),
          description: t('checklist_empty_search_desc'),
          primary: (
            <button type="button" onClick={onClearSearch} className="min-h-11 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">
              {t('search_clear_btn')}
            </button>
          ),
        }
        : {
          icon: 'ri-filter-off-line',
          title: t('checklist_empty_filter_title', { filter: filterLabel }),
          description: t('checklist_empty_filter_desc'),
          primary: (
            <button type="button" onClick={onShowAll} className="min-h-11 rounded-full bg-primary-600 px-5 text-sm font-semibold text-white hover:bg-primary-700">
              {t('checklist_filter_all')}
            </button>
        ),
      };
  const localizedBossName = nextBoss
    ? (i18n.language.startsWith('zh') ? nextBoss.nameZh : nextBoss.name)
    : '';

  return (
    <section
      className="rounded-xl border border-background-300 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-14"
      aria-labelledby="checklist-empty-title"
      aria-live="polite"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl text-primary-600" aria-hidden="true">
        <i className={content.icon} />
      </div>
      <h2 id="checklist-empty-title" className="mt-5 font-heading text-xl font-semibold text-foreground-950 sm:text-2xl">
        {content.title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-foreground-600">{content.description}</p>
      {reason === 'no-eligible' && nextBoss && (
        <div className="mx-auto mt-5 max-w-xl rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-left text-sm text-foreground-700">
          <p className="font-semibold text-primary-800">
            {t('checklist_empty_no_eligible_next', {
              boss: localizedBossName,
              level: nextBoss.minLevel,
            })}
          </p>
          <p className="mt-1">
            {t('checklist_empty_no_eligible_reset_note')}
          </p>
        </div>
      )}
      <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        {content.primary}
        <Link to="/wiki/boss" className="inline-flex min-h-11 items-center justify-center rounded-full border border-background-300 bg-white px-5 text-sm font-semibold text-primary-700 hover:bg-primary-50">
          {t('checklist_boss_guides')}
        </Link>
      </div>
    </section>
  );
}
