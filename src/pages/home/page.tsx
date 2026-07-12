import { useState } from 'react';
import { useVersion, VersionProvider } from '@/hooks/VersionContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CurrentVersionHighlights from './components/CurrentVersionHighlights';
import DailyHubSection from './components/DailyHubSection';
import TodayInMapleSection from './components/TodayInMapleSection';
import QuickTools from './components/QuickTools';
import Footer from './components/Footer';
import NotificationDrawer from './components/NotificationDrawer';
import { useCharacters } from '@/hooks/useCharacters';

export function HomeContent() {
  const [notifOpen, setNotifOpen] = useState(false);
  const { activeCharacter } = useCharacters();

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar
        onOpenNotifications={() => setNotifOpen(true)}
        unread={0}
      />
      <main id="main-content" tabIndex={-1}>
        {activeCharacter ? <TodayInMapleSection /> : <Hero />}
        <CurrentVersionHighlights />
        {!activeCharacter && <DailyHubSection />}
        <QuickTools />
      </main>
      <Footer />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

export default function Home() {
  return (
    <VersionProvider>
      <HomeContent />
    </VersionProvider>
  );
}
