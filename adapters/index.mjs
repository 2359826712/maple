import { browserAdapter } from './browser/index.mjs';
import { htmlAdapter } from './html/index.mjs';
import { jsonApiAdapter } from './json-api/index.mjs';
import { nexonCmsAdapter } from './nexon-cms/index.mjs';
import { nexonCommunityAdapter } from './nexon-community/index.mjs';
import { rssAdapter } from './rss/index.mjs';
import { sitemapAdapter } from './sitemap/index.mjs';

const adapters = {
  atom: rssAdapter,
  browser: browserAdapter,
  html: htmlAdapter,
  'json-api': jsonApiAdapter,
  'nexon-cms': nexonCmsAdapter,
  'nexon-community': nexonCommunityAdapter,
  rss: rssAdapter,
  sitemap: sitemapAdapter,
};

export function getSourceAdapter(name) {
  const adapter = adapters[name];
  if (!adapter) throw new Error(`Adapter ${name} is not implemented or requires a separate compliant runtime.`);
  return adapter;
}
