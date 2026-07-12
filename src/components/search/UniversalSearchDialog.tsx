import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { getPopularSearchTerms, getSiteSearchResults, type SiteSearchResult } from '@/services/siteSearch';
import SearchResultList from './SearchResultList';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function UniversalSearchDialog({ open, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { versionInfo } = useVersion();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const results = useMemo(
    () => getSiteSearchResults(query, i18n.language, versionInfo.id).slice(0, 8),
    [i18n.language, query, versionInfo.id],
  );
  const popularSearches = useMemo(
    () => getPopularSearchTerms(i18n.language, versionInfo.id, 5),
    [i18n.language, versionInfo.id],
  );

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setActiveIndex(0);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const goToResult = (result: SiteSearchResult) => {
    navigate(result.href);
    onClose();
  };

  const submitQuery = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (results[activeIndex]) goToResult(results[activeIndex]);
    else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      onClose();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
      return;
    }
    if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + results.length) % results.length);
      return;
    }
    if (event.key === 'Enter' && document.activeElement === inputRef.current) {
      event.preventDefault();
      submitQuery();
      return;
    }
    if (event.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('disabled'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={handleKeyDown}>
      <button
        type="button"
        className="absolute inset-0 bg-foreground-950/55 backdrop-blur-sm"
        aria-label={t('search_palette_close')}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="universal-search-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-background-200 bg-background-50 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-background-200 px-4 py-3">
          <i className="ri-search-2-line text-xl text-primary-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 id="universal-search-title" className="sr-only">{t('search_palette_title')}</h2>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('search_input_placeholder')}
              aria-label={t('search_palette_title')}
              aria-controls="universal-search-results"
              aria-activedescendant={results[activeIndex] ? `palette-result-${activeIndex}` : undefined}
              className="h-11 w-full bg-transparent text-base text-foreground-950 outline-none placeholder:text-foreground-500"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-100 text-foreground-700 hover:bg-background-200"
            aria-label={t('search_palette_close')}
          >
            <i className="ri-close-line" aria-hidden="true" />
          </button>
        </div>

        <div id="universal-search-results" className="max-h-[55vh] overflow-y-auto">
          <div className="flex items-center justify-between bg-background-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground-500">
            <span>{query ? t('nav_search_best_matches') : t('nav_search_popular')}</span>
            <span>{versionInfo.shortLabel}</span>
          </div>
          {query ? (
            <SearchResultList
              results={results}
              activeIndex={activeIndex}
              onSelect={goToResult}
              emptyLabel={t('nav_search_no_match')}
              showExcerpt
              optionIdPrefix="palette-result"
            />
          ) : (
            <div className="flex flex-wrap gap-2 p-4">
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="min-h-10 rounded-full border border-background-300 bg-background-50 px-3 text-sm text-foreground-700 hover:border-primary-300 hover:bg-primary-50"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-background-200 bg-background-100 px-4 py-3 text-xs text-foreground-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('search_palette_keyboard_help')}</span>
          <Link to="/mapler-house#char-lookup" onClick={onClose} className="font-semibold text-primary-700 hover:underline">
            <i className="ri-user-search-line mr-1" aria-hidden="true" />
            {t('search_palette_character_lookup')}
          </Link>
        </div>
      </div>
    </div>
  );
}
