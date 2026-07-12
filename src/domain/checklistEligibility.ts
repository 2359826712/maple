export interface LevelEligibleTask {
  minLevel: number;
}

export const isTaskEligibleForLevel = (level: number, task: LevelEligibleTask) =>
  Number.isInteger(level) && level >= task.minLevel;

export const eligibleTasksForLevel = <T extends LevelEligibleTask>(tasks: readonly T[], level: number) =>
  tasks.filter((task) => isTaskEligibleForLevel(level, task));
