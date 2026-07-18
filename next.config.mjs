import AutoImport from 'unplugin-auto-import/webpack';
import { resolve } from 'node:path';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' https://accounts.google.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://accounts.google.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://public-api.wordpress.com https://vvgbkrqqzayqslwjnbdu.supabase.co https://grandislibrary.com https://maplestorywiki.net https://maplestory.fandom.com https://maplestory.io https://r.jina.ai",
  "frame-src https://accounts.google.com",
  'upgrade-insecure-requests',
].join('; ');

const apiOrigin = process.env.MAPLE_SQL_API_ORIGIN?.replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  pageExtensions: ['next.tsx', 'next.ts'],
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_MAPLE_SQL_API_BASE_URL:
      process.env.NEXT_PUBLIC_MAPLE_SQL_API_BASE_URL || process.env.VITE_MAPLE_SQL_API_BASE_URL || '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '',
    NEXT_PUBLIC_ANALYTICS_ENDPOINT:
      process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || process.env.VITE_ANALYTICS_ENDPOINT || '/api/telemetry/events',
    NEXT_PUBLIC_ENABLE_ANALYTICS:
      process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || process.env.VITE_ENABLE_ANALYTICS || 'false',
    NEXT_PUBLIC_INTERNAL_SESSION:
      process.env.NEXT_PUBLIC_INTERNAL_SESSION || process.env.VITE_INTERNAL_SESSION || 'false',
    NEXT_PUBLIC_MAPLE_SQL_TENANT_KEY:
      process.env.NEXT_PUBLIC_MAPLE_SQL_TENANT_KEY || process.env.VITE_MAPLE_SQL_TENANT_KEY || 'default',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/health', destination: '/api/health' },
        ...(apiOrigin
          ? [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }]
          : []),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  webpack(config, { isServer }) {
    config.resolve.alias = {
      'runtime-router-config$': resolve(
        process.cwd(),
        isServer ? 'src/router/config.server.tsx' : 'src/router/config.tsx',
      ),
      ...config.resolve.alias,
      '@': resolve(process.cwd(), 'src'),
    };
    config.plugins.push(
      AutoImport({
        imports: [
          {
            react: [
              ['default', 'React'],
              'useState',
              'useEffect',
              'useContext',
              'useReducer',
              'useCallback',
              'useMemo',
              'useRef',
              'useImperativeHandle',
              'useLayoutEffect',
              'useDebugValue',
              'useDeferredValue',
              'useId',
              'useInsertionEffect',
              'useSyncExternalStore',
              'useTransition',
              'startTransition',
              'lazy',
              'memo',
              'forwardRef',
              'createContext',
              'createElement',
              'cloneElement',
              'isValidElement',
            ],
          },
          {
            'react-router-dom': [
              'useNavigate',
              'useLocation',
              'useParams',
              'useSearchParams',
              'Link',
              'NavLink',
              'Navigate',
              'Outlet',
            ],
          },
          { 'react-i18next': ['useTranslation', 'Trans'] },
        ],
        dts: false,
      }),
    );
    return config;
  },
};

export default nextConfig;
