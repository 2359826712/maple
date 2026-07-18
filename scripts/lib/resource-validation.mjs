import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  compareStrings,
  normalizeCanonicalUrl,
  readResourceRecords,
  schemaPath,
} from './resource-index.mjs';

const sorted = (values) => [...values].sort(compareStrings);

function isSorted(values) {
  return values.every((value, index) => index === 0 || compareStrings(values[index - 1], value) <= 0);
}

function formatAjvError(error) {
  const location = error.instancePath || '/';
  return `${location} ${error.message || 'is invalid'}`;
}

export async function validateResourceSet(inputRecords) {
  const records = inputRecords || await readResourceRecords();
  const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validateSchema = ajv.compile(schema);
  const errors = [];

  for (const record of records) {
    const { data, filePath, relativePath } = record;
    if (!validateSchema(data)) {
      for (const error of validateSchema.errors || []) {
        errors.push(`${relativePath}: ${formatAjvError(error)}`);
      }
      continue;
    }

    const relativeParts = relativePath.split('/');
    const fileId = path.basename(filePath, '.json');
    const directorySeries = relativeParts[1];
    const directoryCategory = relativeParts[2];

    if (relativeParts.length !== 4) errors.push(`${relativePath}: expected resources/{series}/{category}/{id}.json`);
    if (fileId !== data.id) errors.push(`${relativePath}: filename must match id ${data.id}`);
    if (directorySeries !== data.series) errors.push(`${relativePath}: directory series must match ${data.series}`);
    if (directoryCategory !== data.category) errors.push(`${relativePath}: directory category must match ${data.category}`);

    for (const field of ['regions', 'languages', 'tags']) {
      if (!isSorted(data[field])) errors.push(`${relativePath}: ${field} must be sorted`);
    }
    if (data.source_urls[0] !== data.url) errors.push(`${relativePath}: source_urls must start with the exact resource URL`);
    if (!isSorted(data.source_urls.slice(1))) errors.push(`${relativePath}: source_urls after the exact URL must be sorted`);

    let normalizedUrl;
    try {
      normalizedUrl = normalizeCanonicalUrl(data.url);
    } catch {
      errors.push(`${relativePath}: url cannot be parsed`);
    }
    if (normalizedUrl && normalizedUrl !== data.url) {
      errors.push(`${relativePath}: url is not canonical; expected ${normalizedUrl}`);
    }

    for (const [field, value] of [['github_url', data.github_url], ['api_url', data.api_url]]) {
      if (!value) continue;
      try {
        new URL(value);
      } catch {
        errors.push(`${relativePath}: ${field} cannot be parsed`);
      }
    }

    if (data.opensource && !data.github_url && !data.notes) {
      errors.push(`${relativePath}: opensource resources need github_url or an explanatory note`);
    }
    if (data.tags.some((tag, index) => tag !== sorted(data.tags)[index])) {
      errors.push(`${relativePath}: tags must use deterministic lexical order`);
    }
  }

  return errors;
}
