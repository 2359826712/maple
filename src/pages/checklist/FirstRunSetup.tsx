import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { VERSIONS, type GameVersion } from '@/hooks/VersionContext';

export interface FirstRunSetupValue {
  version: GameVersion;
  name: string;
  level: number;
}

interface FirstRunSetupProps {
  initialVersion: GameVersion;
  onComplete: (value: FirstRunSetupValue) => void;
}

export default function FirstRunSetup({ initialVersion, onComplete }: FirstRunSetupProps) {
  const { t } = useTranslation();
  const [version, setVersion] = useState<GameVersion>(initialVersion);
  const [name, setName] = useState('');
  const [level, setLevel] = useState(1);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName || !Number.isInteger(level) || level < 1 || level > 300) return;
    onComplete({ version, name: normalizedName, level });
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-xl items-center px-4 py-8" aria-labelledby="daily-setup-title">
      <div className="w-full rounded-xl border border-background-300 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-xl text-primary-600" aria-hidden="true">
          <i className="ri-calendar-check-line" />
        </div>
        <h1 id="daily-setup-title" className="font-heading text-2xl font-semibold text-foreground-950">
          {t('daily_setup_title')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-foreground-600">{t('daily_setup_description')}</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="daily-setup-version" className="mb-1 block text-sm font-medium text-foreground-950">
              {t('daily_setup_version')}
            </label>
            <select
              id="daily-setup-version"
              value={version}
              onChange={(event) => setVersion(event.target.value as GameVersion)}
              className="h-11 w-full rounded border border-background-300 bg-white px-3 text-sm focus:border-primary-600"
              required
            >
              {VERSIONS.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="daily-setup-name" className="mb-1 block text-sm font-medium text-foreground-950">
              {t('daily_setup_name')}
            </label>
            <input
              id="daily-setup-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              autoComplete="off"
              autoFocus
              required
              className="h-11 w-full rounded border border-background-300 bg-white px-3 text-sm focus:border-primary-600"
            />
          </div>
          <div>
            <label htmlFor="daily-setup-level" className="mb-1 block text-sm font-medium text-foreground-950">
              {t('daily_setup_level')}
            </label>
            <input
              id="daily-setup-level"
              type="number"
              min={1}
              max={300}
              step={1}
              value={level}
              onChange={(event) => setLevel(event.target.valueAsNumber || 1)}
              required
              className="h-11 w-full rounded border border-background-300 bg-white px-3 text-sm focus:border-primary-600"
            />
          </div>
          <button type="submit" className="h-11 w-full rounded bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700">
            {t('daily_setup_submit')}
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-foreground-500">{t('daily_setup_privacy')}</p>
      </div>
    </section>
  );
}
