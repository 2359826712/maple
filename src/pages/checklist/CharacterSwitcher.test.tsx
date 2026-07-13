// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import CharacterSwitcher from './CharacterSwitcher';

const character = {
  id: 'local-1',
  name: 'AranMain',
  className: 'Aran',
  level: 260,
  server: 'GMS',
  world: 'Kronos',
  isDefault: true,
};

describe('CharacterSwitcher deletion safety', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('requires explicit confirmation before deleting a character', () => {
    const onDelete = vi.fn();
    render(
      <CharacterSwitcher
        characters={[character]}
        activeCharId={character.id}
        onSelect={vi.fn()}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));

    expect(onDelete).not.toHaveBeenCalled();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete AranMain?' });
    expect(dialog).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'More options' }));
    fireEvent.click(screen.getByRole('button', { name: /Delete/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Delete$/ }));

    expect(onDelete).toHaveBeenCalledWith(character.id);
  });
});
