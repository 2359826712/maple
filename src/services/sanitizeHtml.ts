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
  'alt', 'cite', 'class', 'colspan', 'datetime', 'dir', 'headers', 'height', 'href',
  'id', 'lang', 'loading', 'rel', 'rowspan', 'scope', 'span', 'src', 'style', 'target', 'title', 'width',
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

/**
 * Defense-in-depth sanitizer for remote guide/wiki HTML immediately before render.
 * Import endpoints must also sanitize before storing mirrored content.
 *
 * When `baseUrl` is provided, relative URLs (starting with `/`) in href/src are
 * rewritten to absolute URLs. This compensates for mirror data that may contain
 * unresolved relative paths (e.g. `/w/File:Xxx.png` → `https://maplestorywiki.net/w/File:Xxx.png`).
 */
export function sanitizeMirroredHtml(html: string, baseUrl?: string) {
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: mirroredTags,
    ALLOWED_ATTR: mirroredAttributes,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });

  const documentFragment = new DOMParser().parseFromString(sanitized, 'text/html');
  for (const element of documentFragment.body.querySelectorAll<HTMLElement>('[href], [src], [poster], [cite]')) {
    for (const attribute of ['href', 'src', 'poster', 'cite']) {
      const value = element.getAttribute(attribute);
      if (value === null) continue;

      // Rewrite relative URLs to absolute when baseUrl is provided
      if (baseUrl && value.startsWith('/') && !value.startsWith('//')) {
        element.setAttribute(attribute, baseUrl + value);
        continue;
      }

      if (!isAllowedMirroredUrl(value)) element.removeAttribute(attribute);
    }

    if (element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  }

  return documentFragment.body.innerHTML;
}
