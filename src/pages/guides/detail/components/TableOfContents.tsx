import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TocItem {
  id: string;
  title: string;
}

interface Props {
  items: TocItem[];
}

export default function TableOfContents({ items }: Props) {
  const { t } = useTranslation();
  const [active, setActive] = useState(items[0]?.id || '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActive(e.target.id);
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(id);
    }
  };

  return (
    <nav className="rounded-xl border border-background-200 bg-background-50 p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <i className="ri-list-unordered text-primary-600"></i>
        <h3 className="font-heading font-semibold text-foreground-950 text-sm">{t('guide_toc')}</h3>
      </div>
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              onClick={() => scrollTo(item.id)}
              className={`w-full text-left py-2 px-3 rounded-md text-sm transition-colors cursor-pointer flex items-start gap-2 ${
                active === item.id
                  ? 'bg-primary-100 text-primary-800 font-semibold'
                  : 'text-foreground-700 hover:text-primary-700 hover:bg-primary-50'
              }`}
            >
              <span
                className={`mt-0.5 text-[11px] font-semibold flex-shrink-0 ${
                  active === item.id ? 'text-primary-600' : 'text-foreground-500'
                }`}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="leading-snug">{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-background-200 flex items-center gap-2 text-[11px] text-foreground-600">
        <i className="ri-time-line"></i>
        <span>{t('guide_read_info', { minutes: '18', date: 'Jul 6' })}</span>
      </div>
    </nav>
  );
}