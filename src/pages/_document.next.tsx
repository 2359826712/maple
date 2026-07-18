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
        <link rel="icon" type="image/jpeg" sizes="128x128" href="/mpstorys-icon-128.jpg" />
        <link rel="apple-touch-icon" sizes="128x128" href="/mpstorys-icon-128.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
