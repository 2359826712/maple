import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameVersion } from '@/domain/regionModel';
import type { RoutinePeriod } from '@/domain/routineTasks';
import { recentRoutineHistory, routineTasks } from '@/domain/routineTasks';
import { useRoutineTasks } from '@/hooks/useRoutineTasks';

interface RoutineChecklistProps {
  version: GameVersion;
  characterId: string | null;
  periodFilter: 'all' | RoutinePeriod;
  nowMs: number;
  world: string;
}

export default function RoutineChecklist({ version, characterId, periodFilter, nowMs, world }: RoutineChecklistProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const {
    availableTasks,
    selectedTasks,
    completeCount,
    isComplete,
    setComplete,
    setSelected,
    state,
  } = useRoutineTasks(version, characterId, nowMs, world);
  const recentHistory = recentRoutineHistory(state, nowMs);

  const displayedTasks = (editing ? availableTasks : selectedTasks)
    .filter((task) => periodFilter === 'all' || task.period === periodFilter);

  return (
    <section id="routine-checklist" className="mb-6 scroll-mt-24 rounded-xl border border-background-300 bg-white p-4" aria-labelledby="routine-checklist-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <i className="ri-calendar-todo-line" aria-hidden="true" />
            </span>
            <div>
              <h2 id="routine-checklist-title" className="font-heading text-lg font-semibold text-foreground-950">
                {t('routine_title')}
              </h2>
              <p className="text-xs text-foreground-600">
                {t('routine_progress', { done: completeCount, total: selectedTasks.length })}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-pressed={editing}
          onClick={() => setEditing((current) => !current)}
          className="h-11 rounded-full border border-background-400 bg-background-50 px-3 text-xs font-semibold text-foreground-900 hover:bg-primary-50"
        >
          <i className={`${editing ? 'ri-check-line' : 'ri-settings-3-line'} mr-1`} aria-hidden="true" />
          {editing ? t('routine_edit_done') : t('routine_edit')}
        </button>
      </div>

      <p className="mt-3 rounded-lg bg-background-100 px-3 py-2 text-xs text-foreground-600">
        {t('routine_scope_help')}
      </p>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {displayedTasks.map((task) => {
          const completed = isComplete(task);
          const selected = selectedTasks.some((candidate) => candidate.id === task.id);
          if (editing) {
            return (
              <label id={`routine-${task.id}`} key={task.id} className="flex min-h-14 scroll-mt-24 cursor-pointer items-center gap-3 rounded-lg border border-background-200 bg-background-50 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => setSelected(task.id, event.target.checked)}
                  className="h-4 w-4 accent-primary-600"
                />
                <RoutineCopy task={task} />
              </label>
            );
          }
          return (
            <button
              id={`routine-${task.id}`}
              key={task.id}
              type="button"
              aria-pressed={completed}
              onClick={() => setComplete(task, !completed)}
              className={`flex min-h-16 scroll-mt-24 items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${completed ? 'border-primary-200 bg-primary-50' : 'border-background-200 bg-background-50 hover:border-primary-300'}`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${completed ? 'border-primary-600 bg-primary-600 text-white' : 'border-background-300 bg-white text-transparent'}`}>
                <i className="ri-check-line" aria-hidden="true" />
              </span>
              <RoutineCopy task={task} completed={completed} />
            </button>
          );
        })}
      </div>
      {displayedTasks.length === 0 && (
        <p className="mt-4 text-center text-sm text-foreground-500">{t('routine_empty')}</p>
      )}

      <section className="mt-5 border-t border-background-300 pt-4" aria-labelledby="routine-history-title">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 id="routine-history-title" className="text-sm font-semibold text-foreground-950">
              {t('routine_history_title')}
            </h3>
            <p className="mt-1 text-xs text-foreground-700">{t('routine_history_recovery')}</p>
          </div>
          <span className="rounded-full bg-background-100 px-2.5 py-1 text-xs font-semibold text-foreground-800">
            {t('routine_history_count', { count: recentHistory.length })}
          </span>
        </div>
        {recentHistory.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {recentHistory.slice(0, 6).map((entry) => {
              const task = routineTasks.find((candidate) => candidate.id === entry.taskId);
              return (
                <li key={`${entry.key}:${entry.periodId}`} className="rounded-md border border-background-200 bg-background-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-foreground-900">{task ? t(task.titleKey) : entry.taskId}</span>
                  <span className="ml-2 text-foreground-600">
                    {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(entry.completedAt))}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-3 rounded-md bg-background-100 px-3 py-2 text-xs text-foreground-700">{t('routine_history_empty')}</p>
        )}
      </section>
    </section>
  );
}

function RoutineCopy({ task, completed = false }: { task: ReturnType<typeof useRoutineTasks>['availableTasks'][number]; completed?: boolean }) {
  const { t } = useTranslation();
  return (
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap items-center gap-2">
        <span className={`text-sm font-semibold ${completed ? 'text-primary-900 line-through' : 'text-foreground-950'}`}>
          <i className={`${task.icon} mr-1.5 text-primary-600`} aria-hidden="true" />
          {t(task.titleKey)}
        </span>
        <span className="rounded-full bg-background-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-600">
          {t(task.scope === 'account' ? 'routine_scope_account' : task.scope === 'world' ? 'routine_scope_world' : 'routine_scope_character')}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-foreground-500">
          {t(task.period === 'daily' ? 'checklist_type_daily' : 'checklist_type_weekly')}
        </span>
      </span>
      <span className="mt-0.5 block text-xs text-foreground-600">{t(task.descriptionKey)}</span>
    </span>
  );
}
