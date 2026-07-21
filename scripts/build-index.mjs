import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGeneratedIndexes,
  findDuplicateResources,
  generatedDirectory,
  readResourceRecords,
  writeJson,
} from './lib/resource-index.mjs';
import { validateResourceSet } from './lib/resource-validation.mjs';
import { createContentIndexes } from './content/build.mjs';
import { findContentDuplicates, findSourceDuplicates } from './content/duplicates.mjs';
import { readContentRecords, readSourceRecords } from './content/data.mjs';
import { createContentManifest } from './content/manifest.mjs';
import { validateContentSet, validateSourceSet } from './content/validation.mjs';

export async function buildResourceIndex() {
  const records = await readResourceRecords();
  const sourceRecords = await readSourceRecords();
  const contentRecords = await readContentRecords();
  const validationErrors = await validateResourceSet(records);
  validationErrors.push(...await validateSourceSet(sourceRecords));
  validationErrors.push(...await validateContentSet(contentRecords, { sourceRecords }));
  if (validationErrors.length > 0) throw new Error(`Resource validation failed:\n${validationErrors.join('\n')}`);

  const duplicates = findDuplicateResources(records);
  if (duplicates.ids.length > 0 || duplicates.urls.length > 0) {
    throw new Error('Duplicate resource IDs or canonical URLs must be resolved before generating data.');
  }

  const sourceDuplicates = findSourceDuplicates(sourceRecords);
  const contentDuplicates = findContentDuplicates(contentRecords);
  if (
    sourceDuplicates.ids.length > 0
    || contentDuplicates.ids.length > 0
    || contentDuplicates.urls.length > 0
    || contentDuplicates.externalIds.length > 0
  ) {
    throw new Error('Duplicate source or content identifiers must be resolved before generating data.');
  }

  const indexes = createGeneratedIndexes(records);
  const contentIndexes = createContentIndexes(contentRecords, sourceRecords);
  indexes.content = contentIndexes.content;
  indexes.sources = contentIndexes.sources;
  indexes['content-statistics'] = contentIndexes['content-statistics'];
  indexes['content-manifest'] = createContentManifest(contentRecords, sourceRecords);
  indexes.search = [...indexes.search, ...contentIndexes.search]
    .sort((left, right) => left.id.localeCompare(right.id));
  for (const [name, value] of Object.entries(indexes)) {
    await writeJson(path.join(generatedDirectory, `${name}.json`), value);
  }
  return indexes;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const indexes = await buildResourceIndex();
  console.log(`Generated ${Object.keys(indexes).length} deterministic data files for ${indexes.resources.length} resource(s), ${indexes.sources.length} source(s), and ${indexes.content.length} content record(s).`);
}
