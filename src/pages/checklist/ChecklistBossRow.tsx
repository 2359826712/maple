import { useTranslation } from 'react-i18next';
import type { BossInfo } from '@/mocks/bosses';
import type { BossDifficultyChecklistRule } from '@/domain/bossChecklistRules';

interface Props {
  boss: BossInfo;
  rules: readonly BossDifficultyChecklistRule[];
  trackedRule: BossDifficultyChecklistRule | null;
  current: number;
  editing: boolean;
  eligible: boolean;
  compact: boolean;
  onSetDifficulty: (difficulty: string | null) => void;
  onToggle: (rule: BossDifficultyChecklistRule, current: number) => void;
  onOpenInfo: (event: React.MouseEvent<HTMLElement>) => void;
  onViewGuide: () => void;
}

export default function ChecklistBossRow({
  boss,
  rules,
  trackedRule,
  current,
  editing,
  eligible,
  compact,
  onSetDifficulty,
  onToggle,
  onOpenInfo,
  onViewGuide,
}: Props) {
  const { t } = useTranslation();
  const isDone = Boolean(trackedRule && current >= trackedRule.clearLimit);
  const defaultRule = rules[rules.length - 1] ?? null;

  return (
    <article
      className={`rounded-lg border bg-white transition-colors ${
        isDone ? 'border-background-200 bg-background-50/70' : 'border-background-300 hover:border-primary-300'
      } ${compact ? 'px-3 py-2' : 'p-3 md:p-4'}`}
      data-boss-id={boss.id}
    >
      <div className="flex items-center gap-3">
        {editing && (
          <button
            type="button"
            aria-pressed={Boolean(trackedRule)}
            aria-label={t(trackedRule ? 'checklist_remove_boss' : 'checklist_add_boss', { boss: boss.name })}
            onClick={() => onSetDifficulty(trackedRule ? null : defaultRule?.difficulty ?? null)}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border text-lg ${
              trackedRule
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-background-300 bg-white text-foreground-600 hover:border-primary-500'
            }`}
          >
            <i className={trackedRule ? 'ri-check-line' : 'ri-add-line'} aria-hidden="true" />
          </button>
        )}

        <div className={`shrink-0 overflow-hidden rounded-md bg-background-100 ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}>
          {boss.image ? (
            <img
              src={boss.image}
              alt=""
              className="h-full w-full object-contain"
              loading="lazy"
              onError={(event) => { (event.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <i className="ri-skull-2-line flex h-full w-full items-center justify-center text-lg text-background-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <button
              type="button"
              onClick={onOpenInfo}
              className="truncate font-heading text-sm font-semibold text-primary-700 hover:underline md:text-base"
            >
              {boss.name}
            </button>
            {!eligible && (
              <span className="rounded bg-background-100 px-1.5 py-0.5 text-[10px] text-foreground-500">
                {t('checklist_task_available_level', { level: boss.minLevel })}
              </span>
            )}
          </div>

          {editing ? (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={t('checklist_choose_difficulty', { boss: boss.name })}>
              {rules.map((rule) => {
                const selected = trackedRule?.difficulty === rule.difficulty;
                return (
                  <button
                    key={rule.difficulty}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onSetDifficulty(rule.difficulty)}
                    className={`min-h-9 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      selected
                        ? 'border-primary-600 bg-primary-50 text-primary-800'
                        : 'border-background-300 bg-white text-foreground-700 hover:border-primary-400'
                    }`}
                  >
                    {rule.difficulty}
                    <span className="ml-1 font-normal text-foreground-500">
                      · {t(rule.period === 'weekly' ? 'checklist_type_weekly' : 'checklist_type_daily')}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : trackedRule ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-600">
              <span className="font-semibold text-foreground-800">{trackedRule.difficulty}</span>
              <span
                className={`rounded px-1.5 py-0.5 ${
                  trackedRule.period === 'weekly'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {t(trackedRule.period === 'weekly' ? 'checklist_type_weekly' : 'checklist_type_daily')}
              </span>
            </div>
          ) : null}
        </div>

        {!editing && trackedRule && (
          <button
            type="button"
            aria-label={t('checklist_toggle_boss', {
              boss: boss.name,
              difficulty: trackedRule.difficulty,
              done: current,
              limit: trackedRule.clearLimit,
            })}
            onClick={() => onToggle(trackedRule, current)}
            className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-md border px-2 text-sm font-bold transition-colors ${
              isDone
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-background-300 bg-white text-foreground-700 hover:border-primary-500 hover:bg-primary-50'
            }`}
          >
            {isDone ? <i className="ri-check-line text-lg" aria-hidden="true" /> : `${current}/${trackedRule.clearLimit}`}
          </button>
        )}

        <button
          type="button"
          onClick={onViewGuide}
          aria-label={t('checklist_view_guide_for', { boss: boss.name })}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-primary-700 hover:bg-primary-50"
        >
          <i className="ri-book-open-line" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
