import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { contentDirectory, readContentRecords, readSourceRecords, sourcesDirectory } from './data.mjs';
import { repositoryRoot } from '../lib/resource-index.mjs';

export const contentManifestSchemaVersion = 1;

function hashText(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function manifestEntries(records, idField) {
  return records
    .map((record) => ({
      path: record.relativePath,
      id: record.data[idField],
      file_sha256: record.fileHash,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

export function createContentManifest(contentRecords, sourceRecords) {
  const content = manifestEntries(contentRecords, 'id');
  const sources = manifestEntries(sourceRecords, 'id');
  const rootPayload = JSON.stringify({ schema_version: contentManifestSchemaVersion, content, sources });
  const timestamps = contentRecords
    .map((record) => record.data.last_checked)
    .filter(Boolean)
    .sort();

  return {
    schema_version: contentManifestSchemaVersion,
    generated_at: timestamps.at(-1) || null,
    file_count: content.length,
    source_count: sources.length,
    root_sha256: hashText(rootPayload),
    content,
    sources,
  };
}

function resolveManifestPath(relativePath, allowedRoot) {
  const resolved = path.resolve(repositoryRoot, ...String(relativePath).split('/'));
  const root = `${path.resolve(allowedRoot)}${path.sep}`;
  if (!resolved.startsWith(root) || !resolved.endsWith('.json')) {
    throw new Error(`manifest path escapes its allowed directory: ${JSON.stringify(relativePath)}`);
  }
  return resolved;
}

async function readManifestRecords(entries, allowedRoot) {
  return Promise.all(entries.map(async (entry) => {
    const filePath = resolveManifestPath(entry.path, allowedRoot);
    const rawText = await readFile(filePath, 'utf8');
    const fileHash = hashText(rawText);
    if (fileHash !== entry.file_sha256) {
      throw new Error(`snapshot mismatch for ${entry.path}: expected ${entry.file_sha256}, received ${fileHash}`);
    }
    const data = JSON.parse(rawText);
    if (data.id !== entry.id) throw new Error(`snapshot id mismatch for ${entry.path}`);
    return { data, fileHash, filePath, relativePath: entry.path };
  }));
}

export function validateContentManifest(manifest) {
  if (manifest?.schema_version !== contentManifestSchemaVersion) {
    throw new Error(`unsupported content manifest schema version ${JSON.stringify(manifest?.schema_version)}`);
  }
  if (!Array.isArray(manifest.content) || !Array.isArray(manifest.sources)) {
    throw new Error('content manifest must contain content and sources arrays');
  }
  if (manifest.file_count !== manifest.content.length || manifest.source_count !== manifest.sources.length) {
    throw new Error('content manifest counts do not match its entries');
  }
  const expected = createHash('sha256').update(JSON.stringify({
    schema_version: manifest.schema_version,
    content: manifest.content,
    sources: manifest.sources,
  }), 'utf8').digest('hex');
  if (manifest.root_sha256 !== expected) throw new Error('content manifest root hash is invalid');
}

export async function readPublisherSnapshot(manifestPath) {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  validateContentManifest(manifest);
  const [contentRecords, sourceRecords] = await Promise.all([
    readManifestRecords(manifest.content, contentDirectory),
    readManifestRecords(manifest.sources, sourcesDirectory),
  ]);
  return { manifest, contentRecords, sourceRecords };
}

export async function createCurrentContentManifest() {
  const [contentRecords, sourceRecords] = await Promise.all([readContentRecords(), readSourceRecords()]);
  return createContentManifest(contentRecords, sourceRecords);
}
