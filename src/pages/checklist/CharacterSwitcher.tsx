import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CharacterProfile } from '@/hooks/useCharacters';

interface CharacterSwitcherProps {
  characters: CharacterProfile[];
  activeCharId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (char: CharacterProfile) => void;
  onDelete: (id: string) => void;
}

export default function CharacterSwitcher({
  characters,
  activeCharId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: CharacterSwitcherProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  if (characters.length === 0) {
    return (
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-background-300 bg-white px-4 py-2.5 text-sm text-foreground-600 transition hover:border-primary-600 hover:text-primary-600"
        >
          <i className="ri-user-add-line text-base"></i>
          {t('char_create_first')}
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {characters.map((char) => (
        <div key={char.id} className="relative">
          <button
            type="button"
            onClick={() => onSelect(char.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              char.id === activeCharId
                ? 'border-primary-600 bg-primary-50 font-semibold text-primary-600'
                : 'border-background-300 bg-white text-foreground-950 hover:border-primary-600 hover:bg-background-50'
            }`}
          >
            <i className="ri-user-line text-base"></i>
            <span>{char.name}</span>
            {char.className && (
              <span className="text-xs text-foreground-600">({char.className})</span>
            )}
            {char.level > 1 && (
              <span className="text-xs text-foreground-600">Lv.{char.level}</span>
            )}
          </button>
          {char.id === activeCharId && (
            <button
              type="button"
              onClick={() => setMenuOpen(menuOpen === char.id ? null : char.id)}
              aria-label="More options"
              className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background-100 text-xs text-foreground-600 hover:bg-primary-600 hover:text-white"
            >
              <i className="ri-more-2-fill text-[10px]"></i>
            </button>
          )}
          {menuOpen === char.id && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded border border-background-300 bg-white py-1 shadow-md">
              <button
                type="button"
                onClick={() => { onEdit(char); setMenuOpen(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground-950 hover:bg-background-100"
              >
                <i className="ri-edit-line text-xs"></i>
                {t('char_edit_btn')}
              </button>
              <button
                type="button"
                onClick={() => { onDelete(char.id); setMenuOpen(null); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <i className="ri-delete-bin-line text-xs"></i>
                {t('char_delete_btn')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
