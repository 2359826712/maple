import { Head, Html, Main, NextScript } from 'next/document';
import type { DocumentProps } from 'next/document';

const htmlLanguages: Record<string, string> = {
  en: 'en',
  zh: 'zh-CN',
  ja: 'ja',
  ko: 'ko',
  'zh-Hant': 'zh-Hant',
};

export default function Document(props: DocumentProps) {
  const pageProps = props.__NEXT_DATA__.props?.pageProps as { language?: string } | undefined;
  return (
    <Html lang={htmlLanguages[pageProps?.language || 'en'] || 'en'}>
      <Head>
        <meta name="mpstorys-build" content="next-ssr-v1" />
        <meta name="theme-color" content="#2f8f5b" />
        <meta name="application-name" content="MPStorys" />
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/jpeg" sizes="128x128" href="/mpstorys-icon-128.jpg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link
          rel="preload"
          href="/fonts/fredoka-latin-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
