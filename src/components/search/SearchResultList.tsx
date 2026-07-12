import { useTranslation } from 'react-i18next';
import type { SiteSearchResult } from '@/services/siteSearch';

interface Props {
  results: readonly SiteSearchResult[];
  onSelect: (result: SiteSearchResult, index: number) => void;
  emptyLabel?: string;
  activeIndex?: number;
  showExcerpt?: boolean;
  optionIdPrefix?: string;
}

export default function SearchResultList({
  results,
  onSelect,
  emptyLabel,
  activeIndex = -1,
  showExcerpt = false,
  optionIdPrefix = 'search-result',
}: Props) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return emptyLabel ? <p className="px-4 py-4 text-sm text-foreground-500">{emptyLabel}</p> : null;
  }

  return (
    <ul className="py-2" role="listbox">
      {results.map((result, index) => (
        <li key={`${result.section}-${result.id}`}>
          <button
            id={`${optionIdPrefix}-${index}`}
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            onClick={() => onSelect(result, index)}
            className={`flex w-full items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
              index === activeIndex
                ? 'bg-primary-50 text-primary-800'
                : 'text-foreground-800 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background-100 text-foreground-600">
              <i className={result.icon} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{result.title}</span>
              {showExcerpt && result.excerpt && (
                <span className="mt-0.5 block truncate text-xs font-normal text-foreground-500">{result.excerpt}</span>
              )}
            </span>
            <span className="mt-1 shrink-0 text-[10px] font-medium uppercase tracking-wide text-foreground-500">
              {t(`search_section_${result.section}`)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
