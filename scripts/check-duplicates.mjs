import { findDuplicateResources, readResourceRecords } from './lib/resource-index.mjs';
import { findContentDuplicates, findSourceDuplicates } from './content/duplicates.mjs';
import { readContentRecords, readSourceRecords } from './content/data.mjs';

const records = await readResourceRecords();
const sourceRecords = await readSourceRecords();
const contentRecords = await readContentRecords();
const duplicates = findDuplicateResources(records);
const sourceDuplicates = findSourceDuplicates(sourceRecords);
const contentDuplicates = findContentDuplicates(contentRecords);
const duplicateGroups = [
  ...duplicates.ids.map((group) => ({ type: 'id', ...group })),
  ...duplicates.urls.map((group) => ({ type: 'canonical URL', ...group })),
  ...sourceDuplicates.ids.map((group) => ({ type: 'source ID', ...group })),
  ...contentDuplicates.ids.map((group) => ({ type: 'content ID', ...group })),
  ...contentDuplicates.urls.map((group) => ({ type: 'content canonical URL', ...group })),
  ...contentDuplicates.externalIds.map((group) => ({ type: 'source external ID', ...group })),
];
const reviewGroups = [
  ...contentDuplicates.hashes.map((group) => ({ type: 'content hash', ...group })),
  ...contentDuplicates.titleDates.map((group) => ({ type: 'normalized title and publication time', ...group })),
];

if (duplicateGroups.length > 0) {
  console.error(`Duplicate detection failed with ${duplicateGroups.length} group(s):`);
  for (const group of duplicateGroups) {
    console.error(`- ${group.type}: ${group.value}`);
    group.records.forEach((record) => console.error(`  - ${record.relativePath}`));
  }
  process.exitCode = 1;
} else {
  console.log(`No duplicate identifiers found across ${records.length} resources, ${sourceRecords.length} sources, and ${contentRecords.length} content records.`);
}

if (reviewGroups.length > 0) {
  console.warn(`Review ${reviewGroups.length} possible cross-region or translated duplicate group(s); these are not merged automatically:`);
  for (const group of reviewGroups) console.warn(`- ${group.type}: ${group.value}`);
}
