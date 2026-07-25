import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { localizeHref } from '@/i18n/languageRouting';
import { useVersion } from '@/hooks/VersionContext';
import { getVerifiedSeriesResources } from '@/pages/series/verifiedContent';
import CommunitySelector from './CommunitySelector';

const destinations = getVerifiedSeriesResources('maplestory-pc', 'community');

export default function CommunityLandingPage() {
  const { t, i18n } = useTranslation();
  const { version } = useVersion();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const localized = (href: string) => localizeHref(href, i18n.language, version);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotificationOpen(true)} unread={0} />
      <NotificationDrawer open={notificationOpen} onClose={() => setNotificationOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-20 md:pt-24">
        <header className="border-b border-background-200 bg-background-100">
          <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              {t('community_directory_eyebrow')}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold md:text-4xl">
              {t('community_directory_title')}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-foreground-600">
              {t('community_directory_desc')}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
          <CommunitySelector
            seriesId="maplestory-pc"
            destinations={destinations}
            fallbackImage="/static/images/landing/maplestory-pc-960.webp"
            localizeHref={localized}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
