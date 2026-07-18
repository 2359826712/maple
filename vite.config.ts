import { build as viteBuild, defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";
import { generateLocalizedStaticRoutes } from "./scripts/generate-localized-static-routes.mjs";
import { verifySeoOutput } from "./scripts/verify-seo-output.mjs";

const base = process.env.BASE_PATH || "/";
const isPreview = process.env.IS_PREVIEW ? true : false;
const contentSecurityPolicy = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://accounts.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https://accounts.google.com https://www.google-analytics.com https://analytics.google.com https://region1.google-analytics.com https://public-api.wordpress.com https://vvgbkrqqzayqslwjnbdu.supabase.co https://grandislibrary.com https://maplestorywiki.net https://maplestory.fandom.com https://maplestory.io https://r.jina.ai http://127.0.0.1:8080 ws://127.0.0.1:*; frame-src https://accounts.google.com; upgrade-insecure-requests";

const routeSsgOutputPlugin = (): Plugin => {
  let isSsrBuild = false;

  return {
    name: "route-ssg-output",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      isSsrBuild = Boolean(config.build.ssr);
    },
    async closeBundle() {
      if (isSsrBuild) return;

      await viteBuild({
        root: __dirname,
        build: {
          ssr: resolve(__dirname, "src/ssg-entry.tsx"),
          outDir: resolve(__dirname, ".ssg"),
          emptyOutDir: true,
        },
      });

      await generateLocalizedStaticRoutes();
      await verifySeoOutput();
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        {
          react: [
            ["default", "React"],
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
            "useDeferredValue",
            "useId",
            "useInsertionEffect",
            "useSyncExternalStore",
            "useTransition",
            "startTransition",
            "lazy",
            "memo",
            "forwardRef",
            "createContext",
            "createElement",
            "cloneElement",
            "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "NavLink",
            "Navigate",
            "Outlet",
          ],
        },
        // React i18n
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
    routeSsgOutputPlugin(),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](?:react|react-dom|react-router|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'i18n-vendor',
              test: /node_modules[\\/](?:i18next|react-i18next|i18next-browser-languagedetector)[\\/]/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      "runtime-router-config": resolve(__dirname, "./src/router/config.tsx"),
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    headers: {
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
    proxy: {
      "/api": {
        target: process.env.MAPLE_SQL_API_ORIGIN || "http://127.0.0.1:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    headers: {
      "Content-Security-Policy": contentSecurityPolicy,
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Content-Type-Options": "nosniff",
    },
  },
});
