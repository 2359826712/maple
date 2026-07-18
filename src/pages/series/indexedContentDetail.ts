import type { IndexedContentRecord } from '@/domain/contentIndex';
import { indexedContent } from '@/domain/contentIndex';
import type { ResourceIndexRecord } from '@/domain/resourceIndex';

export type ContentSection = {
  title: string;
  items: string[];
};

export type ResourceDetailFacts = Pick<ResourceIndexRecord,
  | 'website'
  | 'page'
  | 'category'
  | 'regions'
  | 'languages'
  | 'mobile_support'
  | 'login_required'
  | 'status'
  | 'last_checked'
  | 'tags'
  | 'source_urls'
>;

export type SourceOverviewFacts = {
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  publishedAt?: string;
};

const stringItems = (value: unknown) => (
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : []
);

const metadataSections = (record: IndexedContentRecord): ContentSection[] => {
  const sections = record.metadata.sections;
  if (!Array.isArray(sections)) return [];

  return sections.flatMap((section) => {
    if (!section || typeof section !== 'object') return [];
    const title = 'title' in section && typeof section.title === 'string' ? section.title.trim() : '';
    const items = 'items' in section ? stringItems(section.items) : [];
    return title && items.length > 0 ? [{ title, items }] : [];
  });
};

export const getIndexedContentSections = (record?: IndexedContentRecord): ContentSection[] => {
  if (!record) return [];
  const sections = metadataSections(record);

  if ('prerequisites' in record) {
    if (record.prerequisites.length > 0) sections.push({ title: 'Prerequisites', items: record.prerequisites });
    if (record.steps.length > 0) sections.push({ title: 'Practical steps', items: record.steps });
  }

  if ('participation_steps' in record) {
    if (record.requirements.length > 0) sections.push({ title: 'Requirements', items: record.requirements });
    if (record.rewards.length > 0) sections.push({ title: 'Event benefits and rewards', items: record.rewards });
    if (record.participation_steps.length > 0) sections.push({ title: 'How to participate', items: record.participation_steps });
  }

  if ('changes' in record) {
    if (record.changes.length > 0) sections.push({ title: 'Changes', items: record.changes });
    if (record.known_issues.length > 0) sections.push({ title: 'Known issues', items: record.known_issues });
    if (record.resolved_issues.length > 0) sections.push({ title: 'Resolved issues', items: record.resolved_issues });
  }

  return sections;
};

const normalizedUrl = (value: string) => {
  try {
    const url = new URL(value);
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (/^(?:fbclid|gclid|utm_)/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    url.hash = '';
    return url.toString();
  } catch {
    return value;
  }
};

const recordUrls = (record: IndexedContentRecord) => [
  record.canonical_url,
  record.source_url,
  ...record.related_urls,
].map(normalizedUrl);

export const findIndexedContentIn = (
  records: IndexedContentRecord[],
  contentId?: string,
  resourceId?: string,
  sourceUrl?: string,
) => {
  const targetUrl = sourceUrl ? normalizedUrl(sourceUrl) : undefined;
  return records.find((record) => (
    (contentId && record.id === contentId)
    || (resourceId && record.metadata.resource_id === resourceId)
    || (targetUrl && recordUrls(record).includes(targetUrl))
  ));
};

export const findIndexedContent = (contentId?: string, resourceId?: string, sourceUrl?: string) => (
  findIndexedContentIn(indexedContent, contentId, resourceId, sourceUrl)
);

const label = (value: string) => value.replaceAll('-', ' ');

export const getIndexedResourceSections = (resource?: ResourceDetailFacts): ContentSection[] => {
  if (!resource) return [];
  const access = resource.login_required === true
    ? 'A signed-in account is required to use this source.'
    : resource.login_required === false
      ? 'The indexed page is publicly readable without signing in.'
      : 'The source has not confirmed whether every feature is available without signing in.';

  return [
    {
      title: 'What this official resource covers',
      items: [
        `${resource.page} is maintained by ${resource.website}.`,
        `MPStorys indexes it as ${label(resource.category)} content for ${resource.regions.map(label).join(', ')}.`,
        ...(resource.tags.length > 0 ? [`Verified topics: ${resource.tags.map(label).join(', ')}.`] : []),
      ],
    },
    {
      title: 'Availability',
      items: [
        `Published languages: ${resource.languages.map(label).join(', ')}.`,
        `Mobile support: ${label(resource.mobile_support)}.`,
        access,
      ],
    },
    {
      title: 'Verification record',
      items: [
        `Source status: ${label(resource.status)}; last checked ${resource.last_checked}.`,
        ...resource.source_urls.map((url) => `Verified source: ${url}`),
      ],
    },
  ];
};

export const getSourceOverviewSections = (resource?: SourceOverviewFacts): ContentSection[] => {
  if (!resource) return [];
  const sourceHost = (() => {
    try {
      return new URL(resource.sourceUrl).hostname.replace(/^www\./, '');
    } catch {
      return resource.sourceUrl;
    }
  })();
  return [
    {
      title: 'Official source coverage',
      items: [
        `${resource.title} is indexed from ${resource.sourceLabel}.`,
        resource.description,
      ],
    },
    {
      title: 'Verification reference',
      items: [
        `Canonical source: ${sourceHost}.`,
        ...(resource.publishedAt ? [`Published or verified for ${resource.publishedAt.slice(0, 10)}.`] : []),
        `Full source address: ${resource.sourceUrl}`,
      ],
    },
  ];
};
