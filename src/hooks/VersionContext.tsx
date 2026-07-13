/* eslint-disable react-refresh/only-export-components */
import { createContext, Fragment, useContext, useState, type ReactNode } from 'react';
import {
  getVersionDefinition,
  isGameVersion,
  versionDefinitions,
  type GameVersion,
  type VersionDefinition,
} from '@/domain/regionModel';

export type { GameVersion } from '@/domain/regionModel';
export type VersionInfo = VersionDefinition;
export const VERSIONS = versionDefinitions;

const VERSION_STORAGE_KEY = 'maplehub-game-version';

export function getVersionInfo(id: GameVersion): VersionInfo {
  return getVersionDefinition(id);
}

function getStoredVersion(): GameVersion {
  if (typeof window === 'undefined') return 'gms';

  const storedVersion = window.localStorage.getItem(VERSION_STORAGE_KEY);
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

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<GameVersion>(getStoredVersion);

  const setVersion = (nextVersion: GameVersion) => {
    setVersionState(nextVersion);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(VERSION_STORAGE_KEY, nextVersion);
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
