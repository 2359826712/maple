/* eslint-disable react-refresh/only-export-components */
import { createContext, Fragment, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getVersionDefinition,
  isGameVersion,
  versionDefinitions,
  type GameVersion,
  type VersionDefinition,
} from '@/domain/regionModel';
import { getPathServer, withServerSuffix } from '@/i18n/languageRouting';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';

export type { GameVersion } from '@/domain/regionModel';
export type VersionInfo = VersionDefinition;
export const VERSIONS = versionDefinitions;

const VERSION_STORAGE_KEY = 'maplehub-game-version';

export function getVersionInfo(id: GameVersion): VersionInfo {
  return getVersionDefinition(id);
}

function getStoredVersion(): GameVersion {
  if (typeof window === 'undefined') return 'gms';

  const pathVersion = getPathServer(window.location.pathname);
  if (pathVersion) return pathVersion;
  const storedVersion = readLocalStorage(VERSION_STORAGE_KEY);
  return isGameVersion(storedVersion) ? storedVersion : 'gms';
}

interface VersionContextType {
  version: GameVersion;
  versionInfo: VersionInfo;
  setVersion: (v: GameVersion) => void;
}

const VersionContext = createContext<VersionContextType>({
  version: 'gms',
  versionInfo: getVersionDefinition('gms'),
  setVersion: () => {},
});

export function useVersion() {
  return useContext(VersionContext);
}

export function VersionProvider({
  children,
  initialVersion,
}: {
  children: ReactNode;
  initialVersion?: GameVersion;
}) {
  const [version, setVersionState] = useState<GameVersion>(() => initialVersion || getStoredVersion());

  useEffect(() => {
    const syncVersionFromPath = () => {
      const pathVersion = getPathServer(window.location.pathname);
      if (!pathVersion) return;
      setVersionState((current) => current === pathVersion ? current : pathVersion);
      writeLocalStorage(VERSION_STORAGE_KEY, pathVersion);
      document.documentElement.dataset.server = pathVersion;
    };

    syncVersionFromPath();
    window.addEventListener('popstate', syncVersionFromPath);
    return () => window.removeEventListener('popstate', syncVersionFromPath);
  }, []);

  const setVersion = (nextVersion: GameVersion) => {
    setVersionState(nextVersion);
    if (typeof window !== 'undefined') {
      writeLocalStorage(VERSION_STORAGE_KEY, nextVersion);
      document.documentElement.dataset.server = nextVersion;
      const nextPathname = withServerSuffix(window.location.pathname, nextVersion);
      const nextUrl = `${nextPathname}${window.location.search}${window.location.hash}`;
      if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextUrl) {
        window.history.replaceState(window.history.state, '', nextUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  const value: VersionContextType = {
    version,
    versionInfo: getVersionInfo(version),
    setVersion,
  };

  return (
    <VersionContext.Provider value={value}>
      <Fragment key={version}>{children}</Fragment>
    </VersionContext.Provider>
  );
}

export default VersionContext;
