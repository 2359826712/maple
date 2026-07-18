import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NotificationDrawer from './components/NotificationDrawer';
import HomeSeriesGateway from './components/HomeSeriesGateway';

export function HomeContent() {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar
        onOpenNotifications={() => setNotifOpen(true)}
        unread={0}
      />
      <main id="main-content" tabIndex={-1}>
        <HomeSeriesGateway />
      </main>
      <Footer />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
