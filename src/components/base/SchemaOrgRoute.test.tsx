// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import SchemaOrgRoute from './SchemaOrgRoute';

const renderRoute = (pathname: string) => render(
  <MemoryRouter initialEntries={[pathname]}>
    <SchemaOrgRoute />
  </MemoryRouter>,
);

const schemas = () => Array.from(document.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'))
  .flatMap((element) => {
    const schema = JSON.parse(element.textContent || '{}');
    return schema['@graph'] || [schema];
  });

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('script[data-seo-schema="route"]').forEach((element) => element.remove());
});

describe('SchemaOrgRoute', () => {
  it('adds localized Organization, WebSite, and WebPage schemas to the home route', () => {
    renderRoute('/zh/KMS');

    expect(schemas()).toEqual([
      expect.objectContaining({
        '@type': 'Organization',
        '@id': 'https://mpstorys.com/#organization',
        name: 'MPStorys',
      }),
      expect.objectContaining({
        '@type': 'WebSite',
        name: 'MPStorys',
        url: 'https://mpstorys.com/',
      }),
      expect.objectContaining({
        '@type': 'WebPage',
        name: 'MPStorys · 冒险岛攻略、工具与社区',
        url: 'https://mpstorys.com/zh/KMS',
        inLanguage: 'zh-CN',
      }),
    ]);
    expect(document.querySelectorAll('script[data-seo-schema="route"]')).toHaveLength(1);
  });

  it('keeps WebPage and breadcrumb URLs aligned with the localized canonical', () => {
    renderRoute('/guides/ja/JMS');

    expect(schemas()).toEqual(expect.arrayContaining([
      expect.objectContaining({ '@type': 'Organization' }),
      expect.objectContaining({ '@type': 'WebSite' }),
      expect.objectContaining({
        '@type': 'WebPage',
        name: 'メイプルストーリー攻略ガイド',
        url: 'https://mpstorys.com/guides/ja/JMS',
        inLanguage: 'ja',
      }),
      expect.objectContaining({
        '@type': 'BreadcrumbList',
        itemListElement: [
          expect.objectContaining({ position: 1, item: 'https://mpstorys.com/ja/JMS' }),
          expect.objectContaining({ position: 2, item: 'https://mpstorys.com/guides/ja/JMS' }),
        ],
      }),
    ]));
  });

  it('includes indexable parent routes in nested breadcrumbs', () => {
    renderRoute('/guides/level/en/GMS');

    expect(schemas().find((schema) => schema['@type'] === 'BreadcrumbList')).toEqual(expect.objectContaining({
      '@type': 'BreadcrumbList',
      itemListElement: [
        expect.objectContaining({ position: 1, item: 'https://mpstorys.com/en/GMS' }),
        expect.objectContaining({ position: 2, item: 'https://mpstorys.com/guides/en/GMS' }),
        expect.objectContaining({ position: 3, item: 'https://mpstorys.com/guides/level/en/GMS' }),
      ],
    }));
  });

  it('does not add structured data to noindex routes', () => {
    renderRoute('/account');

    expect(schemas()).toEqual([]);
  });
});
