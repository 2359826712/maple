import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import TierOverview from './components/TierOverview';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import NewsletterCTA from '@/pages/home/components/NewsletterCTA';

function ClassRankingsContent() {
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-16 md:pt-20">
        <TierOverview />
        <NewsletterCTA />
      </main>

      <Footer />
    </div>
  );
}

export default function ClassRankings() {
  return <ClassRankingsContent />;
}