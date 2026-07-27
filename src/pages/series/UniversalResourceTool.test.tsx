import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { createInstance } from 'i18next';
import { fireEvent, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import en from '@/i18n/local/en/common';
import type { ResourceIndexRecord } from '@/domain/resourceIndex';
import type { VerifiedSeriesResource } from './verifiedContent';
import UniversalResourceTool from './UniversalResourceTool';
import { getResourceToolKind } from './resourceToolRegistry';

const interactiveCategories = new Set([
  'builder',
  'calculator',
  'character-lookup',
  'guild-lookup',
  'optimizer',
  'planner',
  'simulator',
]);

const resourceFiles = (directory: string): string[] => readdirSync(directory).flatMap((name) => {
  const file = path.join(directory, name);
  return statSync(file).isDirectory() ? resourceFiles(file) : file.endsWith('.json') ? [file] : [];
});

const verifiedResource = (record: ResourceIndexRecord): VerifiedSeriesResource => ({
  description: record.description,
  imageAlt: '',
  imageUrl: '',
  resourceId: record.id,
  resourceRecord: record,
  sourceLabel: record.website,
  sourceUrl: record.url,
  title: record.name,
});

describe('universal series tools', () => {
  it('provides an on-site workspace for every indexed interactive tool in every series', () => {
    const records = resourceFiles(path.resolve('resources'))
      .map((file) => JSON.parse(readFileSync(file, 'utf8')) as ResourceIndexRecord)
      .filter((record) => interactiveCategories.has(record.category));

    expect(records).toHaveLength(34);
    expect(records.map((record) => [record.id, getResourceToolKind(verifiedResource(record))]))
      .not.toContainEqual(expect.arrayContaining([expect.any(String), null]));
  });

  it('turns the Classic avoidability detail into a working hit calculator', async () => {
    const record = JSON.parse(readFileSync(
      path.resolve('resources/classic/simulator/classic-niameowdb-avoidability-simulator.json'),
      'utf8',
    )) as ResourceIndexRecord;
    const i18n = createInstance();
    await i18n.init({
      lng: 'en',
      resources: { en: { translation: en } },
      interpolation: { escapeValue: false },
    });

    render(
      <I18nextProvider i18n={i18n}>
        <UniversalResourceTool resource={verifiedResource(record)} />
      </I18nextProvider>,
    );

    expect(screen.getByRole('heading', { name: /Avoidability Simulator hit planner/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Accuracy'), { target: { value: '40' } });
    expect(screen.getByText('90%')).toBeTruthy();
  });
});
// @vitest-environment jsdom
