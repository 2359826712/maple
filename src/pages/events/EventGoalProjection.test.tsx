// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VersionProvider } from '@/hooks/VersionContext';
import { routineTasks, setRoutineComplete } from '@/domain/routineTasks';
import { EVENT_GOALS_STORAGE_KEY } from '@/services/eventGoals';
import i18n from '@/i18n';
import EventGoalProjection from './EventGoalProjection';

const eventId = 'gms:event-one';
const renderGoal = () => render(
  <VersionProvider>
    <EventGoalProjection
      id={eventId}
      name="Golden Week"
      version="gms"
      windowEnd={new Date(Date.now() + 5 * 86_400_000).toISOString()}
    />
  </VersionProvider>,
);

describe('EventGoalProjection integration', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(cleanup);

  it('credits the linked attendance routine once per daily period', async () => {
    localStorage.setItem(EVENT_GOALS_STORAGE_KEY, JSON.stringify({
      [eventId]: {
        id: eventId,
        name: 'Golden Week',
        windowEnd: new Date(Date.now() + 5 * 86_400_000).toISOString(),
        current: 25,
        target: 1_000,
        dailyGain: 100,
        routineGain: 50,
        creditedPeriods: [],
        requirementComplete: false,
        rewardClaimed: false,
      },
    }));
    const attendance = routineTasks.find((task) => task.id === 'event-attendance')!;
    const routineState = setRoutineComplete(
      { selectedIds: ['event-attendance'], completedPeriods: {} },
      attendance,
      'gms',
      null,
      true,
    );
    localStorage.setItem('maplehub-routine-tasks:v1', JSON.stringify(routineState));

    const first = renderGoal();
    await waitFor(() => expect((screen.getByLabelText('Current currency') as HTMLInputElement).value).toBe('75'));
    first.unmount();
    renderGoal();
    await waitFor(() => expect((screen.getByLabelText('Current currency') as HTMLInputElement).value).toBe('75'));
  });

  it('keeps requirement completion distinct from reward claiming', () => {
    renderGoal();
    const requirement = screen.getByRole('button', { name: 'Requirement complete' });
    const claim = screen.getByRole('button', { name: 'Reward claimed' });

    expect(claim.hasAttribute('disabled')).toBe(true);
    fireEvent.click(requirement);
    expect(screen.getByText('Requirement complete — remember to claim the reward.')).toBeTruthy();
    expect(claim.hasAttribute('disabled')).toBe(false);
    fireEvent.click(claim);
    expect(screen.getByText('Finished and claimed.')).toBeTruthy();
  });
});
