import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import UniversalSearchInput from '@/components/search/UniversalSearchInput';

export default function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => {}} unread={0} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <div className="relative flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          {/* Large 404 watermark */}
          <h1 className="absolute bottom-0 text-[10rem] md:text-[16rem] font-black text-background-200 select-none pointer-events-none z-0 leading-none">
            404
          </h1>

          <div className="relative z-10 max-w-md">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <i className="ri-compass-discover-line text-3xl"></i>
            </div>

            <h1 className="text-2xl md:text-3xl font-heading font-semibold text-foreground-950">
              {t('not_found_title', 'This page does not exist')}
            </h1>
            <p className="mt-2 text-sm text-foreground-600">
              {t('not_found_desc', 'The page you are looking for might have been moved, deleted, or never existed.')}
            </p>
            <p className="mt-2 text-xs text-foreground-400 font-mono break-all">{location.pathname}</p>

            <div className="mt-6">
              <UniversalSearchInput
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                placeholder={t('not_found_search_placeholder', 'Search for a boss, class, item...')}
                submitLabel={t('nav_search_button')}
                compact
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-500 px-6 text-sm font-semibold text-background-50 hover:bg-primary-600 transition"
              >
                <i className="ri-home-4-line"></i>
                {t('not_found_back_home', 'Back to Home')}
              </Link>
              <Link
                to="/wiki"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-background-300 bg-background-50 px-6 text-sm font-semibold text-foreground-700 hover:bg-background-100 transition"
              >
                <i className="ri-book-open-line"></i>
                {t('not_found_browse_wiki', 'Browse Wiki')}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
