import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crawlStateDirectory } from './data.mjs';

export const historicalStateDirectory = path.join(crawlStateDirectory, 'history');

export function historicalStatePath(sourceId, root = historicalStateDirectory) {
  return path.join(root, `${sourceId}.json`);
}

export function createHistoricalState(sourceId, now = new Date().toISOString()) {
  return {
    version: 1,
    source_id: sourceId,
    current_page: 0,
    last_cursor: null,
    last_page_url: null,
    pages_completed: 0,
    pages_failed: 0,
    items_processed: 0,
    items_saved: 0,
    items_added: 0,
    items_updated: 0,
    items_skipped: 0,
    duplicates: 0,
    parser_errors: 0,
    http_errors: 0,
    retry_count: 0,
    consecutive_duplicates: 0,
    consecutive_404s: 0,
    started_at: now,
    updated_at: now,
    completed: false,
    stop_reason: null,
    next_page: null,
    http_state: { urls: {}, cursor: null, last_checked: null, last_success: null, last_error: null },
  };
}

export async function readHistoricalState(sourceId, root = historicalStateDirectory) {
  const filePath = historicalStatePath(sourceId, root);
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function writeHistoricalState(state, root = historicalStateDirectory) {
  const filePath = historicalStatePath(state.source_id, root);
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, filePath);
  return filePath;
}
