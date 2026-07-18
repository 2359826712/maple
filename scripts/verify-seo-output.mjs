import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function verifySeoOutput() {
const output = new URL('../out/', import.meta.url);
const [robots, sitemap, index, localizedGuide, privateAccount, iconStats, socialImageStats, assetNames] = await Promise.all([
  readFile(new URL('robots.txt', output), 'utf8'),
  readFile(new URL('sitemap.xml', output), 'utf8'),
  readFile(new URL('index.html', output), 'utf8'),
  readFile(new URL('guides/zh/KMS/index.html', output), 'utf8'),
  readFile(new URL('account/en/GMS/index.html', output), 'utf8'),
  stat(new URL('mpstorys-icon-128.jpg', output)),
  stat(new URL('og.png', output)),
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
  [robots.includes('Disallow: /account') && robots.includes('Disallow: /admin/') && robots.includes('Disallow: /auth/login'), 'robots.txt is missing private route crawl blocks'],
  [sitemap.includes('<urlset') && sitemap.includes('https://mpstorys.com/'), 'sitemap.xml is missing valid production URLs'],
  [sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'sitemap.xml is missing the localized URL namespace'],
  [sitemap.includes('hreflang="x-default"'), 'sitemap.xml is missing x-default alternates'],
  [!sitemap.includes('<changefreq>') && !sitemap.includes('<priority>'), 'sitemap.xml contains fields ignored by Google'],
  [index.includes('meta name="description"'), 'index.html is missing a meta description'],
  [index.includes('link rel="canonical"'), 'index.html is missing a canonical link'],
  [index.includes('meta name="keywords"'), 'index.html is missing website keywords required by the Readdy SEO configuration'],
  [index.includes('link rel="icon" type="image/jpeg" sizes="128x128" href="https://mpstorys.com/mpstorys-icon-128.jpg"'), 'index.html is missing the stable domain-level JPG favicon'],
  [index.includes('link rel="apple-touch-icon" sizes="128x128" href="/mpstorys-icon-128.jpg"'), 'index.html is missing the Apple touch icon'],
  [index.includes('meta property="og:image:secure_url"') && index.includes('link rel="image_src"'), 'index.html is missing complete website image metadata'],
  [socialImageStats.size > 0, 'og.png is missing or empty'],
  [localizedGuide.includes('type="application/ld+json" data-seo-schema="route"'), 'localized route HTML is missing static JSON-LD'],
  [localizedGuide.includes('data-ssg-route="/guides/zh/KMS"'), 'localized route HTML is missing its React SSG marker'],
  [localizedGuide.includes('id="main-content"') && !localizedGuide.includes('data-static-seo-fallback'), 'localized route HTML does not contain the rendered React page body'],
  [localizedGuide.includes('冒险岛攻略大全'), 'localized route HTML is missing route-specific visible content'],
  [localizedGuide.includes('"@type":"Organization"') && localizedGuide.includes('"@type":"WebSite"'), 'localized route schema is missing site identity entities'],
  [localizedGuide.includes('"@type":"BreadcrumbList"'), 'localized nested route is missing breadcrumb structured data'],
  [localizedGuide.includes('https://mpstorys.com/guides/zh/KMS#webpage'), 'structured data URL does not match the canonical localized URL'],
  [privateAccount.includes('noindex, nofollow') && !privateAccount.includes('type="application/ld+json"'), 'private route SEO directives are incorrect'],
  [iconStats.size > 0 && iconStats.size < 20 * 1024, `mpstorys-icon-128.jpg is ${iconStats.size} bytes; it must be non-empty and under 20 KB`],
  [oversizedScripts.length === 0, `JavaScript chunks exceed 500 KB: ${oversizedScripts.map(({ name, size }) => `${name} (${size} bytes)`).join(', ')}`],
];

const failures = assertions.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  throw new Error(`SEO output verification failed:\n- ${failures.join('\n- ')}`);
}

console.log(`Verified robots.txt, sitemap.xml, canonical metadata, ${iconStats.size}-byte site icon, and ${scriptSizes.length} JavaScript chunks under 500 KB.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await verifySeoOutput();
}
