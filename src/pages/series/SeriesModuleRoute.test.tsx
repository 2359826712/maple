// @vitest-environment jsdom

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import translation from '@/i18n/local/en/common';
import NextApplication from '@/next/NextApplication';

vi.mock('@/services/mapleSqlApi', () => ({
  mapleSqlApi: {
    auth: {
      me: vi.fn().mockResolvedValue(null),
      refresh: vi.fn().mockResolvedValue(null),
    },
    notifications: {
      list: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe('series module routes', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/wiki/en/GMS?series=maplestory-n');
    window.localStorage.setItem('maplehub-tool-favorites', JSON.stringify({ legacy: [] }));
  });

  it('renders a non-PC series module without falling into the application error boundary', async () => {
    render(
      <NextApplication
        language="en"
        pathname="/wiki/en/GMS"
        requestPath="/wiki/en/GMS?series=maplestory-n"
        server="gms"
        translation={translation}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Wiki' })).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText('MPStorys hit an unexpected error')).toBeNull();
    });
  });
});
