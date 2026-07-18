import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { repositoryRoot, compareStrings } from '../lib/resource-index.mjs';

export const sourcesDirectory = path.join(repositoryRoot, 'sources');
export const contentDirectory = path.join(repositoryRoot, 'content');
export const rawDirectory = path.join(repositoryRoot, 'raw');
export const snapshotsDirectory = path.join(repositoryRoot, 'snapshots');
export const crawlStateDirectory = path.join(repositoryRoot, 'crawl-state');

export const supportedContentTypes = [
  'api-announcement',
  'cash-shop',
  'creator-announcement',
  'developer-note',
  'event',
  'guide',
  'maintenance',
  'news',
  'patch-note',
  'roadmap',
];

export const contentTypeDirectories = {
  'api-announcement': 'api-announcements',
  'cash-shop': 'cash-shop',
  'creator-announcement': 'creator-announcements',
  'developer-note': 'developer-notes',
  event: 'events',
  guide: 'guides',
  maintenance: 'maintenance',
  news: 'news',
  'patch-note': 'patch-notes',
  roadmap: 'roadmaps',
};

export const directoryContentTypes = Object.fromEntries(
  Object.entries(contentTypeDirectories).map(([type, directory]) => [directory, type]),
);

async function walkJsonFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }

  const files = [];
  for (const entry of entries.sort((left, right) => compareStrings(left.name, right.name))) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkJsonFiles(filePath));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(filePath);
  }
  return files;
}

async function readRecords(directory) {
  const files = await walkJsonFiles(directory);
  return Promise.all(files.map(async (filePath) => ({
    data: JSON.parse(await readFile(filePath, 'utf8')),
    filePath,
    relativePath: path.relative(repositoryRoot, filePath).replaceAll(path.sep, '/'),
  })));
}

export const readSourceRecords = (directory = sourcesDirectory) => readRecords(directory);
export const readContentRecords = (directory = contentDirectory) => readRecords(directory);

export function contentRecordPath(record, root = contentDirectory) {
  const year = (record.published_at || record.discovered_at).slice(0, 4);
  return path.join(root, contentTypeDirectories[record.content_type], record.series, year, `${record.id}.json`);
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
