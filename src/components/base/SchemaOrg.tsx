import type { ReactNode } from 'react';

export type SchemaOrgType = 'Organization' | 'WebSite' | 'WebPage' | 'Article' | 'FAQPage' | 'BreadcrumbList';

interface SchemaOrgProps {
  type: SchemaOrgType;
  data: Record<string, unknown>;
}

export default function SchemaOrg({ type, data }: SchemaOrgProps): ReactNode {
  const json = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  }).replaceAll('<', '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
