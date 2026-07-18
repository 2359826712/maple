import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceFiles = [
  'src/mocks/home.ts',
  'src/mocks/mapler-house.ts',
  'src/mocks/class-rankings.ts',
];
const outputDir = 'public/static/images/readdy';
const imageUrlPattern = /https:\/\/readdy\.ai\/api\/search-image\?[^'"`\s]+/g;

const sources = await Promise.all(
  sourceFiles.map(async (file) => ({ file, text: await readFile(file, 'utf8') })),
);
const urls = [...new Set(sources.flatMap(({ text }) => text.match(imageUrlPattern) || []))];

await mkdir(outputDir, { recursive: true });

const extensionFor = (contentType) => {
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('png')) return '.png';
  return '.jpg';
};

const replacements = new Map();
let cursor = 0;

async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    const response = await fetch(url, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; MPStorysStaticAssets/1.0)' },
      redirect: 'follow',
    });
    if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected content type for ${url}: ${contentType || 'unknown'}`);
    }

    const requestUrl = new URL(url);
    const seq = requestUrl.searchParams.get('seq') || createHash('sha256').update(url).digest('hex').slice(0, 20);
    const filename = `${seq.replace(/[^a-z0-9_-]/gi, '-')}${extensionFor(contentType)}`;
    const publicPath = `/static/images/readdy/${filename}`;
    await writeFile(path.join(outputDir, filename), Buffer.from(await response.arrayBuffer()));
    replacements.set(url, publicPath);
  }
}

await Promise.all(Array.from({ length: Math.min(8, urls.length || 1) }, () => worker()));

for (const source of sources) {
  let nextText = source.text;
  for (const [url, publicPath] of replacements) nextText = nextText.replaceAll(url, publicPath);
  if (nextText !== source.text) await writeFile(source.file, nextText, 'utf8');
}

console.log(`Localized ${urls.length} Readdy images into ${outputDir}.`);
