import { useEffect, useState } from 'react';
import { EVENT_GOALS_CHANGED_EVENT, readEventGoals } from '@/services/eventGoals';

export function useEventGoals() {
  const [goals, setGoals] = useState(readEventGoals);

  useEffect(() => {
    const refresh = () => setGoals(readEventGoals());
    window.addEventListener('storage', refresh);
    window.addEventListener(EVENT_GOALS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(EVENT_GOALS_CHANGED_EVENT, refresh);
    };
  }, []);

  return Object.values(goals);
}
