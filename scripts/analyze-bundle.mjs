import { gzipSync } from 'node:zlib';
import { readFile, readdir } from 'node:fs/promises';
import { relative } from 'node:path';
import { SourceMapConsumer } from 'source-map';

const root = new URL('..', import.meta.url);
const assetsDirectory = new URL('./out/assets/', root);
const assetNames = await readdir(assetsDirectory);
const scripts = assetNames.filter((name) => /^index-.*\.js$/.test(name) && !name.endsWith('.map'));

if (scripts.length !== 1) {
  throw new Error(`Expected one production entry script in out/assets; found ${scripts.length}. Run npm run build first.`);
}

const scriptName = scripts[0];
const scriptPath = new URL(scriptName, assetsDirectory);
const mapPath = new URL(`${scriptName}.map`, assetsDirectory);
const [codeBuffer, rawMapText] = await Promise.all([readFile(scriptPath), readFile(mapPath, 'utf8')]);
const code = codeBuffer.toString('utf8');
const rawMap = JSON.parse(rawMapText);
const lineOffsets = [0];
for (let index = 0; index < code.length; index += 1) {
  if (code.charCodeAt(index) === 10) lineOffsets.push(index + 1);
}

const generatedOffset = (line, column) => (lineOffsets[Math.max(0, line - 1)] ?? code.length) + column;
const sourceBytes = new Map();

await SourceMapConsumer.with(rawMap, null, (consumer) => {
  let previous = null;
  consumer.eachMapping((mapping) => {
    const offset = generatedOffset(mapping.generatedLine, mapping.generatedColumn);
    if (previous?.source) {
      sourceBytes.set(previous.source, (sourceBytes.get(previous.source) || 0) + Math.max(0, offset - previous.offset));
    }
    previous = { source: mapping.source, offset };
  }, null, SourceMapConsumer.GENERATED_ORDER);
  if (previous?.source) {
    sourceBytes.set(previous.source, (sourceBytes.get(previous.source) || 0) + Math.max(0, code.length - previous.offset));
  }
});

const packageNameForSource = (source) => {
  const normalized = source.replaceAll('\\', '/');
  const marker = '/node_modules/';
  const index = normalized.lastIndexOf(marker);
  if (index < 0) return 'MapleHub application';
  const parts = normalized.slice(index + marker.length).split('/');
  return parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1] || ''}` : parts[0] || 'unknown dependency';
};

const packageBytes = new Map();
for (const [source, bytes] of sourceBytes) {
  const packageName = packageNameForSource(source);
  packageBytes.set(packageName, (packageBytes.get(packageName) || 0) + bytes);
}

const top = (map, count) => [...map.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, count)
  .map(([name, bytes]) => ({
    name,
    bytes,
    kib: Number((bytes / 1024).toFixed(1)),
    percent: Number(((bytes / codeBuffer.length) * 100).toFixed(1)),
  }));

const report = {
  generatedAt: new Date().toISOString(),
  entry: relative(new URL('.', root).pathname, scriptPath.pathname).replaceAll('\\', '/'),
  entryBytes: codeBuffer.length,
  entryKiB: Number((codeBuffer.length / 1024).toFixed(1)),
  gzipBytes: gzipSync(codeBuffer).length,
  gzipKiB: Number((gzipSync(codeBuffer).length / 1024).toFixed(1)),
  mappedBytes: [...sourceBytes.values()].reduce((sum, bytes) => sum + bytes, 0),
  sourceCount: sourceBytes.size,
  emittedScriptCount: assetNames.filter((name) => name.endsWith('.js') && !name.endsWith('.js.map')).length,
  largestAsyncScripts: (await Promise.all(
    assetNames
      .filter((name) => name.endsWith('.js') && !name.endsWith('.js.map') && name !== scriptName)
      .map(async (name) => {
        const buffer = await readFile(new URL(name, assetsDirectory));
        return { name, bytes: buffer.length, gzipBytes: gzipSync(buffer).length };
      }),
  ))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 10)
    .map((asset) => ({
      ...asset,
      kib: Number((asset.bytes / 1024).toFixed(1)),
      gzipKiB: Number((asset.gzipBytes / 1024).toFixed(1)),
    })),
  topPackages: top(packageBytes, 15),
  topSources: top(sourceBytes, 20),
};

console.log(JSON.stringify(report, null, 2));
