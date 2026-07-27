import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeStaticContentLanguage, translateStaticTexts } from '@/services/staticTranslation';
import type { SeriesModule } from './scope';

type Section = { title: string; items: string[] };

const schedule = [
  { label: 'Applications close', date: '2026-07-29' },
  { label: 'Closed Test #2 begins', date: '2026-08-04' },
  { label: 'Closed Test #2 ends', date: '2026-08-12' },
];

const guideSections: Section[] = [
  {
    title: 'Application and access',
    items: [
      'Every player must submit a new Test #2 application, including participants from the first test.',
      'Selected players receive access instructions through the email registered to their Nexon account.',
      'Applications close July 29, 2026.',
    ],
  },
  {
    title: 'Platforms and controls',
    items: [
      'The second test includes Windows and macOS support.',
      'Controller support includes customizable layouts.',
      'The test adds more language options than the first closed test.',
    ],
  },
  {
    title: 'Test #2 content',
    items: [
      'The preview adds 3rd Job Advancement.',
      'Ossyria expands with Orbis and El Nath.',
      'Characters and progress are wiped after the test, and test content is not final.',
    ],
  },
];

const preparationSteps = [
  'Submit a fresh Test #2 application before the July 29 deadline, even if you joined the first test.',
  'Check the email address registered to the Nexon account because selected players receive access instructions there.',
  'Prepare a supported Windows or macOS computer and decide whether to use keyboard controls or a customizable controller layout.',
  'Use the limited test window to examine 3rd Job Advancement, Orbis, El Nath, language options, and the changes made after the first test.',
  'Treat every character and item as temporary because all test progress is wiped after August 12.',
];

const wikiFacts = [
  ['Product', 'Global MapleStory Classic World'],
  ['Current phase', 'Closed Online Test #2'],
  ['Test dates', 'August 4-12, 2026'],
  ['New progression', '3rd Job Advancement'],
  ['New areas', 'Orbis and El Nath'],
  ['Platforms', 'Windows and macOS'],
  ['Persistence', 'Test characters and progress will be wiped'],
];

const workspaceText = [
  ...schedule.flatMap((item) => [item.label]),
  ...guideSections.flatMap((section) => [section.title, ...section.items]),
  ...preparationSteps,
  ...wikiFacts.flat(),
  'Official Test #2 schedule',
  'Dates announced by Global MapleStory for the second closed online test.',
  'Test preparation guide',
  'Source-backed participation, platform, and content information.',
  'Closed Online Test #2 event window',
  'The current announced Classic World event is the second closed online test.',
  'Classic World reference',
  'Verified product facts from the Test #2 announcement.',
  'What the announced schedule includes',
  'Preparation order',
];

function SectionGrid({ sections, copy }: { sections: Section[]; copy: (value: string) => string }) {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <section
          key={section.title}
          className="rounded-xl border border-background-300 bg-background-100 p-5"
          aria-labelledby={`classic-${section.title.replaceAll(' ', '-').toLowerCase()}`}
        >
          <h3 id={`classic-${section.title.replaceAll(' ', '-').toLowerCase()}`} className="font-heading text-lg font-semibold">
            {copy(section.title)}
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground-600">
            {section.items.map((item) => (
              <li key={item} className="flex gap-2.5">
                <i className="ri-checkbox-circle-line mt-0.5 shrink-0 text-primary-600" aria-hidden="true" />
                <span>{copy(item)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function ClassicModuleWorkspace({ module }: { module: SeriesModule }) {
  const { i18n } = useTranslation();
  const [localizedText, setLocalizedText] = useState<Record<string, string>>({});
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }), [i18n.language]);

  useEffect(() => {
    let active = true;
    setLocalizedText({});
    const targetLanguage = normalizeStaticContentLanguage(i18n.language);
    if (targetLanguage === 'en') return () => { active = false; };
    void translateStaticTexts(workspaceText, targetLanguage, { sourceLanguage: 'en' })
      .then((translations) => {
        if (!active) return;
        setLocalizedText(Object.fromEntries(workspaceText.map((text, index) => [text, translations[index] || text])));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [i18n.language]);

  const copy = (value: string) => localizedText[value] || value;

  if (module === 'upcoming' || module === 'events') {
    const title = module === 'events' ? 'Closed Online Test #2 event window' : 'Official Test #2 schedule';
    const description = module === 'events'
      ? 'The current announced Classic World event is the second closed online test.'
      : 'Dates announced by Global MapleStory for the second closed online test.';
    return (
      <section className="border-b border-background-300 pb-10" aria-labelledby="classic-schedule-heading">
        <h2 id="classic-schedule-heading" className="font-heading text-2xl font-semibold">{copy(title)}</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{copy(description)}</p>
        <div className="mt-6 divide-y divide-background-300 border-y border-background-300">
          {schedule.map((item) => (
            <div key={item.label} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
              <span className="text-sm font-semibold text-foreground-800">{copy(item.label)}</span>
              <time className="text-sm text-primary-700" dateTime={item.date}>
                {dateFormatter.format(new Date(`${item.date}T00:00:00Z`))}
              </time>
            </div>
          ))}
        </div>
        <h3 className="mt-9 font-heading text-xl font-semibold">{copy('What the announced schedule includes')}</h3>
        <SectionGrid sections={guideSections} copy={copy} />
      </section>
    );
  }

  if (module === 'guides') {
    return (
      <section className="border-b border-background-300 pb-10" aria-labelledby="classic-guide-heading">
        <h2 id="classic-guide-heading" className="font-heading text-2xl font-semibold">{copy('Test preparation guide')}</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{copy('Source-backed participation, platform, and content information.')}</p>
        <SectionGrid sections={guideSections} copy={copy} />
        <section className="mt-8 rounded-xl border border-primary-200 bg-primary-50 p-5" aria-labelledby="classic-preparation-order">
          <h3 id="classic-preparation-order" className="font-heading text-xl font-semibold">{copy('Preparation order')}</h3>
          <ol className="mt-4 grid gap-4 md:grid-cols-2">
            {preparationSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-foreground-700">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>{copy(step)}</span>
              </li>
            ))}
          </ol>
        </section>
      </section>
    );
  }

  if (module === 'wiki') {
    return (
      <section className="border-b border-background-300 pb-10" aria-labelledby="classic-wiki-heading">
        <h2 id="classic-wiki-heading" className="font-heading text-2xl font-semibold">{copy('Classic World reference')}</h2>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{copy('Verified product facts from the Test #2 announcement.')}</p>
        <dl className="mt-6 divide-y divide-background-300 border-y border-background-300">
          {wikiFacts.map(([label, value]) => (
            <div key={label} className="grid gap-1 py-3.5 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-6">
              <dt className="text-xs font-semibold uppercase text-foreground-500">{copy(label)}</dt>
              <dd className="text-sm text-foreground-800">{copy(value)}</dd>
            </div>
          ))}
        </dl>
        <SectionGrid sections={guideSections} copy={copy} />
      </section>
    );
  }

  return null;
}
