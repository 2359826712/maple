import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { CharacterProfile } from '@/hooks/useCharacters';

const MAPLE_CLASSES = [
  'Hero', 'Paladin', 'Dark Knight', 'Bishop', 'Arch Mage (I/L)', 'Arch Mage (F/P)',
  'Bowmaster', 'Marksman', 'Pathfinder', 'Night Lord', 'Shadower', 'Dual Blade',
  'Buccaneer', 'Corsair', 'Cannoneer',
  'Dawn Warrior', 'Blaze Wizard', 'Wind Archer', 'Night Walker', 'Thunder Breaker', 'Mihile',
  'Aran', 'Evan', 'Mercedes', 'Phantom', 'Luminous', 'Shade',
  'Demon Slayer', 'Demon Avenger', 'Battle Mage', 'Wild Hunter', 'Mechanic', 'Blaster', 'Xenon',
  'Kaiser', 'Angelic Buster', 'Cadena', 'Kain',
  'Adele', 'Illium', 'Ark', 'Khali',
  'Hoyoung', 'Lara', 'Ren',
  'Kanna', 'Hayato',
  'Lynn', 'Mo Xuan',
  'Zero', 'Kinesis',
  'Sia Astelle', 'Erel Light',
];

interface CharacterFormDialogProps {
  open: boolean;
  editing: CharacterProfile | null;
  onClose: () => void;
  onSave: (input: Omit<CharacterProfile, 'id' | 'isDefault'>) => void;
}

export default function CharacterFormDialog({
  open,
  editing,
  onClose,
  onSave,
}: CharacterFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(editing?.name ?? '');
  const [className, setClassName] = useState(editing?.className ?? '');
  const [level, setLevel] = useState(editing?.level ?? 1);
  const [server, setServer] = useState(editing?.server ?? 'GMS');
  const [world, setWorld] = useState(editing?.world ?? '');

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>(
        'input, select, button, textarea, [tabindex]:not([tabindex="-1"])',
      );
      el?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), className, level, server, world });
    onClose();
  };

  return (
    <div ref={dialogRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true" aria-labelledby="character-form-dialog-title" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border border-background-300 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="character-form-dialog-title" className="mb-4 text-lg font-semibold text-foreground-950">
          {editing ? t('char_edit') : t('char_add')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-950">
              {t('char_name_label')} *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('char_name_placeholder')}
              className="w-full border border-background-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-950">
              {t('char_class_label')}
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full border border-background-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600"
            >
              <option value="">{t('char_class_placeholder')}</option>
              {MAPLE_CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-950">
                {t('char_level_label')}
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value) || 1)}
                className="w-full border border-background-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground-950">
                {t('char_server_label')}
              </label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full border border-background-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600"
              >
                {['GMS', 'KMS', 'MSEA', 'JMS', 'TMS'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground-950">
              {t('char_world_label')}
            </label>
            <input
              value={world}
              onChange={(e) => setWorld(e.target.value)}
              placeholder="e.g. Scania, Luna"
              className="w-full border border-background-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-background-300 bg-white px-4 py-2 text-sm text-foreground-950 hover:bg-background-100"
            >
              {t('char_cancel')}
            </button>
            <button
              type="submit"
              className="rounded bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
            >
              {t('char_save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
