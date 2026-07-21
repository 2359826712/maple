import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { readPublisherSnapshot } from './manifest.mjs';

export const contentReleaseSchemaVersion = 1;

const releaseIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hashPattern = /^[a-f0-9]{64}$/;

export function createContentRelease(manifest, {
  manifestUri = 'content-manifest.json',
  source = 'repository-content',
} = {}) {
  return {
    schema_version: contentReleaseSchemaVersion,
    release_id: `content-${manifest.root_sha256.slice(0, 16)}`,
    manifest_uri: manifestUri,
    manifest_hash: manifest.root_sha256,
    generated_at: manifest.generated_at,
    source,
    files: manifest.file_count,
  };
}

export function validateContentRelease(release) {
  const errors = [];
  if (!release || typeof release !== 'object' || Array.isArray(release)) {
    return ['release must be an object'];
  }
  const expectedKeys = [
    'files',
    'generated_at',
    'manifest_hash',
    'manifest_uri',
    'release_id',
    'schema_version',
    'source',
  ];
  const actualKeys = Object.keys(release).sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    errors.push(`release fields must be exactly ${expectedKeys.join(', ')}`);
  }
  if (release.schema_version !== contentReleaseSchemaVersion) errors.push('unsupported release schema version');
  if (typeof release.release_id !== 'string' || release.release_id.length > 160 || !releaseIdPattern.test(release.release_id)) {
    errors.push('release_id must be a lowercase URL-safe identifier');
  }
  if (typeof release.manifest_uri !== 'string' || !release.manifest_uri.trim()) {
    errors.push('manifest_uri is required');
  }
  if (typeof release.manifest_hash !== 'string' || !hashPattern.test(release.manifest_hash)) {
    errors.push('manifest_hash must be a lowercase SHA-256 hash');
  }
  if (release.generated_at !== null && (
    typeof release.generated_at !== 'string' || Number.isNaN(Date.parse(release.generated_at))
  )) {
    errors.push('generated_at must be a date-time or null');
  }
  if (typeof release.source !== 'string' || release.source.length > 64 || !releaseIdPattern.test(release.source)) {
    errors.push('source must be a lowercase URL-safe identifier');
  }
  if (!Number.isInteger(release.files) || release.files < 0) errors.push('files must be a non-negative integer');
  return errors;
}

export function assertReleaseMatchesManifest(release, manifest) {
  const errors = validateContentRelease(release);
  if (errors.length) throw new Error(`invalid content release: ${errors.join('; ')}`);
  if (release.manifest_hash !== manifest.root_sha256) throw new Error('release manifest_hash does not match manifest');
  if (release.files !== manifest.file_count) throw new Error('release files count does not match manifest');
  if (release.generated_at !== manifest.generated_at) throw new Error('release generated_at does not match manifest');
}

function localManifestPath(releasePath, manifestUri) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(manifestUri)) {
    throw new Error('translation planning requires a locally materialized release package');
  }
  const releaseDirectory = path.dirname(path.resolve(releasePath));
  const manifestPath = path.resolve(releaseDirectory, ...manifestUri.split('/'));
  const boundary = `${releaseDirectory}${path.sep}`;
  if (!manifestPath.startsWith(boundary)) throw new Error('manifest_uri escapes the release package');
  return manifestPath;
}

export async function readContentReleaseSnapshot(releasePath) {
  const release = JSON.parse(await readFile(releasePath, 'utf8'));
  const errors = validateContentRelease(release);
  if (errors.length) throw new Error(`invalid content release: ${errors.join('; ')}`);
  const manifestPath = localManifestPath(releasePath, release.manifest_uri);
  const snapshot = await readPublisherSnapshot(manifestPath);
  assertReleaseMatchesManifest(release, snapshot.manifest);
  return { release, manifestPath, ...snapshot };
}
