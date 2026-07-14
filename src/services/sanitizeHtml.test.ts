// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';
import { prepareStaticHtmlForRender, sanitizeMirroredHtml } from './sanitizeHtml';

describe('sanitizeMirroredHtml', () => {
  it('removes executable markup and event handlers', () => {
    const output = sanitizeMirroredHtml('<p onclick="alert(1)">Safe</p><script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(2)">');
    expect(output).toContain('<p>Safe</p>');
    expect(output).toContain('https://example.com/a.png');
    expect(output).not.toContain('script');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('onerror');
  });

  it('rejects unsafe URL protocols while preserving HTTPS and relative links', () => {
    const output = sanitizeMirroredHtml([
      '<a href="javascript:alert(1)">bad</a>',
      '<img src="data:text/html;base64,abc">',
      '<a href="https://maplestorywiki.net/wiki/Lotus" target="_blank">external</a>',
      '<a href="/wiki/Lotus">relative</a>',
    ].join(''));

    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('data:text');
    expect(output).toContain('href="https://maplestorywiki.net/wiki/Lotus"');
    expect(output).toContain('rel="noopener noreferrer"');
    expect(output).toContain('href="/wiki/Lotus"');
  });

  it('removes scriptable SVG and embedded documents', () => {
    const output = sanitizeMirroredHtml('<svg><script>alert(1)</script></svg><iframe src="https://example.com"></iframe><strong>kept</strong>');
    expect(output).toBe('<strong>kept</strong>');
  });

  it('keeps only the bounded guide metadata attributes used by imported cards', () => {
    const output = sanitizeMirroredHtml('<a href="/guides/example" data-guide-region="gms" data-guide-source-synced-at="2026-07-12T08:00:00.000Z" data-secret="drop">Guide</a>');
    expect(output).toContain('data-guide-region="gms"');
    expect(output).toContain('data-guide-source-synced-at="2026-07-12T08:00:00.000Z"');
    expect(output).not.toContain('data-secret');
  });

  it('preserves lazy asynchronous image hints for large static articles', () => {
    const output = sanitizeMirroredHtml('<img src="https://example.com/item.png" loading="lazy" decoding="async">');
    expect(output).toContain('loading="lazy"');
    expect(output).toContain('decoding="async"');
  });

  it('neutralizes the OWASP XSS filter-evasion payload classes', () => {
    // Representative classes from OWASP's XSS Filter Evasion Cheat Sheet:
    // malformed tags, encoded protocols, event handlers, active media, foreign content, and refresh vectors.
    const payloads = [
      '<SCRIPT SRC="https://example.com/x.js"></SCRIPT>',
      'javascript:</title></style></textarea></script><svg onload="alert(1)">',
      '<a onmouseover="alert(document.cookie)">link</a>',
      '<IMG ""><SCRIPT>alert("XSS")</SCRIPT>">',
      '<a href="javascript:alert(String.fromCharCode(88,83,83))">click</a>',
      '<img src="#" onmouseover="alert(1)">',
      '<img src="" onerror="alert(1)">',
      '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">encoded</a>',
      '<a href="&#x6a;&#x61;&#x76;&#x61;&#x73;&#x63;&#x72;&#x69;&#x70;&#x74;&#x3a;alert(1)">hex</a>',
      '<a href="jav&#x09;ascript:alert(1)">tab</a>',
      '<base href="javascript:alert(1)//">',
      '<object type="text/x-scriptlet" data="https://example.com/xss.html"></object>',
      '<embed src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Lz48L3N2Zz4=">',
      '<xml id="x"><img src="javascript:alert(1)"></xml>',
      '<img src="x" onerror="window.onerror=alert">',
      '<video><source onerror="alert(1)"></video>',
      '<applet code="javascript:alert(1)"></applet>',
      '<iframe src="data:text/html,<svg onload=alert(1)>"></iframe>',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      '<math><mtext><a href="javascript:alert(1)">math</a></mtext></math>',
    ];

    for (const payload of payloads) {
      const output = sanitizeMirroredHtml(payload);
      const documentFragment = new DOMParser().parseFromString(output, 'text/html');
      expect(output).not.toMatch(/<(?:script|style|svg|math|iframe|frame|object|embed|form|input|button|textarea|select|option|video|audio|applet|xml|meta|base|link)\b/i);
      for (const element of documentFragment.body.querySelectorAll('*')) {
        expect(Array.from(element.attributes).some((attribute) => /^on/i.test(attribute.name))).toBe(false);
        for (const attribute of ['href', 'src', 'cite']) {
          expect(element.getAttribute(attribute) || '').not.toMatch(/^(?:javascript|data|vbscript)\s*:/i);
        }
      }
    }
  });
});

describe('prepareStaticHtmlForRender', () => {
  it('defers article images and marks only substantial off-screen sections', () => {
    const largeSection = `<section><h2>Large</h2>${'<p>article paragraph</p>'.repeat(10)}<img src="https://example.com/a.png"><img src="https://example.com/b.png"></section>`;
    const output = prepareStaticHtmlForRender(`<main><div><div class="content-container">${largeSection}<section><p>Small</p></section></div></div></main>`);
    const documentFragment = new DOMParser().parseFromString(output, 'text/html');
    const sections = documentFragment.querySelectorAll('section');

    expect(sections[0].hasAttribute('data-static-content-block')).toBe(true);
    expect(sections[1].hasAttribute('data-static-content-block')).toBe(false);
    for (const image of documentFragment.querySelectorAll('img')) {
      expect(image.getAttribute('loading')).toBe('lazy');
      expect(image.getAttribute('decoding')).toBe('async');
    }
  });

  it('still sanitizes executable markup before rendering', () => {
    const output = prepareStaticHtmlForRender('<div><script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(2)"></div>');
    expect(output).not.toContain('script');
    expect(output).not.toContain('onerror');
  });
});
