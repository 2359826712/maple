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

const summarySentences = (summary: string) => summary
  .split(/(?<=[.!?])\s+/)
  .map((sentence) => sentence.trim())
  .filter(Boolean);

const summaryDetailSections = (record: IndexedContentRecord): ContentSection[] => {
  if (!record.summary) return [];

  const buckets = new Map<string, string[]>();
  const add = (title: string, sentence: string) => {
    const items = buckets.get(title) || [];
    items.push(sentence);
    buckets.set(title, items);
  };

  summarySentences(record.summary).forEach((sentence) => {
    if (/\b(?:scam|unauthorized|ban(?:ned|s)?|bot(?:s|ting)?|abuse|warning)\b/i.test(sentence)) {
      add('Safety, enforcement, and restrictions', sentence);
    } else if (/\b(?:sign[- ]?up|register|registration|eligible|eligibility|selected|selection|invite|account|testers?|spots?|keys?|ID|phone number|travel)\b/i.test(sentence)) {
      add('Eligibility and access', sentence);
    } else if (/\b(?:20\d{2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june|july|aug(?:ust)?|sept(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|starts?|opens?|closes?|ends?|until|daily|hours?|days?|AM|PM)\b/i.test(sentence)) {
      add('Dates and schedule', sentence);
    } else if (/\b(?:class(?:es)?|jobs?|level|maps?|areas?|islands?|quests?|skills?|monsters?|crafting|equipment|auction|economy|trad(?:e|ing)|gold|shops?|market|currency|points?|launcher|macOS|Windows|controller|language)\b/i.test(sentence)) {
      add('Gameplay, content, and systems', sentence);
    } else if (/\b(?:reward|prize|rings?|coupons?|gift cards?|NX Cash|medal|vinyl|giveaway|perks?)\b/i.test(sentence)) {
      add('Rewards and benefits', sentence);
    } else if (/\b(?:maintenance|fix(?:es|ed)?|change(?:s|d)?|remove(?:s|d)?|restore(?:s|d)?|wipe|deleted|shut(?:s)? down|fee|cost)\b/i.test(sentence)) {
      add('Operational changes', sentence);
    } else if (/\b(?:video|trailer|survey|feedback|Discord|Facebook|Instagram|Douyin|Xianyu|Xiaohongshu)\b/i.test(sentence)) {
      add('Media and community context', sentence);
    } else {
      add('Confirmed report', sentence);
    }
  });

  const sourceName = record.author || record.source_id.replaceAll('-', ' ');
  buckets.set('Source and regional scope', [
    `${sourceName} is the indexed source for this ${record.content_type.replaceAll('-', ' ')} record.`,
    `The record applies to ${record.regions.map(label).join(', ')} and was last checked on ${record.last_checked.slice(0, 10)}.`,
    record.official
      ? 'The indexed publication is marked as an official first-party source.'
      : 'The indexed publication is not marked first-party; MPStorys keeps its reporting separate from official publisher statements.',
  ]);

  return [...buckets.entries()].map(([title, items]) => ({ title, items }));
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

  return sections.length > 0 ? sections : summaryDetailSections(record);
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
