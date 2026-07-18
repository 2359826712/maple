import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libraryDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repositoryRoot = path.resolve(libraryDirectory, '..', '..');
export const resourcesDirectory = path.join(repositoryRoot, 'resources');
export const generatedDirectory = path.join(repositoryRoot, 'generated');
export const schemaPath = path.join(repositoryRoot, 'schemas', 'resource.schema.json');

export const supportedSeries = ['classic', 'idle', 'm', 'maplestory', 'n', 'worlds'];

export const removableTrackingParameters = new Set([
  'fbclid',
  'gclid',
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term',
]);

export const compareStrings = (left, right) => (
  left === right ? 0 : left < right ? -1 : 1
);

export function normalizeCanonicalUrl(value, { preserveFragment = false } = {}) {
  const url = new URL(value);

  if (url.protocol === 'http:') url.protocol = 'https:';
  url.hostname = url.hostname.toLowerCase();

  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }

  for (const key of [...url.searchParams.keys()]) {
    if (removableTrackingParameters.has(key.toLowerCase())) url.searchParams.delete(key);
  }
  url.searchParams.sort();

  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
  if (!preserveFragment) url.hash = '';

  return url.toString();
}

async function walkJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => compareStrings(a.name, b.name))) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkJsonFiles(absolutePath));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(absolutePath);
  }

  return files;
}

export async function readResourceRecords(directory = resourcesDirectory) {
  const files = await walkJsonFiles(directory);
  return Promise.all(files.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8');
    return {
      data: JSON.parse(source),
      filePath,
      relativePath: path.relative(repositoryRoot, filePath).replaceAll(path.sep, '/'),
    };
  }));
}

function duplicateGroups(records, keyForRecord) {
  const groups = new Map();
  for (const record of records) {
    const key = keyForRecord(record);
    const group = groups.get(key) || [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([value, group]) => ({ value, records: group }))
    .sort((a, b) => compareStrings(a.value, b.value));
}

export function findDuplicateResources(records) {
  return {
    ids: duplicateGroups(records, (record) => record.data.id),
    urls: duplicateGroups(records, (record) => normalizeCanonicalUrl(record.data.url)),
  };
}

function buildGroupedIndex(resources, field) {
  const groups = new Map();
  for (const resource of resources) {
    const values = Array.isArray(resource[field]) ? resource[field] : [resource[field]];
    for (const value of values) {
      const ids = groups.get(value) || [];
      ids.push(resource.id);
      groups.set(value, ids);
    }
  }
  return [...groups.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([id, resourceIds]) => ({
      id,
      count: resourceIds.length,
      resource_ids: resourceIds.sort(compareStrings),
    }));
}

export function createGeneratedIndexes(records) {
  const resources = records
    .map((record) => record.data)
    .sort((a, b) => compareStrings(a.id, b.id));
  const websitesByName = new Map();

  for (const resource of resources) {
    const ids = websitesByName.get(resource.website) || [];
    ids.push(resource.id);
    websitesByName.set(resource.website, ids);
  }

  const websites = [...websitesByName.entries()]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([name, resourceIds]) => ({
      name,
      count: resourceIds.length,
      resource_ids: resourceIds.sort(compareStrings),
    }));

  const categories = buildGroupedIndex(resources, 'category');
  const series = buildGroupedIndex(resources, 'series');
  const regions = buildGroupedIndex(resources, 'regions');
  const languages = buildGroupedIndex(resources, 'languages');
  const tags = buildGroupedIndex(resources, 'tags');
  const statuses = buildGroupedIndex(resources, 'status');
  const verificationDates = resources.map((resource) => resource.last_checked).sort(compareStrings);
  const statistics = {
    total_resources: resources.length,
    total_websites: websites.length,
    series: Object.fromEntries(series.map((entry) => [entry.id, entry.count])),
    categories: Object.fromEntries(categories.map((entry) => [entry.id, entry.count])),
    statuses: Object.fromEntries(statuses.map((entry) => [entry.id, entry.count])),
    latest_verification_date: verificationDates.at(-1) || null,
  };
  const search = resources.map((resource) => ({
    record_type: 'resource',
    id: resource.id,
    title: resource.name,
    summary: resource.description,
    name: resource.name,
    website: resource.website,
    page: resource.page,
    description: resource.description,
    series: resource.series,
    category: resource.category,
    subcategory: resource.subcategory,
    regions: resource.regions,
    languages: resource.languages,
    tags: resource.tags,
    status: resource.status,
    published_at: null,
    event_start: null,
    event_end: null,
    class_name: null,
    boss_name: null,
    game_version: null,
    official: resource.official,
    url: resource.url,
  }));

  return { resources, websites, categories, series, regions, languages, tags, statistics, search };
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
