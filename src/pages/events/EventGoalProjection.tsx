import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  applyRoutineCredit,
  calculateEventGoal,
  type EventGoalProgress,
} from '@/domain/eventGoalProjection';
import { routinePeriodId, routineTasks } from '@/domain/routineTasks';
import type { GameVersion } from '@/domain/regionModel';
import { useRoutineTasks } from '@/hooks/useRoutineTasks';
import { readEventGoals, writeEventGoal, type StoredEventGoal } from '@/services/eventGoals';

const emptyProgress = (): EventGoalProgress => ({
  current: 0,
  target: 0,
  dailyGain: 0,
  routineGain: 0,
  creditedPeriods: [],
  requirementComplete: false,
  rewardClaimed: false,
});

function readGoal(id: string, name: string, windowEnd: string): StoredEventGoal {
  return readEventGoals()[id] ?? { id, name, windowEnd, ...emptyProgress() };
}

interface EventGoalProjectionProps {
  id: string;
  name: string;
  version: GameVersion;
  windowEnd: string;
}

export default function EventGoalProjection({ id, name, version, windowEnd }: EventGoalProjectionProps) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState<StoredEventGoal>(() => readGoal(id, name, windowEnd));
  const routines = useRoutineTasks(version, null);
  const attendanceTask = routineTasks.find((task) => task.id === 'event-attendance')!;
  const attendanceComplete = routines.isComplete(attendanceTask);
  const attendancePeriod = routinePeriodId(attendanceTask, version);

  useEffect(() => setGoal(readGoal(id, name, windowEnd)), [id, name, windowEnd]);
  useEffect(() => {
    setGoal((current) => ({ ...current, id, name, windowEnd }));
  }, [id, name, windowEnd]);
  useEffect(() => { writeEventGoal(goal); }, [goal]);
  useEffect(() => {
    setGoal((current) => ({
      ...current,
      ...applyRoutineCredit(current, attendancePeriod, attendanceComplete).progress,
    }));
  }, [attendanceComplete, attendancePeriod]);

  const projection = useMemo(
    () => calculateEventGoal(goal, windowEnd),
    [goal, windowEnd],
  );
  const updateNumber = (key: 'current' | 'target' | 'dailyGain' | 'routineGain', value: number) => {
    setGoal((current) => ({ ...current, [key]: Math.max(0, Number.isFinite(value) ? value : 0) }));
  };

  return (
    <section id="event-goal" className="mt-4 scroll-mt-24 rounded-lg border border-background-300 bg-background-50 p-4" aria-labelledby="event-goal-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="event-goal-title" className="text-sm font-semibold text-foreground-950">{t('events_goal_title')}</h3>
          <p className="mt-1 text-xs text-foreground-700">{t('events_goal_desc')}</p>
        </div>
        <span className="rounded-full bg-background-100 px-2.5 py-1 text-xs font-semibold text-foreground-800">
          {t('events_goal_days', { count: projection.daysRemaining })}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(['current', 'target', 'dailyGain', 'routineGain'] as const).map((key) => (
          <label key={key} className="text-xs font-semibold text-foreground-800">
            {t(`events_goal_${key === 'dailyGain' ? 'daily' : key === 'routineGain' ? 'routine_gain' : key}`)}
            <input
              type="number"
              min={0}
              step={1}
              value={goal[key]}
              onChange={(event) => updateNumber(key, event.target.valueAsNumber)}
              className="mt-1 h-11 w-full rounded-md border border-background-400 bg-white px-3 text-sm text-foreground-950"
            />
          </label>
        ))}
      </div>

      <p className="mt-3 rounded-md bg-background-100 px-3 py-2 text-xs text-foreground-700">
        <i className="ri-links-line mr-1 text-primary-700" aria-hidden="true" />
        {t(attendanceComplete ? 'events_goal_routine_complete' : 'events_goal_routine_link')}
      </p>

      {goal.target > 0 && (
        <div className={`mt-3 rounded-md px-3 py-2 text-sm ${projection.onTrack ? 'bg-primary-50 text-primary-950' : 'bg-accent-50 text-accent-950'}`} role="status">
          <div className="font-semibold">
            {projection.onTrack ? t('events_goal_on_track') : t('events_goal_behind')}
          </div>
          <div className="mt-0.5 text-xs">
            {t('events_goal_result', {
              projected: projection.projected.toLocaleString(),
              required: projection.requiredPerDay.toLocaleString(),
            })}
          </div>
          <div className="mt-1 text-xs font-medium">
            {projection.onTrack
              ? t('events_goal_recovery', { count: projection.recoveryDays })
              : t('events_goal_required_pace', { amount: projection.requiredPerDay.toLocaleString() })}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-background-300 bg-white p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-foreground-700">{t('events_goal_claim_title')}</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            aria-pressed={goal.requirementComplete}
            onClick={() => setGoal((current) => ({
              ...current,
              requirementComplete: !current.requirementComplete,
              rewardClaimed: current.requirementComplete ? false : current.rewardClaimed,
            }))}
            className={`min-h-11 rounded-md border px-3 text-left text-sm font-semibold ${goal.requirementComplete ? 'border-primary-400 bg-primary-50 text-primary-950' : 'border-background-300 text-foreground-800'}`}
          >
            <i className={`${goal.requirementComplete ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} mr-1.5`} aria-hidden="true" />
            {t('events_goal_requirement_complete')}
          </button>
          <button
            type="button"
            disabled={!goal.requirementComplete}
            aria-pressed={goal.rewardClaimed}
            onClick={() => setGoal((current) => ({ ...current, rewardClaimed: !current.rewardClaimed }))}
            className={`min-h-11 rounded-md border px-3 text-left text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${goal.rewardClaimed ? 'border-secondary-400 bg-secondary-50 text-secondary-950' : 'border-background-300 text-foreground-800'}`}
          >
            <i className={`${goal.rewardClaimed ? 'ri-gift-fill' : 'ri-gift-line'} mr-1.5`} aria-hidden="true" />
            {t('events_goal_reward_claimed')}
          </button>
        </div>
        <p className="mt-2 text-xs text-foreground-700" role="status">
          {goal.rewardClaimed
            ? t('events_goal_claimed_status')
            : goal.requirementComplete
              ? t('events_goal_unclaimed_status')
              : t('events_goal_in_progress_status')}
        </p>
      </div>
    </section>
  );
}
