import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import { telemetry } from '@/services/telemetry';
import { useTranslation } from 'react-i18next';
import { quickTools } from '@/mocks/home';
import { Link } from 'react-router-dom';

const tintMap: Record<string, { bg: string; text: string; ring: string }> = {
  primary: { bg: 'bg-primary-100', text: 'text-primary-700', ring: 'group-hover:ring-primary-300' },
  accent: { bg: 'bg-accent-100', text: 'text-accent-700', ring: 'group-hover:ring-accent-300' },
  secondary: { bg: 'bg-secondary-100', text: 'text-secondary-800', ring: 'group-hover:ring-secondary-300' },
};

export default function QuickTools() {
  const { versionInfo } = useVersion();
  const { t } = useTranslation();

  const filteredTools = quickTools.filter(
    (tool) => tool.key !== 'char' && isAvailableInVersion(tool.versions, versionInfo.id),
  );

  return (
    <section id="tools" className="py-14 md:py-20 bg-background-50">
      <div className="w-full px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('tools_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('tools_title')}
            </h2>
            <p className="mt-2 text-sm md:text-base text-foreground-700 max-w-2xl">
              {t('tools_desc')}
            </p>
          </div>
          <Link
            to="/mapler-house"
            className="hidden md:inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:text-primary-800 cursor-pointer"
          >
            {t('tools_browse_all')}
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((tItem) => {
            const tint = tintMap[tItem.tint] || tintMap.primary;
            const toolTag = tItem.versions.length === 1 && tItem.versions[0] !== 'gms'
              ? t('tools_tag_version', { version: tItem.versions[0].toUpperCase() })
              : (tItem.tag === 'GMS' ? t('tools_tag_gms') : tItem.tag === 'Simulator' ? t('tools_tag_simulator') : tItem.tag === 'Live' ? t('tools_tag_live') : tItem.tag === 'Community' ? t('tools_tag_community') : tItem.tag === 'GMS Only' ? t('tools_tag_gms_only') : tItem.tag === 'Tools' ? t('tools_tag_tools') : tItem.tag);
            return (
              <Link
                key={tItem.key}
                to={tItem.href}
                onClick={() => telemetry.trackToolUse(tItem.key)}
                className={`group relative rounded-xl border border-background-200 bg-background-50 p-5 hover:border-primary-300 hover:bg-background-100 transition-all cursor-pointer ring-1 ring-transparent ${tint.ring}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg ${tint.bg} ${tint.text} flex items-center justify-center`}>
                    <i className={`${tItem.icon} text-2xl`}></i>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${tint.bg} ${tint.text} whitespace-nowrap`}>
                    {toolTag}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground-950">
                  {t(tItem.titleKey)}
                </h3>
                <p className="mt-1 text-sm text-foreground-700">{t(tItem.descKey)}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary-700">
                  {t('tools_open')}
                  <i className="ri-arrow-right-line group-hover:translate-x-0.5 transition-transform"></i>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-foreground-500 border-t border-background-200 pt-3">
                  <span className="flex items-center gap-0.5">
                    <i className="ri-global-line text-[10px]"></i>
                    {tItem.versions.length >= 5 ? t('tools_data_all_versions', 'All versions') : tItem.versions.map((v) => v.toUpperCase()).join(' / ')}
                  </span>
                  <span className="text-background-300">·</span>
                  <span className="flex items-center gap-0.5">
                    <i className="ri-information-line text-[10px] text-primary-500"></i>
                    {t(tItem.dataLabelKey)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
