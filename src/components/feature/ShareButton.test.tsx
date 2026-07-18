// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ShareButton from './ShareButton';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ShareButton', () => {
  it('uses the native share sheet with an absolute internal URL', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    render(<ShareButton title="Lotus guide" text="Boss mechanics" url="/guides/lotus" />);
    fireEvent.click(screen.getByRole('button', { name: 'share_action' }));

    await waitFor(() => expect(share).toHaveBeenCalledWith({
      title: 'Lotus guide',
      text: 'Boss mechanics',
      url: 'http://localhost:3000/guides/lotus?utm_source=maplehub&utm_medium=share',
    }));
  });

  it('copies the link when the native share sheet is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    render(<ShareButton title="Event" url="/events?goal=kms%3Aevent" />);
    fireEvent.click(screen.getByRole('button', { name: 'share_action' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:3000/events?goal=kms%3Aevent&utm_source=maplehub&utm_medium=share'));
    expect(screen.getByRole('button', { name: 'share_copied' })).toBeTruthy();
  });
});
