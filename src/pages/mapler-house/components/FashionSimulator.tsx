import { useMemo, useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';

type SlotKey = 'Hat' | 'Overall' | 'Cape' | 'Shoes' | 'Weapon';

type GameItem = {
  id: number;
  name: string;
  slot: SlotKey;
  rarity: 'Rare' | 'Epic' | 'Unique' | 'Legendary';
};

type OutfitPreset = {
  set: string;
  rarity: 'Epic' | 'Legendary';
  versions: string[];
  items: GameItem[];
};

const API_REGION = 'GMS';
const API_VERSION = '253';
const FALLBACK_ITEM_ID = 1252010;

const itemIcon = (id: number) => `https://maplestory.io/api/${API_REGION}/${API_VERSION}/item/${id}/icon`;
const characterImage = (items: GameItem[]) => {
  const itemIds = items.map((item) => item.id).join(',');
  return `https://maplestory.io/api/${API_REGION}/${API_VERSION}/character/center/2000/${itemIds}/stand1/0`;
};

const outfitPresets: OutfitPreset[] = [
  {
    set: 'Royal Maple Look',
    rarity: 'Legendary',
    versions: ['all'],
    items: [
      { id: 1003267, name: 'Royal Hair Band', slot: 'Hat', rarity: 'Epic' },
      { id: 1051294, name: 'Royal Overall', slot: 'Overall', rarity: 'Legendary' },
      { id: 1102481, name: 'Moonlight Cape', slot: 'Cape', rarity: 'Epic' },
      { id: 1072743, name: 'Ribbon Shoes', slot: 'Shoes', rarity: 'Rare' },
      { id: 1702224, name: 'Shining Weapon', slot: 'Weapon', rarity: 'Legendary' },
    ],
  },
  {
    set: 'Adventurer Casual',
    rarity: 'Epic',
    versions: ['all'],
    items: [
      { id: 1004808, name: 'Soft Cap', slot: 'Hat', rarity: 'Rare' },
      { id: 1053063, name: 'Casual Outfit', slot: 'Overall', rarity: 'Epic' },
      { id: 1102940, name: 'Travel Cape', slot: 'Cape', rarity: 'Epic' },
      { id: 1073158, name: 'Street Shoes', slot: 'Shoes', rarity: 'Rare' },
      { id: 1702608, name: 'Toy Weapon', slot: 'Weapon', rarity: 'Unique' },
    ],
  },
  {
    set: 'Festival Style',
    rarity: 'Legendary',
    versions: ['gms', 'kms', 'tms', 'jms', 'msea'],
    items: [
      { id: 1004424, name: 'Festival Hat', slot: 'Hat', rarity: 'Epic' },
      { id: 1052882, name: 'Festival Outfit', slot: 'Overall', rarity: 'Legendary' },
      { id: 1102730, name: 'Ribbon Cape', slot: 'Cape', rarity: 'Epic' },
      { id: 1073030, name: 'Festival Shoes', slot: 'Shoes', rarity: 'Rare' },
      { id: 1702478, name: 'Festival Weapon', slot: 'Weapon', rarity: 'Legendary' },
    ],
  },
];

const rarityClass: Record<GameItem['rarity'] | OutfitPreset['rarity'], string> = {
  Legendary: 'bg-accent-100 text-accent-700 border-accent-200',
  Unique: 'bg-primary-100 text-primary-700 border-primary-200',
  Epic: 'bg-secondary-100 text-secondary-800 border-secondary-200',
  Rare: 'bg-background-100 text-foreground-700 border-background-200',
};

const slotOrder: SlotKey[] = ['Hat', 'Overall', 'Cape', 'Shoes', 'Weapon'];

const imageFallback = (event: SyntheticEvent<HTMLImageElement>, fallbackSrc = itemIcon(FALLBACK_ITEM_ID)) => {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallbackSrc;
};

export default function FashionSimulator() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const presets = useMemo(
    () => outfitPresets.filter((preset) => isAvailableInVersion(preset.versions, version)),
    [version],
  );
  const [activePreset, setActivePreset] = useState(0);
  const [equipped, setEquipped] = useState<GameItem[]>(() => outfitPresets[0].items);
  const [pose, setPose] = useState<'stand1' | 'walk1' | 'alert'>('stand1');

  const activeSet = presets[activePreset] || presets[0] || outfitPresets[0];
  const inventory = useMemo(() => presets.flatMap((preset) => preset.items), [presets]);
  const equippedBySlot = useMemo(
    () => Object.fromEntries(equipped.map((item) => [item.slot, item])) as Partial<Record<SlotKey, GameItem>>,
    [equipped],
  );

  const equipItem = (item: GameItem) => {
    setEquipped((current) => [...current.filter((equippedItem) => equippedItem.slot !== item.slot), item]);
  };

  const equipPreset = (preset: OutfitPreset, index: number) => {
    setActivePreset(index);
    setEquipped(preset.items);
  };

  const avatarUrl = characterImage(equipped).replace('/stand1/', `/${pose}/`);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-5">
      <aside className="rounded-lg border border-background-200 bg-background-100 p-4 h-fit">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground-950">{t('mh_section_fashion')}</h3>
            <p className="mt-1 text-xs text-foreground-500">Live preview using MapleStory.io GMS v253 game assets.</p>
          </div>
          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${rarityClass[activeSet.rarity]}`}>
            {activeSet.rarity}
          </span>
        </div>

        <div className="mt-4 rounded-lg border border-background-200 bg-background-50 p-4">
          <div className="relative mx-auto h-56 w-full rounded-md bg-gradient-to-b from-sky-100 to-background-100 flex items-end justify-center overflow-hidden">
            <div className="absolute inset-x-0 bottom-0 h-12 bg-primary-100/40" />
            <img
              src={avatarUrl}
              alt="MapleStory character preview"
              className="relative z-10 max-h-52 object-contain image-render-auto"
              loading="lazy"
              onError={(event) => imageFallback(event, characterImage(outfitPresets[0].items).replace('/stand1/', `/${pose}/`))}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-md border border-background-200 bg-background-100 p-1">
            {(['stand1', 'walk1', 'alert'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPose(option)}
                className={`h-8 rounded text-xs font-semibold cursor-pointer ${
                  pose === option ? 'bg-primary-600 text-background-50' : 'text-foreground-700 hover:bg-background-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {slotOrder.map((slot) => {
            const item = equippedBySlot[slot];
            return (
              <div key={slot} className="flex items-center gap-3 rounded-md border border-background-200 bg-background-50 p-2">
                <div className="h-10 w-10 rounded-md border border-background-200 bg-background-100 flex items-center justify-center">
                  {item ? <img src={itemIcon(item.id)} alt={item.name} className="max-h-8 max-w-8 object-contain" loading="lazy" onError={imageFallback} /> : <i className="ri-question-line" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase text-foreground-500">{slot}</div>
                  <div className="truncate text-xs font-semibold text-foreground-900">{item?.name || 'Empty'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="space-y-5 min-w-0">
        <div>
          <h4 className="text-sm font-semibold text-foreground-900 mb-3 flex items-center gap-2">
            <i className="ri-t-shirt-line text-accent-600"></i>
            {t('mh_fashion_sets')}
          </h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {presets.map((preset, index) => (
              <button
                key={preset.set}
                type="button"
                onClick={() => equipPreset(preset, index)}
                className={`rounded-lg border bg-background-50 p-3 text-left transition-colors cursor-pointer ${
                  activePreset === index ? 'border-primary-400 ring-2 ring-primary-500/10' : 'border-background-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-semibold text-foreground-950">{preset.set}</h5>
                    <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${rarityClass[preset.rarity]}`}>
                      {preset.rarity}
                    </span>
                  </div>
                  <span className="text-xs text-foreground-500">{preset.items.length} {t('mh_fashion_pieces')}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {preset.items.map((item) => (
                    <span key={item.id} className="h-11 w-11 rounded-md border border-background-200 bg-background-100 flex items-center justify-center">
                      <img src={itemIcon(item.id)} alt={item.name} className="max-h-9 max-w-9 object-contain" loading="lazy" onError={imageFallback} />
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground-900 mb-3 flex items-center gap-2">
            <i className="ri-gift-2-line text-secondary-600"></i>
            {t('mh_fashion_items')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2">
            {inventory.map((item) => (
              <button
                key={`${item.slot}-${item.id}`}
                type="button"
                onClick={() => equipItem(item)}
                className={`rounded-lg border bg-background-50 p-3 text-left hover:border-primary-300 transition-colors cursor-pointer ${
                  equippedBySlot[item.slot]?.id === item.id ? 'border-primary-400 ring-2 ring-primary-500/10' : 'border-background-200'
                }`}
              >
                <div className="mx-auto h-16 w-16 rounded-md border border-background-200 bg-background-100 flex items-center justify-center">
                  <img src={itemIcon(item.id)} alt={item.name} className="max-h-12 max-w-12 object-contain" loading="lazy" onError={imageFallback} />
                </div>
                <div className="mt-2 text-xs font-semibold text-foreground-950 truncate">{item.name}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-foreground-500">{item.slot}</span>
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${rarityClass[item.rarity]}`}>{item.rarity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <a
          href="https://maples.im"
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-11 rounded-lg bg-accent-500 text-background-50 dark:text-foreground-950 text-sm font-semibold hover:bg-accent-600 transition-colors cursor-pointer"
        >
          <i className="ri-external-link-line"></i>
          {t('mh_external_tool')}: maples.im
        </a>
      </section>
    </div>
  );
}
