// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';
import RouteLoadingFallback from './RouteLoadingFallback';

describe('RouteLoadingFallback', () => {
  afterEach(() => cleanup());

  it('announces route loading without exposing an empty page', async () => {
    await i18n.changeLanguage('en');
    render(
      <I18nextProvider i18n={i18n}>
        <RouteLoadingFallback />
      </I18nextProvider>,
    );

    expect(screen.getByRole('status').textContent).toContain('Loading page');
  });
});
