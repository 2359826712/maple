import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registrySource = await readFile(resolve(root, 'src/mocks/communityTools.ts'), 'utf8');
const entries = [...registrySource.matchAll(/\{\s*id:\s*'([^']+)'[\s\S]*?href:\s*'([^']+)'/g)]
  .map((match) => ({ id: match[1], url: match[2] }));
const declaredEntryCount = (registrySource.match(/\n\s*id:\s*'/g) || []).length;

if (entries.length === 0 || entries.length !== declaredEntryCount) {
  throw new Error(`Registry extraction mismatch: found ${entries.length} links for ${declaredEntryCount} declared entries.`);
}
if (new Set(entries.map((entry) => entry.id)).size !== entries.length) {
  throw new Error('Curated tool IDs must be unique.');
}
if (new Set(entries.map((entry) => entry.url)).size !== entries.length) {
  throw new Error('Curated tool URLs must be unique.');
}

const check = async ({ id, url }) => {
  for (const method of ['HEAD', 'GET']) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        method,
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': 'MapleHub-LinkCheck/1.0 (+https://maplehub.local)' },
      });
      if (response.status >= 200 && response.status < 300) {
        return { id, url, ok: true, status: response.status, finalUrl: response.url };
      }
      if (method === 'GET' || ![403, 405, 429].includes(response.status)) {
        return { id, url, ok: false, status: response.status, finalUrl: response.url };
      }
    } catch (error) {
      if (method === 'GET') {
        return { id, url, ok: false, status: 0, error: error instanceof Error ? error.name : 'request-failed' };
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  return { id, url, ok: false, status: 0, error: 'request-failed' };
};

const results = [];
const queue = [...entries];
await Promise.all(Array.from({ length: Math.min(6, queue.length) }, async () => {
  while (queue.length > 0) results.push(await check(queue.shift()));
}));
results.sort((left, right) => left.id.localeCompare(right.id));

for (const result of results) {
  const detail = result.status || result.error || 'failed';
  console.log(`${result.ok ? 'PASS' : 'FAIL'}\t${detail}\t${result.id}\t${result.url}`);
}

const failures = results.filter((result) => !result.ok);
console.log(`Checked ${results.length} curated tool links: ${results.length - failures.length} passed, ${failures.length} failed.`);
if (failures.length > 0) process.exitCode = 1;
