import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = 'src';
const outputRoot = 'public/static/images/vendor';
const sourceExtensions = new Set(['.css', '.ts', '.tsx']);
const imageHosts = new Set([
  'd3uzjcc4cyf4cj.cloudfront.net',
  'g.nexonstatic.com',
  'grandislibrary.com',
  'i.ytimg.com',
  'media.maplestorywiki.net',
  'readdy.ai',
  'static.wikia.nocookie.net',
]);
const externalUrlPattern = /https:\/\/[^\s'"`<>\\)]+/g;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    if (!sourceExtensions.has(path.extname(entry.name)) || entry.name.includes('.test.')) return [];
    return [entryPath];
  }));
  return files.flat();
}

const sourceFiles = await collectSourceFiles(sourceRoot);
const sources = await Promise.all(
  sourceFiles.map(async (file) => ({ file, text: await readFile(file, 'utf8') })),
);

const isExternalImage = (value) => {
  if (value.includes('${')) return false;
  try {
    const url = new URL(value);
    return imageHosts.has(url.hostname) && (
      /\.(?:png|jpe?g|webp)(?:\/|$)/i.test(url.pathname)
      || (url.hostname === 'readdy.ai' && url.pathname === '/api/search-image')
    );
  } catch {
    return false;
  }
};

const urls = [...new Set(sources.flatMap(({ text }) => (
  (text.match(externalUrlPattern) || []).map((url) => url.replace(/[.,;]+$/, '')).filter(isExternalImage)
)))];

const extensionFor = (contentType, url) => {
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  const pathnameExtension = path.extname(new URL(url).pathname).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(pathnameExtension) ? pathnameExtension : '.img';
};

const assetNameFor = (url, extension) => {
  const parsed = new URL(url);
  const originalName = path.basename(parsed.pathname).replace(/\.(?:png|jpe?g|webp)$/i, '');
  const slug = (parsed.searchParams.get('seq') || originalName || 'image')
    .replace(/[^a-z0-9_-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .toLowerCase();
  const hash = createHash('sha256').update(url).digest('hex').slice(0, 10);
  return `${slug || 'image'}-${hash}${extension}`;
};

await mkdir(outputRoot, { recursive: true });

const replacements = new Map();
const failures = [];
let cursor = 0;

async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    try {
      const response = await fetch(url, {
        headers: {
          accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          referer: new URL(url).origin,
          'user-agent': 'Mozilla/5.0 (compatible; MPStorysStaticAssets/1.0)',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(45_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) throw new Error(`unexpected content type ${contentType || 'unknown'}`);

      const hostDirectory = new URL(url).hostname.replace(/[^a-z0-9.-]/gi, '-');
      const outputDirectory = path.join(outputRoot, hostDirectory);
      const extension = extensionFor(contentType, url);
      const filename = assetNameFor(url, extension);
      await mkdir(outputDirectory, { recursive: true });
      await writeFile(path.join(outputDirectory, filename), Buffer.from(await response.arrayBuffer()));
      replacements.set(url, `/static/images/vendor/${hostDirectory}/${filename}`);
    } catch (error) {
      failures.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }
}

await Promise.all(Array.from({ length: Math.min(8, urls.length || 1) }, () => worker()));

for (const source of sources) {
  let nextText = source.text;
  for (const [url, publicPath] of replacements) nextText = nextText.replaceAll(url, publicPath);
  if (nextText !== source.text) await writeFile(source.file, nextText, 'utf8');
}

console.log(`Localized ${replacements.size} of ${urls.length} external images into ${outputRoot}.`);
for (const failure of failures) console.warn(`Skipped ${failure.url}: ${failure.error}`);
if (failures.length > 0) process.exitCode = 1;
