import { readResourceRecords } from './lib/resource-index.mjs';
import { validateResourceSet } from './lib/resource-validation.mjs';

const records = await readResourceRecords();
const errors = await validateResourceSet(records);

if (errors.length > 0) {
  console.error(`Resource validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${records.length} resource record(s) against schemas/resource.schema.json.`);
}
