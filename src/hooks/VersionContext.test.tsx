// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import i18n from '@/i18n';
import { useVersion, VersionProvider } from './VersionContext';

function Probe() {
  const { version, setVersion } = useVersion();
  return (
    <div>
      <output>{version}</output>
      <button type="button" onClick={() => setVersion('gms')}>GMS</button>
      <button type="button" onClick={() => setVersion('jms')}>JMS</button>
      <button type="button" onClick={() => setVersion('tms')}>TMS</button>
    </div>
  );
}

function ServerModuleProbe() {
  const { version } = useVersion();
  const [loadedForVersion] = useState(version);
  return <output aria-label="loaded module server">{loadedForVersion} module content</output>;
}

describe('server selection', () => {
  beforeEach(async () => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    await i18n.changeLanguage('en');
  });

  afterEach(() => cleanup());

  it('persists the selected server without changing the interface language', async () => {
    const view = render(<VersionProvider><Probe /></VersionProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'JMS' }));

    expect(screen.getByText('jms')).toBeTruthy();
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(document.documentElement.lang).not.toBe('ja');
    expect(localStorage.getItem('maplehub-game-version')).toBe('jms');
    expect(localStorage.getItem('maplehub-language')).toBeNull();
    expect(localStorage.getItem('i18nextLng')).toBe('en');

    view.unmount();
    render(<VersionProvider><Probe /></VersionProvider>);
    expect(screen.getByText('jms')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'TMS' }));
    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(localStorage.getItem('maplehub-game-version')).toBe('tms');
    expect(localStorage.getItem('maplehub-language')).toBeNull();
  });

  it('remounts every server-related module when switching away from KMS', () => {
    localStorage.setItem('maplehub-game-version', 'kms');

    render(
      <VersionProvider>
        <Probe />
        <ServerModuleProbe />
      </VersionProvider>,
    );

    expect(screen.getByLabelText('loaded module server').textContent).toBe('kms module content');
    fireEvent.click(screen.getByRole('button', { name: 'GMS' }));
    expect(screen.getByLabelText('loaded module server').textContent).toBe('gms module content');
  });

  it('uses and updates the static server URL suffix', () => {
    window.history.replaceState({}, '', '/news/ja/JMS');
    render(<VersionProvider><Probe /></VersionProvider>);

    expect(screen.getByText('jms')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'GMS' }));
    expect(window.location.pathname).toBe('/news/ja/GMS');
  });
});
