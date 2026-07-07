import { useTranslation } from 'react-i18next';

interface RelatedGuide {
  id: string;
  title: string;
  classLabel: string;
  difficulty: string;
  readTime: string;
  author: string;
  upvotes: number;
  image: string;
}

const difficultyColors: Record<string, string> = {
  Beginner: 'bg-accent-100 text-accent-800',
  Intermediate: 'bg-secondary-100 text-secondary-900',
  Advanced: 'bg-primary-100 text-primary-800',
};

interface Props {
  guides: RelatedGuide[];
}

export default function RelatedGuides({ guides }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-background-200 bg-background-50 p-5 sticky top-24">
      <div className="flex items-center gap-2 mb-4">
        <i className="ri-link text-primary-600"></i>
        <h3 className="font-heading font-semibold text-foreground-950 text-sm">{t('guide_related')}</h3>
      </div>

      <div className="space-y-3">
        {guides.map((g) => (
          <a
            key={g.id}
            href={`/guides/${g.id}`}
            className="group flex gap-3 p-3 rounded-lg border border-background-200 bg-background-50 hover:border-primary-300 hover:bg-background-100 transition-colors cursor-pointer"
          >
            <div className="w-20 h-16 rounded-md overflow-hidden flex-shrink-0">
              <img
                src={g.image}
                alt={g.title}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-semibold text-foreground-600 px-1.5 py-0.5 rounded bg-background-100">
                  {g.classLabel}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${difficultyColors[g.difficulty] || difficultyColors.Beginner}`}>
                  {g.difficulty}
                </span>
              </div>
              <h4 className="text-sm font-heading font-semibold text-foreground-950 group-hover:text-primary-700 leading-snug">
                {g.title}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-[11px] text-foreground-600">
                <span>{g.author}</span>
                <span>{g.readTime}</span>
                <span className="flex items-center gap-1">
                  <i className="ri-thumb-up-line"></i> {g.upvotes}
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}