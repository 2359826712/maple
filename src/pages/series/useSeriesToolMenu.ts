import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { NavbarToolMenu, ToolMenuOption } from '@/pages/home/components/Navbar';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref } from '@/i18n/languageRouting';
import { readLocalStorage, writeLocalStorage } from '@/services/browserStorage';
import { getSeriesProduct } from './catalog';
import { getSeriesModuleHref, getSeriesResourceHref } from './scope';
import {
  getVerifiedSeriesResources,
  getVerifiedSeriesResourceSlug,
} from './verifiedContent';
import { getResourceToolKind } from './resourceToolRegistry';

type MenuGroup = 'character' | 'progression' | 'build' | 'meta';

const groupLabelKeys: Record<MenuGroup, string> = {
  character: 'mh_tool_group_character',
  progression: 'mh_tool_group_progression',
  build: 'mh_tool_group_build',
  meta: 'mh_tool_group_meta',
};

const groupOrder: MenuGroup[] = ['character', 'progression', 'build', 'meta'];

const resolveGroup = (subcategory = ''): MenuGroup => {
  if (subcategory.includes('character')) return 'character';
  if (
    subcategory.includes('experience')
    || subcategory.includes('progression')
    || subcategory.includes('quest')
    || subcategory.includes('route')
    || subcategory.includes('training')
    || subcategory.includes('arcane-symbol')
    || subcategory.includes('hero-power')
  ) return 'progression';
  if (
    subcategory.includes('equipment')
    || subcategory.includes('cube')
    || subcategory.includes('flame')
    || subcategory.includes('star-force')
    || subcategory.includes('stat')
    || subcategory.includes('v-matrix')
    || subcategory.includes('hyper')
    || subcategory.includes('scroll')
  ) return 'build';
  return 'meta';
};

const toolIcons = {
  combat: 'ri-sword-line',
  comparison: 'ri-scales-3-line',
  material: 'ri-stack-line',
  probability: 'ri-dice-line',
  progress: 'ri-line-chart-line',
  reward: 'ri-gift-line',
  tracker: 'ri-list-check-3',
} as const;

const readFavorites = (storageKey: string) => {
  const stored = readLocalStorage(storageKey);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
};

export const useSeriesToolMenu = (
  seriesId?: string,
  activeResourceId?: string,
  isToolModule = false,
): NavbarToolMenu | undefined => {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const navigate = useNavigate();
  const product = getSeriesProduct(seriesId);
  const storageKey = `mpstorys-series-tool-favorites:${seriesId || 'unknown'}`;
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites(storageKey));
  }, [storageKey]);

  const resources = useMemo(
    () => seriesId ? getVerifiedSeriesResources(seriesId, 'tools') : [],
    [seriesId],
  );
  const resourceById = useMemo(
    () => new Map(resources.flatMap((resource) => (
      resource.resourceId ? [[resource.resourceId, resource] as const] : []
    ))),
    [resources],
  );

  const options = useMemo<ToolMenuOption[]>(() => {
    if (!product || !seriesId) return [];
    const workspace = {
      value: 'series-workspace',
      label: `${product.name} ${t('nav_checklist')}`,
      icon: 'ri-list-check-3',
      favorite: favorites.includes('series-workspace'),
      groupLabel: t(groupLabelKeys.progression),
      group: 'progression' as MenuGroup,
    };
    const resourceOptions = resources
      .flatMap((resource) => {
        if (!resource.resourceId) return [];
        const kind = getResourceToolKind(resource);
        if (!kind) return [];
        const group = resolveGroup(resource.resourceRecord?.subcategory || '');
        return [{
          value: resource.resourceId,
          label: resource.title,
          icon: toolIcons[kind],
          favorite: favorites.includes(resource.resourceId),
          groupLabel: t(groupLabelKeys[group]),
          group,
        }];
      });
    return [workspace, ...resourceOptions]
      .sort((left, right) => {
        const groupDifference = groupOrder.indexOf(left.group) - groupOrder.indexOf(right.group);
        return groupDifference || left.label.localeCompare(right.label, i18n.language);
      })
      .map(({ group: _group, ...option }) => option);
  }, [favorites, i18n.language, product, resources, seriesId, t]);

  if (!product || !seriesId || seriesId === 'maplestory-pc') return undefined;

  return {
    label: t('mh_tool_jump'),
    value: activeResourceId || (isToolModule ? 'series-workspace' : ''),
    allLabel: t('mh_tool_menu_all'),
    favoritesLabel: t('mh_tool_menu_favorites'),
    emptyFavoritesLabel: t('mh_no_favorites'),
    options,
    favoriteOptions: options.filter((option) => option.favorite),
    onSelect: (value) => {
      const resource = resourceById.get(value);
      const href = resource
        ? getSeriesResourceHref(seriesId, 'tools', getVerifiedSeriesResourceSlug(resource))
        : `${getSeriesModuleHref(seriesId, 'tools')}#series-tool-heading`;
      navigate(localizeHref(href, i18n.language, versionInfo.id));
    },
    onToggleFavorite: (value) => {
      setFavorites((current) => {
        const next = current.includes(value)
          ? current.filter((item) => item !== value)
          : [value, ...current];
        writeLocalStorage(storageKey, JSON.stringify(next));
        return next;
      });
    },
  };
};
