import { findSourceDuplicates } from './content/duplicates.mjs';
import { readSourceRecords } from './content/data.mjs';
import { validateSourceSet } from './content/validation.mjs';

const records = await readSourceRecords();
const errors = await validateSourceSet(records);
const duplicates = findSourceDuplicates(records);
for (const group of duplicates.ids) errors.push(`duplicate source ID ${group.value}: ${group.records.map((record) => record.relativePath).join(', ')}`);

if (errors.length) {
  console.error(`Source validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${records.length} source configuration(s) against schemas/source.schema.json.`);
}
