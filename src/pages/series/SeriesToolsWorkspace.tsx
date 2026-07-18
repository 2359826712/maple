import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';
import type { SeriesProduct } from './catalog';

type ToolDefinition = {
  title: string;
  description: string;
  tasks: string[];
  schedule?: Array<{ label: string; date: string }>;
};

const toolDefinitions: Record<string, ToolDefinition> = {
  'maplestory-classic': {
    title: 'Closed Online Test #2 readiness',
    description: 'Registration and test preparation based on the official Global MapleStory Classic World announcement.',
    schedule: [
      { label: 'Applications close', date: '2026-07-29' },
      { label: 'Test begins', date: '2026-08-04' },
      { label: 'Test ends', date: '2026-08-12' },
    ],
    tasks: [
      'Submitted a new Test #2 application',
      'Can access the email registered to the Nexon account',
      'Checked the account email for selection instructions',
      'Prepared a supported Windows or macOS device',
      'Reviewed the test wipe and non-final-content notice',
    ],
  },
  'maplestory-m': {
    title: 'MapleStory M update planner',
    description: 'A source-backed checklist for the current Global Forum patch and known-issues cycle.',
    tasks: [
      'Reviewed the latest patch notes',
      'Checked the current known-issues notice',
      'Verified Tutorial and Adventure Mission changes',
      'Reviewed Star Force Field changes before spending resources',
      'Recorded current event end dates',
    ],
  },
  'maplestory-n': {
    title: 'MapleStory N service checklist',
    description: 'Track official maintenance, known issues, and account-impact notices before the next session.',
    tasks: [
      'Checked the latest maintenance notice',
      'Reviewed the current known-issues list',
      'Checked Arcane Catalyst account measures',
      'Verified current event periods',
      'Reviewed official marketplace and probability information',
    ],
  },
  'maplestory-worlds': {
    title: 'Creator release checklist',
    description: 'A release planner based on the MapleStory Worlds Creator Center guides and policy notices.',
    tasks: [
      'Profiled world performance',
      'Tested multiplayer and network behavior',
      'Reviewed resource and avatar policy requirements',
      'Checked localization and display text',
      'Reviewed maintenance and sanction notices before publishing',
    ],
  },
  'maplestory-idle': {
    title: 'Idle RPG season planner',
    description: 'Track the systems and seasonal activities listed in the current official patch-note set.',
    tasks: [
      'Reviewed Hero\'s Journey progress',
      'Checked Water Balloon Collection progress',
      'Reviewed Summer Shop priorities',
      'Checked Arena Boost timing',
      'Recorded the current guild season dates',
    ],
  },
};

const storageKey = (seriesId: string) => `mpstorys-series-tools:${seriesId}`;

const readProgress = (seriesId: string, taskCount: number) => {
  const raw = readLocalStorage(storageKey(seriesId));
  if (!raw) return Array.from({ length: taskCount }, () => false);
  try {
    const parsed = JSON.parse(raw);
    return Array.from({ length: taskCount }, (_, index) => parsed[index] === true);
  } catch {
    return Array.from({ length: taskCount }, () => false);
  }
};

const daysUntil = (date: string) => Math.max(0, Math.ceil((Date.parse(`${date}T00:00:00Z`) - Date.now()) / 86_400_000));

export default function SeriesToolsWorkspace({ product }: { product: SeriesProduct }) {
  const definition = toolDefinitions[product.id];
  const { i18n } = useTranslation();
  const [completed, setCompleted] = useState<boolean[]>(() => (
    Array.from({ length: definition?.tasks.length || 0 }, () => false)
  ));
  const [localizedText, setLocalizedText] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!definition) return;
    setCompleted(readProgress(product.id, definition.tasks.length));
  }, [definition, product.id]);

  useEffect(() => {
    let active = true;
    setLocalizedText({});
    if (!definition) return () => { active = false; };
    const targetLanguage = normalizeStaticContentLanguage(i18n.language);
    if (targetLanguage === 'en') return () => { active = false; };
    const sourceTexts = [
      definition.title,
      definition.description,
      'Reset progress',
      'calendar days',
      ...definition.tasks,
      ...(definition.schedule || []).map((item) => item.label),
    ];
    void translateStaticTexts(sourceTexts, targetLanguage, { sourceLanguage: 'en' })
      .then((translations) => {
        if (!active) return;
        setLocalizedText(Object.fromEntries(sourceTexts.map((text, index) => [text, translations[index] || text])));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [definition, i18n.language]);

  const completedCount = completed.filter(Boolean).length;
  const percentage = completed.length ? Math.round((completedCount / completed.length) * 100) : 0;
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }), [i18n.language]);
  const copy = (value: string) => localizedText[value] || value;

  if (!definition) return null;

  const updateTask = (index: number, checked: boolean) => {
    const next = completed.map((value, taskIndex) => (taskIndex === index ? checked : value));
    setCompleted(next);
    writeLocalStorage(storageKey(product.id), JSON.stringify(next));
  };

  const reset = () => {
    const next = completed.map(() => false);
    setCompleted(next);
    writeLocalStorage(storageKey(product.id), JSON.stringify(next));
  };

  return (
    <section aria-labelledby="series-tool-heading" className="border-b border-background-300 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-primary-700">{product.name}</p>
          <h2 id="series-tool-heading" className="mt-1 font-heading text-2xl font-semibold md:text-3xl">
            {copy(definition.title)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-600">{copy(definition.description)}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          title={copy('Reset progress')}
          aria-label={copy('Reset progress')}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:border-primary-400 hover:text-primary-700"
        >
          <i className="ri-restart-line text-lg" aria-hidden="true" />
        </button>
      </div>

      {definition.schedule && (
        <div className="mt-6 grid border-y border-background-300 sm:grid-cols-3">
          {definition.schedule.map((item) => (
            <div key={item.label} className="border-b border-background-300 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <p className="text-xs font-semibold uppercase text-foreground-500">{copy(item.label)}</p>
              <p className="mt-1 font-heading text-lg font-semibold">
                {dateFormatter.format(new Date(`${item.date}T00:00:00Z`))}
              </p>
              <p className="mt-1 text-xs text-primary-700">{daysUntil(item.date)} {copy('calendar days')}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-background-200" aria-hidden="true">
          <div className="h-full bg-primary-600 transition-[width]" style={{ width: `${percentage}%` }} />
        </div>
        <span className="w-20 text-right text-sm font-semibold" aria-live="polite">
          {completedCount}/{completed.length}
        </span>
      </div>

      <div className="mt-4 divide-y divide-background-300 border-y border-background-300">
        {definition.tasks.map((task, index) => (
          <label key={task} className="flex cursor-pointer items-center gap-3 py-3.5 text-sm leading-6">
            <input
              type="checkbox"
              checked={completed[index] || false}
              onChange={(event) => updateTask(index, event.target.checked)}
              className="h-4 w-4 shrink-0 accent-primary-600"
            />
            <span className={completed[index] ? 'text-foreground-400 line-through' : 'text-foreground-800'}>
              {copy(task)}
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
