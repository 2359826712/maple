/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

export type GameVersion = 'gms' | 'kms' | 'msea' | 'jms' | 'cms' | 'tms';

export interface VersionInfo {
  id: GameVersion;
  name: string;
  fullName: string;
  region: string;
  shortLabel: string;
}

export const VERSIONS: VersionInfo[] = [
  { id: 'gms', name: 'GMS', fullName: 'Global MapleStory', region: 'Global', shortLabel: 'GMS' },
  { id: 'kms', name: 'KMS', fullName: '한국 메이플스토리', region: 'Korea', shortLabel: 'KMS' },
  { id: 'msea', name: 'MSEA', fullName: 'MapleStory SEA', region: 'SE Asia', shortLabel: 'MSEA' },
  { id: 'jms', name: 'JMS', fullName: '日本メイプルストーリー', region: 'Japan', shortLabel: 'JMS' },
  { id: 'cms', name: 'CMS', fullName: '冒险岛 online', region: 'China', shortLabel: 'CMS' },
  { id: 'tms', name: 'TMS', fullName: '新楓之谷', region: 'Taiwan', shortLabel: 'TMS' },
];

export function getVersionInfo(id: GameVersion): VersionInfo {
  return VERSIONS.find((v) => v.id === id) || VERSIONS[0];
}

interface VersionContextType {
  version: GameVersion;
  versionInfo: VersionInfo;
  setVersion: (v: GameVersion) => void;
}

const VersionContext = createContext<VersionContextType>({
  version: 'gms',
  versionInfo: VERSIONS[0],
  setVersion: () => {},
});

export function useVersion() {
  return useContext(VersionContext);
}

export function VersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<GameVersion>('gms');

  const value: VersionContextType = {
    version,
    versionInfo: getVersionInfo(version),
    setVersion,
  };

  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  );
}

export default VersionContext;
