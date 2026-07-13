// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '@/i18n';
import { useVersion, VersionProvider } from './VersionContext';

function Probe() {
  const { version, setVersion } = useVersion();
  return (
    <div>
      <output>{version}</output>
      <button type="button" onClick={() => setVersion('jms')}>JMS</button>
      <button type="button" onClick={() => setVersion('tms')}>TMS</button>
    </div>
  );
}

describe('server selection', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('persists across provider consumers and follows the selected server language', async () => {
    const view = render(<VersionProvider><Probe /></VersionProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'JMS' }));

    expect(screen.getByText('jms')).toBeTruthy();
    await waitFor(() => expect(i18n.language).toBe('ja'));
    expect(document.documentElement.lang).toBe('ja');
    expect(localStorage.getItem('maplehub-game-version')).toBe('jms');

    view.unmount();
    render(<VersionProvider><Probe /></VersionProvider>);
    expect(screen.getByText('jms')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'TMS' }));
    await waitFor(() => expect(i18n.language).toBe('zh-Hant'));
    expect(localStorage.getItem('maplehub-language')).toBe('zh-Hant');
  });
});
