import type { AppProps } from 'next/app';
import Script from 'next/script';
import 'remixicon/fonts/remixicon.css';
import '@/index.css';

export default function MapleStoryApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-G816MTTKEN" strategy="afterInteractive" />
      <Script src="/ga4-next.js" strategy="afterInteractive" />
    </>
  );
}
