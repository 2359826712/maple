import type { TFunction } from 'i18next';
import type { VersionDefinition } from './regionModel';

const presentationKeys = {
  gms: { name: 'server_name_gms', region: 'server_region_gms' },
  kms: { name: 'server_name_kms', region: 'server_region_kms' },
  jms: { name: 'server_name_jms', region: 'server_region_jms' },
  tms: { name: 'server_name_tms', region: 'server_region_tms' },
  msea: { name: 'server_name_msea', region: 'server_region_msea' },
} as const;

export function getLocalizedVersionPresentation(version: VersionDefinition, t: TFunction) {
  const keys = presentationKeys[version.id];
  return {
    name: t(keys.name, { defaultValue: version.fullName }),
    region: t(keys.region, { defaultValue: version.region }),
  };
}
