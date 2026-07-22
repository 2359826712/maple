import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const srcRoot = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(srcRoot, '..');
const subsetCssPath = resolve(srcRoot, 'remixicon-subset.css');
const subsetFontPath = resolve(projectRoot, 'public/fonts/remixicon-mpstorys.woff2');

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!['.ts', '.tsx'].includes(extname(entry.name)) || entry.name.includes('.test.')) return [];
    return [path];
  });

describe('Remix Icon subset', () => {
  it('contains every icon class referenced by production source', () => {
    const subsetCss = readFileSync(subsetCssPath, 'utf8');
    const available = new Set(
      [...subsetCss.matchAll(/\.(ri-[a-z0-9-]+):before/g)].map((match) => match[1]),
    );
    const referenced = new Set(
      sourceFiles(srcRoot).flatMap((path) => (
        [...readFileSync(path, 'utf8').matchAll(/\bri-[a-z0-9-]+/g)].map((match) => match[0])
      )),
    );

    expect([...referenced].filter((icon) => !available.has(icon)).sort()).toEqual([]);
  });

  it('ships the subset font instead of the complete Remix Icon font', () => {
    expect(existsSync(subsetFontPath)).toBe(true);
    expect(statSync(subsetFontPath).size).toBeLessThan(30_000);
    expect(readFileSync(subsetCssPath, 'utf8')).toContain('/fonts/remixicon-mpstorys.woff2');
  });
});
