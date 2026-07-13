export const regions = ['gms', 'kms', 'msea', 'jms', 'tms', 'all'] as const;

export type Region = (typeof regions)[number];

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export interface Provenance {
  source: string;
  sourceUrl: string;
  lastVerified: string;
}

export interface BossDataRecord extends Provenance {
  id: string;
  name: string;
  level: number;
  minLevel: number;
  difficulties: string[];
  resetType: 'daily' | 'weekly';
  regions: Region[];
}

export interface EventDataRecord extends Provenance {
  id: string;
  title: string;
  windowStart: string;
  windowEnd: string;
  regions: Region[];
  rewards: string[];
}

export interface NewsDataRecord {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  category: 'Patch Notes' | 'Event' | 'General' | 'Cash Shop';
  regions: Region[];
  sourceUrl: string;
  imageUrl?: string;
}

export interface WikiDataRecord {
  title: string;
  htmlContent: string;
  lastSynced: string;
  sourceUrl: string;
  categories: string[];
}

export interface ToolDataRecord extends Provenance {
  id: string;
  name: string;
  href: string;
  category: string;
  regions: Region[];
}

export const toolCategories = ['calculator', 'database', 'guide', 'tracker', 'simulator', 'utility', 'community'] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isIsoDate = (value: unknown): value is string =>
  isNonEmptyString(value) && Number.isFinite(Date.parse(value));

const isHttpsUrl = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

const validateRegions = (value: unknown, path: string, issues: ValidationIssue[]): value is Region[] => {
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => !regions.includes(entry as Region))) {
    issues.push({ path, message: 'Expected one or more supported region codes.' });
    return false;
  }
  if (value.includes('all') && value.length > 1) {
    issues.push({ path, message: 'The all region cannot be combined with another region.' });
    return false;
  }
  return true;
};

const validateProvenance = (value: Record<string, unknown>, issues: ValidationIssue[]) => {
  if (!isNonEmptyString(value.source)) issues.push({ path: 'source', message: 'Source is required.' });
  if (!isHttpsUrl(value.sourceUrl)) issues.push({ path: 'sourceUrl', message: 'Expected an HTTPS source URL.' });
  if (!isIsoDate(value.lastVerified)) issues.push({ path: 'lastVerified', message: 'Expected an ISO verification date.' });
};

const result = <T>(value: unknown, issues: ValidationIssue[]): ValidationResult<T> =>
  issues.length === 0
    ? { ok: true, value: value as T }
    : { ok: false, issues };

export function validateBossData(value: unknown): ValidationResult<BossDataRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: '', message: 'Expected an object.' }] };
  if (!isNonEmptyString(value.id)) issues.push({ path: 'id', message: 'ID is required.' });
  if (!isNonEmptyString(value.name)) issues.push({ path: 'name', message: 'Name is required.' });
  if (typeof value.level !== 'number' || value.level <= 0) issues.push({ path: 'level', message: 'Level must be positive.' });
  if (typeof value.minLevel !== 'number' || value.minLevel <= 0) issues.push({ path: 'minLevel', message: 'Minimum level must be positive.' });
  if (typeof value.level === 'number' && typeof value.minLevel === 'number' && value.minLevel > value.level) {
    issues.push({ path: 'minLevel', message: 'Minimum level cannot exceed boss level.' });
  }
  if (!Array.isArray(value.difficulties) || value.difficulties.length === 0 || value.difficulties.some((item) => !isNonEmptyString(item))) {
    issues.push({ path: 'difficulties', message: 'At least one difficulty is required.' });
  }
  if (value.resetType !== 'daily' && value.resetType !== 'weekly') issues.push({ path: 'resetType', message: 'Expected daily or weekly.' });
  validateRegions(value.regions, 'regions', issues);
  validateProvenance(value, issues);
  return result<BossDataRecord>(value, issues);
}

