import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { crawlStateDirectory, writeJson } from './data.mjs';

export const crawlStatePath = path.join(crawlStateDirectory, 'state.json');

export async function readCrawlState(filePath = crawlStatePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return { version: 1, sources: {} };
    throw error;
  }
}

export async function writeCrawlState(state, filePath = crawlStatePath) {
  await writeJson(filePath, state);
}

export function sourceState(state, sourceId) {
  state.sources[sourceId] ||= { urls: {}, cursor: null, last_checked: null, last_success: null, last_error: null };
  return state.sources[sourceId];
}
