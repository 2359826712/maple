import { readdir, readFile, stat } from 'node:fs/promises';

const output = new URL('../out/', import.meta.url);
const [robots, sitemap, index, iconStats, assetNames] = await Promise.all([
  readFile(new URL('robots.txt', output), 'utf8'),
  readFile(new URL('sitemap.xml', output), 'utf8'),
  readFile(new URL('index.html', output), 'utf8'),
  stat(new URL('mpstorys-icon-128.jpg', output)),
  readdir(new URL('assets/', output)),
]);

const scriptSizes = await Promise.all(
  assetNames.filter((name) => name.endsWith('.js')).map(async (name) => ({
    name,
    size: (await stat(new URL(`assets/${name}`, output))).size,
  })),
);
const oversizedScripts = scriptSizes.filter(({ size }) => size > 500 * 1024);

const assertions = [
  [robots.includes('Sitemap: https://mpstorys.com/sitemap.xml'), 'robots.txt is missing the production sitemap URL'],
  [sitemap.includes('<urlset') && sitemap.includes('https://mpstorys.com/'), 'sitemap.xml is missing valid production URLs'],
  [index.includes('meta name="description"'), 'index.html is missing a meta description'],
  [index.includes('link rel="canonical"'), 'index.html is missing a canonical link'],
  [index.includes('/mpstorys-icon-128.jpg'), 'index.html does not reference the optimized site icon'],
  [iconStats.size < 20 * 1024, `mpstorys-icon-128.jpg is ${iconStats.size} bytes; it must be under 20 KB`],
  [oversizedScripts.length === 0, `JavaScript chunks exceed 500 KB: ${oversizedScripts.map(({ name, size }) => `${name} (${size} bytes)`).join(', ')}`],
];

const failures = assertions.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  throw new Error(`SEO output verification failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Verified robots.txt, sitemap.xml, canonical metadata, ${iconStats.size}-byte site icon, and ${scriptSizes.length} JavaScript chunks under 500 KB.`);
