import { readResourceRecords } from './lib/resource-index.mjs';
import { validateResourceSet } from './lib/resource-validation.mjs';
import { readContentRecords, readSourceRecords } from './content/data.mjs';
import { validateContentSet, validateSourceSet } from './content/validation.mjs';

const resources = await readResourceRecords();
const sources = await readSourceRecords();
const content = await readContentRecords();
const errors = [
  ...await validateResourceSet(resources),
  ...await validateSourceSet(sources),
  ...await validateContentSet(content, { sourceRecords: sources }),
];

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${resources.length} resources, ${sources.length} sources, and ${content.length} content records.`);
}
