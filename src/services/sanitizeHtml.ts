import DOMPurify from 'dompurify';

const relativeUrlPattern = /^(?:[./#?]|$)/;

const mirroredTags = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col', 'colgroup',
  'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'ins', 'kbd', 'li', 'main',
  'mark', 'ol', 'p', 'pre', 'q', 's', 'samp', 'section', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time', 'tr',
  'u', 'ul', 'var', 'wbr',
];

const mirroredAttributes = [
  'alt', 'cite', 'class', 'colspan', 'datetime', 'decoding', 'dir', 'headers', 'height', 'href',
  'fetchpriority', 'id', 'lang', 'loading', 'rel', 'rowspan', 'scope', 'span', 'src', 'style', 'target', 'title', 'width',
  'data-guide-region', 'data-guide-source-synced-at',
];

const isAllowedMirroredUrl = (value: string) => {
  const trimmed = value.trim();
  if (relativeUrlPattern.test(trimmed)) return true;
  try {
    return new URL(trimmed).protocol === 'https:';
  } catch {
    return false;
  }
};

const upgradeRemoteHttpUrls = (html: string) => {
  if (!/http:\/\//i.test(html)) return html;
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  const urlAttributes = ['href', 'src', 'cite', 'data-src', 'data-original', 'data-lazy-src'];
  documentFragment.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    urlAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)?.trim();
      if (!value || !/^http:\/\//i.test(value)) return;
      try {
        const url = new URL(value);
        url.protocol = 'https:';
        element.setAttribute(attribute, url.toString());
      } catch {
        element.removeAttribute(attribute);
      }
    });
  });
  return documentFragment.body.innerHTML;
};

const promoteLazyImageSources = (html: string) => {
  if (!/<img\b/i.test(html)) return html;
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  documentFragment.body.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
    const lazySource = [
      image.getAttribute('data-src'),
      image.getAttribute('data-original'),
      image.getAttribute('data-lazy-src'),
    ].find((value): value is string => Boolean(value?.trim() && isAllowedMirroredUrl(value)));
    if (lazySource) image.setAttribute('src', lazySource);
  });
  return documentFragment.body.innerHTML;
};

const sanitizeOnServer = (html: string) => {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  const dropWithContent = new Set(['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'form']);
  documentFragment.body.querySelectorAll('*').forEach((element) => {
    const tagName = element.tagName.toLowerCase();
    if (!mirroredTags.includes(tagName)) {
      if (dropWithContent.has(tagName)) {
        element.remove();
      } else {
        element.replaceWith(...Array.from(element.childNodes));
      }
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      if (!mirroredAttributes.includes(name) || name.startsWith('on')) element.removeAttribute(attribute.name);
    });

    const style = element.getAttribute('style');
    if (style && /(?:expression|javascript:|url\s*\()/i.test(style)) element.removeAttribute('style');
  });
  return documentFragment.body.innerHTML;
};

/**
 * Defense-in-depth sanitizer for remote guide/wiki HTML immediately before render.
 * Import endpoints must also sanitize before storing mirrored content.
 *
 * When `baseUrl` is provided, relative URLs (starting with `/`) in href/src are
 * rewritten to absolute URLs. This compensates for mirror data that may contain
 * unresolved relative paths (e.g. `/w/File:Xxx.png` → `https://maplestorywiki.net/w/File:Xxx.png`).
 */
export function sanitizeMirroredHtml(html: string, baseUrl?: string) {
  const normalizedHtml = promoteLazyImageSources(upgradeRemoteHttpUrls(html));
  const sanitized = typeof DOMPurify.sanitize === 'function'
    ? DOMPurify.sanitize(normalizedHtml, {
        ALLOWED_TAGS: mirroredTags,
        ALLOWED_ATTR: mirroredAttributes,
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
      })
    : sanitizeOnServer(normalizedHtml);

  const documentFragment = new DOMParser().parseFromString(sanitized, 'text/html');
  for (const element of documentFragment.body.querySelectorAll<HTMLElement>('[href], [src], [poster], [cite]')) {
    for (const attribute of ['href', 'src', 'poster', 'cite']) {
      const value = element.getAttribute(attribute);
      if (value === null) continue;

      // Rewrite relative URLs to absolute when baseUrl is provided
      if (baseUrl && relativeUrlPattern.test(value) && !value.startsWith('//') && !value.startsWith('#')) {
        try {
          element.setAttribute(attribute, new URL(value, baseUrl).toString());
          continue;
        } catch {
          element.removeAttribute(attribute);
          continue;
        }
      }

      if (!isAllowedMirroredUrl(value)) element.removeAttribute(attribute);
    }

    if (element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  }

  return documentFragment.body.innerHTML;
}

const staticContentBlockTags = new Set([
  'ARTICLE', 'BLOCKQUOTE', 'DIV', 'FIGURE', 'OL', 'PRE', 'SECTION', 'TABLE', 'UL',
]);
const preparedStaticHtmlCache = new Map<string, string>();

/**
 * Prepares cached remote HTML once before React renders it. Images are deferred
 * until they approach the viewport and large sibling sections are marked so CSS
 * can skip layout/paint work while they are off screen.
 */
export function prepareStaticHtmlForRender(html: string, baseUrl?: string) {
  if (!baseUrl) {
    const cached = preparedStaticHtmlCache.get(html);
    if (cached !== undefined) {
      preparedStaticHtmlCache.delete(html);
      preparedStaticHtmlCache.set(html, cached);
      return cached;
    }
  }
  const sanitized = sanitizeMirroredHtml(html, baseUrl);
  const documentFragment = new DOMParser().parseFromString(sanitized, 'text/html');

  documentFragment.body.querySelectorAll<HTMLImageElement>('img').forEach((image, index) => {
    image.setAttribute('loading', index === 0 ? 'eager' : 'lazy');
    image.setAttribute('decoding', 'async');
    if (index === 0) image.setAttribute('fetchpriority', 'high');
  });

  let contentRoot: HTMLElement = documentFragment.body;
  for (let depth = 0; depth < 4; depth += 1) {
    const children = Array.from(contentRoot.children) as HTMLElement[];
    if (children.length === 0) break;

    const sizes = children.map((child) => child.querySelectorAll('*').length + 1);
    const totalSize = sizes.reduce((sum, size) => sum + size, 0);
    const largestSize = Math.max(...sizes);
    const largestIndex = sizes.indexOf(largestSize);
    const largestChild = children[largestIndex];
    const canBeWrapper = largestChild.matches('article, div, main');
    const hasDominantWrapper = children.length === 1 || (canBeWrapper && children.length <= 4 && largestSize / totalSize >= 0.8);
    if (!hasDominantWrapper) break;
    contentRoot = children[largestIndex];
  }

  Array.from(contentRoot.children).forEach((child) => {
    if (!staticContentBlockTags.has(child.tagName)) return;
    const descendantCount = child.querySelectorAll('*').length;
    const imageCount = child.querySelectorAll('img').length;
    const textLength = child.textContent?.trim().length || 0;
    if (descendantCount >= 10 || imageCount >= 2 || textLength >= 800) {
      child.setAttribute('data-static-content-block', '');
    }
  });

  const prepared = documentFragment.body.innerHTML;
  if (!baseUrl) {
    preparedStaticHtmlCache.set(html, prepared);
    while (preparedStaticHtmlCache.size > 8) {
      const oldestHtml = preparedStaticHtmlCache.keys().next().value as string | undefined;
      if (oldestHtml === undefined) break;
      preparedStaticHtmlCache.delete(oldestHtml);
    }
  }
  return prepared;
}
