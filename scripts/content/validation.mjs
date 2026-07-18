import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { normalizeCanonicalUrl, repositoryRoot, supportedSeries } from '../lib/resource-index.mjs';
import { contentTypeDirectories, readContentRecords, readSourceRecords } from './data.mjs';

const schemaDirectory = path.join(repositoryRoot, 'schemas');
const sorted = (values) => values.every((value, index) => index === 0 || values[index - 1] <= value);
const schemaFiles = ['article', 'event', 'guide', 'patch-note', 'source'];

async function validatorSet() {
  const schemas = Object.fromEntries(await Promise.all(schemaFiles.map(async (name) => [
    name,
    JSON.parse(await readFile(path.join(schemaDirectory, `${name}.schema.json`), 'utf8')),
  ])));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const schema of Object.values(schemas)) ajv.addSchema(schema);
  return Object.fromEntries(schemaFiles.map((name) => [name, ajv.getSchema(schemas[name].$id)]));
}

function schemaErrors(validate, relativePath) {
  return (validate.errors || []).map((error) => (
    `${relativePath}: ${error.instancePath || '/'} ${error.message || 'is invalid'}`
  ));
}

function checkCanonicalUrls(record, fields, errors) {
  for (const field of fields) {
    const values = Array.isArray(record.data[field]) ? record.data[field] : [record.data[field]];
    for (const value of values) {
      if (!value) continue;
      try {
        const canonical = normalizeCanonicalUrl(value);
        if (canonical !== value) errors.push(`${record.relativePath}: ${field} URL is not canonical; expected ${canonical}`);
      } catch {
        errors.push(`${record.relativePath}: ${field} URL cannot be parsed`);
      }
    }
  }
}

export async function validateSourceSet(inputRecords) {
  const records = inputRecords || await readSourceRecords();
  const validators = await validatorSet();
  const errors = [];
  for (const record of records) {
    if (!validators.source(record.data)) {
      errors.push(...schemaErrors(validators.source, record.relativePath));
      continue;
    }
    const parts = record.relativePath.split('/');
    if (parts.length !== 3) errors.push(`${record.relativePath}: expected sources/{series}/{id}.json`);
    if (parts[1] !== record.data.series) errors.push(`${record.relativePath}: source directory must match series ${record.data.series}`);
    if (path.basename(record.filePath, '.json') !== record.data.id) errors.push(`${record.relativePath}: filename must match id ${record.data.id}`);
    for (const field of ['regions', 'languages', 'content_types', 'discovery_urls', 'sitemap_urls']) {
      if (!sorted(record.data[field])) errors.push(`${record.relativePath}: ${field} must be sorted`);
    }
    checkCanonicalUrls(record, ['base_url', 'discovery_urls', 'feed_url', 'api_url', 'sitemap_urls'], errors);
    if (record.data.requires_login && record.data.enabled) errors.push(`${record.relativePath}: login-required sources must not be enabled`);
  }
  const covered = new Set(records.map((record) => record.data.series));
  for (const series of supportedSeries) {
    if (!covered.has(series)) errors.push(`sources/: missing source configuration for supported series ${series}`);
  }
  return errors;
}

function schemaForContentType(contentType) {
  if (contentType === 'event') return 'event';
  if (contentType === 'guide') return 'guide';
  if (contentType === 'patch-note') return 'patch-note';
  return 'article';
}

export async function validateContentSet(inputRecords, { sourceRecords } = {}) {
  const records = inputRecords || await readContentRecords();
  const sources = sourceRecords || await readSourceRecords();
  const sourceIds = new Set(sources.map((record) => record.data.id));
  const validators = await validatorSet();
  const errors = [];
  for (const record of records) {
    const validator = validators[schemaForContentType(record.data.content_type)];
    if (!validator(record.data)) {
      errors.push(...schemaErrors(validator, record.relativePath));
      continue;
    }
    const parts = record.relativePath.split('/');
    const expectedDirectory = contentTypeDirectories[record.data.content_type];
    if (parts.length !== 5) errors.push(`${record.relativePath}: expected content/{type}/{series}/{year}/{id}.json`);
    if (parts[1] !== expectedDirectory) errors.push(`${record.relativePath}: content directory must match ${expectedDirectory}`);
    if (parts[2] !== record.data.series) errors.push(`${record.relativePath}: content series directory must match ${record.data.series}`);
    if (!/^\d{4}$/.test(parts[3] || '')) errors.push(`${record.relativePath}: content year directory must be YYYY`);
    const recordYear = (record.data.published_at || record.data.discovered_at).slice(0, 4);
    if (parts[3] !== recordYear) errors.push(`${record.relativePath}: year directory must match ${recordYear}`);
    if (path.basename(record.filePath, '.json') !== record.data.id) errors.push(`${record.relativePath}: filename must match id ${record.data.id}`);
    if (!sourceIds.has(record.data.source_id)) errors.push(`${record.relativePath}: unknown source_id ${record.data.source_id}`);
    for (const field of ['regions', 'languages', 'tags', 'related_content_ids', 'related_urls']) {
      if (!sorted(record.data[field])) errors.push(`${record.relativePath}: ${field} must be sorted`);
    }
    checkCanonicalUrls(record, ['canonical_url', 'source_url', 'related_urls'], errors);
    if (record.data.storage_mode !== 'full-text-permitted' && (record.data.body_text || record.data.body_markdown)) {
      errors.push(`${record.relativePath}: body text requires full-text-permitted storage mode`);
    }
  }
  return errors;
}
