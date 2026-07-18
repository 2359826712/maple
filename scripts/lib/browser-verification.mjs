import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { normalizeCanonicalUrl, repositoryRoot } from './resource-index.mjs';

export const browserVerificationPath = path.join(repositoryRoot, 'verification', 'browser-checks.json');
export const defaultBrowserVerificationMaxAgeDays = 30;

export async function readBrowserVerifications(filePath = browserVerificationPath) {
  try {
    const payload = JSON.parse(await readFile(filePath, 'utf8'));
    return Array.isArray(payload.checks) ? payload.checks : [];
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

export function getFreshBrowserVerification(
  checks,
  url,
  {
    now = new Date(),
    maxAgeDays = defaultBrowserVerificationMaxAgeDays,
  } = {},
) {
  const canonicalUrl = normalizeCanonicalUrl(url);
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  return checks.find((check) => {
    if (check.result !== 'verified' || normalizeCanonicalUrl(check.url) !== canonicalUrl) return false;
    const checkedAt = new Date(`${check.checked_at}T00:00:00Z`);
    const ageMs = now.getTime() - checkedAt.getTime();
    return Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= maxAgeMs;
  });
}
