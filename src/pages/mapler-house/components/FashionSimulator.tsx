import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fashionSimOutfits, fashionItems } from '@/mocks/mapler-house';
import { useVersion } from '@/hooks/VersionContext';

export default function FashionSimulator() {
  const { t } = useTranslation();
  const { version } = useVersion();
  const [selectedSet, setSelectedSet] = useState<number | null>(null);

  const sets = fashionSimOutfits.filter((s) => s.versions.includes(version));

  const items = useMemo(
    () => fashionItems.filter((item) => item.versions.includes('all') || item.versions.includes(version)),
    [version],
  );

  const rarityConfig: Record<string, string> = {
    Legendary: 'bg-accent-100 text-accent-700',
    Epic: 'bg-secondary-100 text-secondary-700',
    Unique: 'bg-primary-100 text-primary-700',
    Rare: 'bg-background-100 text-foreground-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-foreground-900 mb-3 flex items-center gap-2">
          <i className="ri-t-shirt-line text-accent-600"></i>
          {t('mh_fashion_sets')}
        </h4>
        <p className="text-xs text-foreground-500 mb-3">{t('mh_fashion_sim_hint')}</p>
        <div className="space-y-3">
          {sets.map((set, idx) => (
            <div key={set.set}>
              <button
                onClick={() => setSelectedSet(selectedSet === idx ? null : idx)}
                className="w-full bg-background-50 border border-background-200 rounded-xl p-4 text-left hover:border-primary-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg ${
                      set.rarity === 'Legendary' ? 'bg-accent-100' : 'bg-secondary-100'
                    } flex items-center justify-center`}>
                      <i className={`${set.rarity === 'Legendary' ? 'ri-vip-crown-line text-accent-600' : 'ri-star-line text-secondary-600'}`}></i>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-foreground-900">{set.set}</h5>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${rarityConfig[set.rarity]}`}>
                        {set.rarity}
                      </span>
                    </div>
                  </div>
                  <i className={`${selectedSet === idx ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-foreground-500 transition-transform`}></i>
                </div>
                <div className="text-xs text-foreground-600 flex items-center gap-1">
                  <i className="ri-shirt-line"></i>
                  {set.pieces.length} {t('mh_fashion_pieces')}
                </div>
              </button>
              {selectedSet === idx && (
                <div className="ml-4 pl-4 border-l-2 border-accent-300 space-y-1.5 mt-2 mb-1">
                  {set.pieces.map((piece) => (
                    <div key={piece} className="flex items-center gap-2 text-sm text-foreground-800 py-1">
                      <i className="ri-checkbox-circle-line text-accent-600 text-sm"></i>
                      {piece}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-foreground-900 mb-3 flex items-center gap-2">
          <i className="ri-gift-2-line text-secondary-600"></i>
          {t('mh_fashion_items')}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((item) => (
            <div key={item.name} className="bg-background-50 border border-background-200 rounded-lg p-3 hover:border-primary-300 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center ${rarityConfig[item.rarity]}`}>
                  <i className={`${item.icon} text-sm`}></i>
                </div>
                <span className="text-xs font-semibold text-foreground-900 truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-foreground-500">{item.category}</span>
                <span className={`font-semibold ${rarityConfig[item.rarity]}`}>{item.rarity}</span>
              </div>
            </div>
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
    </div>
  );
}