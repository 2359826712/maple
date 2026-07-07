import { useTranslation } from 'react-i18next';

interface Author {
  name: string;
  avatar: string;
  bio: string;
  joined: string;
  posts: number;
  followers: string;
}

interface Props {
  author: Author;
  published: string;
  updated: string;
  upvotes: number;
  tags: string[];
}

const tagColors = ['bg-primary-100 text-primary-800', 'bg-accent-100 text-accent-800', 'bg-secondary-100 text-secondary-900', 'bg-primary-100 text-primary-800', 'bg-accent-100 text-accent-800'];

export default function AuthorBio({ author, published, updated, upvotes, tags }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-background-200 bg-background-50 p-5">
      <div className="flex items-start gap-4">
        <img
          src={author.avatar}
          alt={author.name}
          className="w-14 h-14 rounded-full object-cover object-top flex-shrink-0"
        />
        <div className="flex-1">
          <div className="font-heading font-semibold text-foreground-950">{author.name}</div>
          <div className="text-xs text-foreground-600 mt-0.5">{author.bio}</div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-foreground-600">
            <span className="flex items-center gap-1">
              <i className="ri-calendar-line"></i> Joined {author.joined}
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-file-text-line"></i> {author.posts} posts
            </span>
            <span className="flex items-center gap-1">
              <i className="ri-user-heart-line text-primary-600"></i> {author.followers} followers
            </span>
          </div>
        </div>
        <button className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-xs font-semibold cursor-pointer whitespace-nowrap flex-shrink-0">
          {t('guide_follow')}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground-600">
        <span className="flex items-center gap-1">
          <i className="ri-calendar-event-line"></i> {t('guide_published')} {published}
        </span>
        <span className="flex items-center gap-1">
          <i className="ri-refresh-line"></i> {t('guide_updated')} {updated}
        </span>
        <span className="flex items-center gap-1 font-semibold text-primary-700">
          <i className="ri-thumb-up-fill"></i> {upvotes.toLocaleString()}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tg, i) => (
          <span key={tg} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${tagColors[i % tagColors.length]}`}>
            {tg}
          </span>
        ))}
      </div>
    </div>
  );
}