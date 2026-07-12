import { useState } from 'react';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import RankingBoard from '@/pages/home/components/RankingBoard';

export default function RankingsPage() {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <RankingBoard />
      </main>

      <Footer />
    </div>
  );
}
