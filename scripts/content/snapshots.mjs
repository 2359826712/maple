import path from 'node:path';
import { snapshotsDirectory, writeJson } from './data.mjs';

export function changedFields(previous, next) {
  const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
  return [...keys]
    .filter((key) => JSON.stringify(previous[key]) !== JSON.stringify(next[key]))
    .sort();
}

export async function createRevisionSnapshot(previous, next, {
  detectedAt = new Date().toISOString(),
  root = snapshotsDirectory,
  write = true,
} = {}) {
  if (previous.content_hash === next.content_hash) return null;
  const snapshot = {
    content_id: previous.id,
    detected_at: detectedAt,
    old_hash: previous.content_hash,
    new_hash: next.content_hash,
    changed_fields: changedFields(previous, next),
    record: previous,
  };
  const timestamp = detectedAt.replace(/[:.]/g, '-');
  const filePath = path.join(root, previous.id, `${timestamp}.json`);
  if (write) await writeJson(filePath, snapshot);
  return { filePath, snapshot };
}
