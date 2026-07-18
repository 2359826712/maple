import { readContentRecords } from './content/data.mjs';
import { validateContentSet } from './content/validation.mjs';

const records = await readContentRecords();
const errors = await validateContentSet(records);
if (errors.length) {
  console.error(`Content validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`Validated ${records.length} content record(s) against the article and specialized content schemas.`);
}
