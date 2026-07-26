import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createJiti } from 'jiti';
import { buildUiTranslationManifest } from './content/ui-translation-manifest.mjs';

function optionValue(args, name, fallback) {
  const prefix = `${name}=`;
  const match = args.find((argument) => argument.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

async function main() {
  const outputPath = path.resolve(optionValue(
    process.argv.slice(2),
    '--output',
    'output/ui-translations-manifest.json',
  ));
  const jiti = createJiti(import.meta.url);
  const messages = await jiti.import('../src/i18n/local/en/common.ts', { default: true });
  const manifest = buildUiTranslationManifest(messages);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    output: outputPath,
    entries: manifest.entries.length,
    translation_rows: manifest.entries.length * manifest.locales.length,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
