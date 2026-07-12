import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion } from '@/domain/regionModel';
import { toolShowcase } from '@/mocks/home';
import { useNavigate } from 'react-router-dom';

export default function ToolsShowcase() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const navigate = useNavigate();

  const filteredTools = toolShowcase.filter((tool) => isAvailableInVersion(tool.versions, versionInfo.id));

  return (
    <section className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-1">
            <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
              {t('tools_workshop_title_eyebrow')}
            </div>
            <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold text-foreground-950">
              {t('tools_workshop_title')}
            </h2>
            <p className="mt-3 text-sm md:text-base text-foreground-700">
              {t('tools_workshop_desc')}
            </p>
            <div className="mt-5 p-4 rounded-lg bg-background-50 border border-accent-200 flex items-start gap-3">
              <i className="ri-information-2-line text-accent-700 text-lg mt-0.5"></i>
              <p className="text-sm text-foreground-800">
                <span className="font-semibold text-foreground-950">{t('tools_workshop_notice')}</span>
                {' '}{t('tools_workshop_notice_desc')}
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => navigate('/mapler-house')}
                className="h-10 px-4 rounded-full bg-accent-500 hover:bg-accent-600 text-background-50 dark:text-foreground-950 font-semibold text-sm cursor-pointer whitespace-nowrap"
              >
                {t('tools_workshop_open')}
              </button>
              <button className="h-10 px-4 rounded-full bg-background-50 border border-background-200 hover:border-accent-300 text-foreground-800 font-semibold text-sm cursor-pointer whitespace-nowrap">
                {t('tools_workshop_request')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredTools.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-foreground-600">
                <i className="ri-tools-line text-4xl mb-3 block"></i>
                <p className="text-lg font-semibold">No tools available for {versionInfo.shortLabel} yet</p>
                <p className="text-sm mt-1">Switch versions to browse available tools.</p>
              </div>
            ) : (
              filteredTools.map((tItem) => (
                <div
                  key={tItem.name}
                  className="p-5 rounded-xl border border-background-200 bg-background-50 hover:border-accent-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center">
                      <i className={`${tItem.icon} text-xl`}></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-foreground-950">{tItem.name}</h3>
                      <p className="mt-1 text-sm text-foreground-700">{tItem.detail}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
