import { setTimeout as delay } from 'node:timers/promises';
import { normalizeCanonicalUrl, readResourceRecords } from './lib/resource-index.mjs';
import {
  getFreshAccessVerification,
  readAccessVerifications,
} from './lib/access-verification.mjs';

const transientStatuses = new Set([408, 425, 429, 500, 502, 503, 504]);
const manualReviewStatuses = new Set([401, 403, 429]);
const permanentFailureStatuses = new Set([404, 410]);

async function request(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'user-agent': 'MPStorys-Resource-Index/1.0 (+https://mpstorys.com)',
      },
    });
    await response.body?.cancel();
    return { response };
  } catch (error) {
    return { error };
  } finally {
    clearTimeout(timeout);
  }
}

async function check(url) {
  let result;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    result = await request(url);
    if (result.response && !transientStatuses.has(result.response.status)) break;
    if (attempt === 0) await delay(750);
  }
  return result;
}

const records = await readResourceRecords();
const accessVerifications = await readAccessVerifications();
const failures = [];
const manualReview = [];

for (const [index, record] of records.entries()) {
  const result = await check(record.data.url);
  if (result.response) {
    const { status, url: finalUrl } = result.response;
    const redirect = normalizeCanonicalUrl(finalUrl) !== normalizeCanonicalUrl(record.data.url)
      ? ` -> ${finalUrl}`
      : '';
    const accessVerification = manualReviewStatuses.has(status)
      ? getFreshAccessVerification(accessVerifications, record.data.url)
      : undefined;
    const verificationSuffix = accessVerification
      ? ` | ${accessVerification.method} verified ${accessVerification.checked_at}: ${accessVerification.page_title}`
      : '';
    console.log(`[${index + 1}/${records.length}] ${status} ${record.data.url}${redirect}${verificationSuffix}`);
    if (permanentFailureStatuses.has(status)) failures.push(`${record.relativePath}: HTTP ${status}`);
    else if ((manualReviewStatuses.has(status) || status >= 400) && !accessVerification) {
      manualReview.push(`${record.relativePath}: HTTP ${status}`);
    }
  } else {
    const message = result.error instanceof Error ? result.error.message : String(result.error);
    console.log(`[${index + 1}/${records.length}] NETWORK ${record.data.url}: ${message}`);
    manualReview.push(`${record.relativePath}: network error (${message})`);
  }
  if (index < records.length - 1) await delay(250);
}

if (manualReview.length > 0) {
  console.warn(`Manual review recommended for ${manualReview.length} resource(s):`);
  manualReview.forEach((item) => console.warn(`- ${item}`));
}

if (failures.length > 0) {
  console.error(`Confirmed link failures: ${failures.length}`);
  failures.forEach((item) => console.error(`- ${item}`));
  process.exitCode = 1;
} else {
  console.log(`Checked ${records.length} resource link(s) with no confirmed permanent failures.`);
}
