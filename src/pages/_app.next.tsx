import type { AppProps } from 'next/app';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import 'remixicon/fonts/remixicon.css';
import '@/index.css';

function DeferredAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    const enable = () => {
      if (active) setEnabled(true);
    };
    const timer = window.setTimeout(enable, 12_000);
    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('keydown', enable, { once: true });
    window.addEventListener('touchstart', enable, { once: true, passive: true });
    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
      window.removeEventListener('touchstart', enable);
    };
  }, []);

  if (!enabled) return null;
  return (
    <>
      <Script src="/ga4-next.js" strategy="afterInteractive" />
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-G816MTTKEN" strategy="afterInteractive" />
    </>
  );
}

export default function MapleStoryApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <DeferredAnalytics />
    </>
  );
}