export function validateEventData(value: unknown): ValidationResult<EventDataRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: '', message: 'Expected an object.' }] };
  if (!isNonEmptyString(value.id)) issues.push({ path: 'id', message: 'ID is required.' });
  if (!isNonEmptyString(value.title)) issues.push({ path: 'title', message: 'Title is required.' });
  if (!isIsoDate(value.windowStart)) issues.push({ path: 'windowStart', message: 'Expected an ISO start date.' });
  if (!isIsoDate(value.windowEnd)) issues.push({ path: 'windowEnd', message: 'Expected an ISO end date.' });
  if (isIsoDate(value.windowStart) && isIsoDate(value.windowEnd) && Date.parse(value.windowEnd) <= Date.parse(value.windowStart)) {
    issues.push({ path: 'windowEnd', message: 'Event end must be after its start.' });
  }
  if (!Array.isArray(value.rewards) || value.rewards.some((item) => !isNonEmptyString(item))) issues.push({ path: 'rewards', message: 'Expected reward strings.' });
  validateRegions(value.regions, 'regions', issues);
  validateProvenance(value, issues);
  return result<EventDataRecord>(value, issues);
}

export function validateNewsData(value: unknown): ValidationResult<NewsDataRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: '', message: 'Expected an object.' }] };
  for (const key of ['id', 'title', 'excerpt', 'author'] as const) {
    if (!isNonEmptyString(value[key])) issues.push({ path: key, message: `${key} is required.` });
  }
  if (!isIsoDate(value.publishedAt) || Date.parse(String(value.publishedAt)) > Date.now()) issues.push({ path: 'publishedAt', message: 'Expected a non-future ISO publication date.' });
  if (!['Patch Notes', 'Event', 'General', 'Cash Shop'].includes(String(value.category))) issues.push({ path: 'category', message: 'Unknown news category.' });
  if (!isHttpsUrl(value.sourceUrl)) issues.push({ path: 'sourceUrl', message: 'Expected an HTTPS source URL.' });
  if (value.imageUrl !== undefined && !isHttpsUrl(value.imageUrl)) issues.push({ path: 'imageUrl', message: 'Expected an HTTPS image URL.' });
  validateRegions(value.regions, 'regions', issues);
  return result<NewsDataRecord>(value, issues);
}

export function validateWikiData(value: unknown): ValidationResult<WikiDataRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: '', message: 'Expected an object.' }] };
  if (!isNonEmptyString(value.title)) issues.push({ path: 'title', message: 'Title is required.' });
  if (!isNonEmptyString(value.htmlContent)) issues.push({ path: 'htmlContent', message: 'HTML content is required.' });
  if (!isIsoDate(value.lastSynced)) issues.push({ path: 'lastSynced', message: 'Expected an ISO sync date.' });
  if (!isHttpsUrl(value.sourceUrl)) issues.push({ path: 'sourceUrl', message: 'Expected an HTTPS source URL.' });
  if (!Array.isArray(value.categories) || value.categories.some((item) => !isNonEmptyString(item))) issues.push({ path: 'categories', message: 'Expected category strings.' });
  return result<WikiDataRecord>(value, issues);
}

export function validateToolData(value: unknown): ValidationResult<ToolDataRecord> {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) return { ok: false, issues: [{ path: '', message: 'Expected an object.' }] };
  for (const key of ['id', 'name'] as const) {
    if (!isNonEmptyString(value[key])) issues.push({ path: key, message: `${key} is required.` });
  }
  if (!isHttpsUrl(value.href)) issues.push({ path: 'href', message: 'Expected an HTTPS tool URL.' });
  if (!toolCategories.includes(value.category as (typeof toolCategories)[number])) {
    issues.push({ path: 'category', message: 'Unknown tool category.' });
  }
  validateRegions(value.regions, 'regions', issues);
  validateProvenance(value, issues);
  return result<ToolDataRecord>(value, issues);
}
