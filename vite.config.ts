import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import AutoImport from "unplugin-auto-import/vite";

const base = process.env.BASE_PATH || "/";
const isPreview = process.env.IS_PREVIEW ? true : false;
const contentSecurityPolicy = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; connect-src 'self' https: http://127.0.0.1:8080 ws://127.0.0.1:*; upgrade-insecure-requests";
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
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
  },
  resolve: {
    alias: {
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
      "/api/maplestory": {
        target: "https://www.nexon.com",
        changeOrigin: true,
        secure: true,
      },
      "/api/steam-maplestory-news": {
        target: "https://api.steampowered.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/steam-maplestory-news/, "/ISteamNews/GetNewsForApp/v2/"),
      },
      "/api/reddit-maplestory": {
        target: "https://www.reddit.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/reddit-maplestory/, "/r/Maplestory"),
      },
      "/api/pullpush-reddit": {
        target: "https://api.pullpush.io",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/pullpush-reddit/, "/reddit/search/submission/"),
      },
      "/api/mapletodo": {
        target: "https://mapletodo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/mapletodo/, ""),
      },
      "/api/grandis-library": {
        target: "https://grandislibrary.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/grandis-library/, ""),
      },
      "/api/gucci-guild": {
        target: "https://gucciguild.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/gucci-guild/, ""),
      },
      "/maplestory-io-api": {
        target: "https://maplestory.io",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/maplestory-io-api/, "/api"),
      },
      "/api/maplestory-fandom": {
        target: "https://maplestory.fandom.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/maplestory-fandom/, "/api.php"),
      },
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
