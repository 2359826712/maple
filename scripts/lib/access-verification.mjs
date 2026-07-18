import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  browserVerificationPath,
  defaultBrowserVerificationMaxAgeDays,
  getFreshBrowserVerification,
  readBrowserVerifications,
} from './browser-verification.mjs';
import { repositoryRoot } from './resource-index.mjs';

export const indexedVerificationPath = path.join(repositoryRoot, 'verification', 'indexed-checks.json');

async function readIndexedVerifications(filePath = indexedVerificationPath) {
  try {
    const payload = JSON.parse(await readFile(filePath, 'utf8'));
    return Array.isArray(payload.checks) ? payload.checks : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

export async function readAccessVerifications({
  browserPath = browserVerificationPath,
  indexedPath = indexedVerificationPath,
} = {}) {
  const [browserChecks, indexedChecks] = await Promise.all([
    readBrowserVerifications(browserPath),
    readIndexedVerifications(indexedPath),
  ]);
  return [...browserChecks, ...indexedChecks];
}

export function getFreshAccessVerification(
  checks,
  url,
  options = { maxAgeDays: defaultBrowserVerificationMaxAgeDays },
) {
  return getFreshBrowserVerification(checks, url, options);
}
