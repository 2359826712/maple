export interface EventGoalInputs {
  current: number;
  target: number;
  dailyGain: number;
}

export interface EventGoalProgress extends EventGoalInputs {
  routineGain: number;
  creditedPeriods: string[];
  requirementComplete: boolean;
  rewardClaimed: boolean;
}

export function calculateEventGoal(inputs: EventGoalInputs, windowEnd: string, nowMs = Date.now()) {
  const endMs = Date.parse(windowEnd);
  const daysRemaining = Number.isFinite(endMs)
    ? Math.max(0, Math.ceil((endMs - nowMs) / 86_400_000))
    : 0;
  const current = Math.max(0, inputs.current || 0);
  const target = Math.max(0, inputs.target || 0);
  const dailyGain = Math.max(0, inputs.dailyGain || 0);
  const projected = current + dailyGain * daysRemaining;
  const remaining = Math.max(0, target - current);
  const requiredPerDay = daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : remaining;
  const recoveryDays = dailyGain > 0 && projected >= target
    ? Math.max(0, Math.floor((projected - target) / dailyGain))
    : 0;
  return {
    daysRemaining,
    projected,
    remaining,
    requiredPerDay,
    recoveryDays,
    onTrack: target > 0 && projected >= target,
  };
}

export function applyRoutineCredit(
  progress: EventGoalProgress,
  periodId: string,
  routineComplete: boolean,
): { progress: EventGoalProgress; credited: boolean } {
  if (!routineComplete || progress.routineGain <= 0 || progress.creditedPeriods.includes(periodId)) {
    return { progress, credited: false };
  }

  return {
    credited: true,
    progress: {
      ...progress,
      current: progress.current + progress.routineGain,
      creditedPeriods: [...progress.creditedPeriods, periodId],
    },
  };
}
