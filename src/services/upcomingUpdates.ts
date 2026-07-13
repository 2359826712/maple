import { cachedJsonFetch, getRealtimeCacheSavedAt, realtimeCacheDurations } from './realtimeCache';
import { sanitizeMirroredHtml } from './sanitizeHtml';

const ORANGE_MUSHROOM_FEED_URL = 'https://public-api.wordpress.com/rest/v1.1/sites/orangemushroom.net/posts/';
const ORANGE_MUSHROOM_CACHE_KEY = 'upcoming-updates:orange-mushroom-kmst:v1';
export const ORANGE_MUSHROOM_TIME_ZONE = 'America/New_York';

type WordPressPost = {
  ID?: number;
  title?: string;
  URL?: string;
  date?: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  author?: { name?: string };
  categories?: Record<string, unknown>;
  tags?: Record<string, unknown>;
};

type WordPressPostFeed = {
  found?: number;
  posts?: WordPressPost[];
};

export type UpcomingUpdatePost = {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  sourceUrl: string;
  image: string;
  author: string;
  tags: string[];
  status: 'kmst';
};

export type UpcomingUpdateArticle = UpcomingUpdatePost & {
  contentHtml: string;
};

export type UpcomingUpdateFeed = {
  items: UpcomingUpdatePost[];
  total: number;
  sourceSyncedAt: string;
};

const decodeText = (value = '') => {
  if (typeof DOMParser === 'undefined') {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const document = new DOMParser().parseFromString(value, 'text/html');
  return (document.body.textContent || '').replace(/\[…\]|\[\.\.\.\]/g, '').replace(/\s+/g, ' ').trim();
};

const httpsUrl = (value = '') => {
  try {
    const url = new URL(value);
    if (url.protocol === 'http:') url.protocol = 'https:';
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};

const normalizeArticleHtml = (value = '') => {
  const httpsContent = value
    .replaceAll('http://orangemushroom.net', 'https://orangemushroom.net')
    .replaceAll('http://orangemushroom.wordpress.com', 'https://orangemushroom.wordpress.com');
  const sanitized = sanitizeMirroredHtml(httpsContent);
  const document = new DOMParser().parseFromString(sanitized, 'text/html');

  document.body.querySelectorAll<HTMLElement>('[style]').forEach((element) => element.removeAttribute('style'));
  document.body.querySelectorAll<HTMLImageElement>('img').forEach((image) => image.setAttribute('loading', 'lazy'));
  document.body.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href') || '';
    if (!href.startsWith('#')) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'nofollow noopener noreferrer');
    }
  });

  return document.body.innerHTML;
};

export const normalizeOrangeMushroomFeed = (payload: WordPressPostFeed): UpcomingUpdatePost[] =>
  (Array.isArray(payload.posts) ? payload.posts : []).flatMap((post) => {
    const sourceUrl = httpsUrl(post.URL);
    const title = decodeText(post.title);
    const excerpt = decodeText(post.excerpt);
    const publishedAt = post.date && !Number.isNaN(Date.parse(post.date)) ? new Date(post.date).toISOString() : '';
    if (!post.ID || !sourceUrl || !title || !excerpt || !publishedAt) return [];

    return [{
      id: `orange-mushroom-${post.ID}`,
      title,
      excerpt,
      publishedAt,
      sourceUrl,
      image: httpsUrl(post.featured_image),
      author: decodeText(post.author?.name) || 'Orange Mushroom',
      tags: Object.keys(post.tags || {}).slice(0, 4),
      status: 'kmst' as const,
    }];
  });

export const normalizeOrangeMushroomArticle = (post: WordPressPost): UpcomingUpdateArticle | null => {
  const preview = normalizeOrangeMushroomFeed({ posts: [post] })[0];
  const contentHtml = normalizeArticleHtml(post.content);
  return preview && contentHtml ? { ...preview, contentHtml } : null;
};

export async function fetchUpcomingUpdates(options: { force?: boolean; signal?: AbortSignal } = {}): Promise<UpcomingUpdateFeed> {
  const url = new URL(ORANGE_MUSHROOM_FEED_URL);
  url.searchParams.set('category', 'KMST');
  url.searchParams.set('number', '6');
  url.searchParams.set('fields', 'ID,title,URL,date,excerpt,featured_image,author,categories,tags');

  const payload = await cachedJsonFetch<WordPressPostFeed>(url.toString(), {
    cacheKey: ORANGE_MUSHROOM_CACHE_KEY,
    freshMs: options.force ? 0 : realtimeCacheDurations.medium,
    staleMs: realtimeCacheDurations.week,
    retryMs: options.force ? 0 : 60 * 1000,
    timeoutMs: 8000,
    requestInit: { signal: options.signal },
  });

  const cachedAt = getRealtimeCacheSavedAt(ORANGE_MUSHROOM_CACHE_KEY) ?? Date.now();
  return {
    items: normalizeOrangeMushroomFeed(payload),
    total: typeof payload.found === 'number' ? payload.found : 0,
    sourceSyncedAt: new Date(cachedAt).toISOString(),
  };
}

export async function fetchUpcomingUpdateArticle(
  postId: string,
  options: { force?: boolean; signal?: AbortSignal } = {},
): Promise<UpcomingUpdateArticle> {
  if (!/^orange-mushroom-\d+$/.test(postId)) throw new Error('Invalid KMST post id');
  const numericId = postId.replace('orange-mushroom-', '');
  const url = new URL(`${ORANGE_MUSHROOM_FEED_URL}${numericId}`);
  url.searchParams.set('fields', 'ID,title,URL,date,excerpt,content,featured_image,author');

  const payload = await cachedJsonFetch<WordPressPost>(url.toString(), {
    cacheKey: `upcoming-update:orange-mushroom:${numericId}:v1`,
    freshMs: options.force ? 0 : realtimeCacheDurations.medium,
    staleMs: realtimeCacheDurations.week,
    retryMs: options.force ? 0 : 60 * 1000,
    timeoutMs: 12000,
    requestInit: { signal: options.signal },
  });
  const article = normalizeOrangeMushroomArticle(payload);
  if (!article) throw new Error('KMST post content is unavailable');
  return article;
}
