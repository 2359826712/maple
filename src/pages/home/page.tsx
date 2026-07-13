import { useState } from 'react';
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
  const isLegacyPlaceholder = Boolean(
    activeCharacter
    && activeCharacter.level === 1
    && activeCharacter.name.trim().toLowerCase() === 'my character'
    && !activeCharacter.className.trim(),
  );
  const hasConfiguredCharacter = Boolean(activeCharacter && !isLegacyPlaceholder);

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar
        onOpenNotifications={() => setNotifOpen(true)}
        unread={0}
      />
      <main id="main-content" tabIndex={-1}>
        {hasConfiguredCharacter ? <TodayInMapleSection /> : <Hero />}
        <CurrentVersionHighlights />
        {!hasConfiguredCharacter && <DailyHubSection />}
        <QuickTools />
      </main>
      <Footer />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
