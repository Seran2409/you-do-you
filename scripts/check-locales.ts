/// <reference types="node" />
/*
 * Fails (exit 1) when de.json and en.json differ in keys, when quote lists are empty,
 * or when the code uses a translation key that exists in neither file.
 * Plural keys (_one/_other) are compared by their base key.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

type Json = Record<string, unknown>;

const root = join(__dirname, '..');
const load = (lang: string): Json => JSON.parse(readFileSync(join(root, 'locales', lang + '.json'), 'utf8'));

export function flatKeys(obj: Json, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatKeys(v as Json, key));
    else out.push(key);
  }
  return out;
}

const PLURAL = /_(zero|one|two|few|many|other)$/;
export const baseKey = (k: string) => k.replace(PLURAL, '');

export function compareLocales(a: Json, b: Json): { onlyA: string[]; onlyB: string[] } {
  const ka = new Set(flatKeys(a).map(baseKey));
  const kb = new Set(flatKeys(b).map(baseKey));
  return { onlyA: [...ka].filter((k) => !kb.has(k)).sort(), onlyB: [...kb].filter((k) => !ka.has(k)).sort() };
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === '__tests__' || name === 'node_modules') continue;
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Literal keys used as t('a.b') or i18nKey="a.b" in the source. */
export function usedKeys(files: string[]): string[] {
  const re = /(?:\bt\(|i18nKey=)\s*['"]([a-zA-Z0-9_.]+)['"]/g;
  const keys = new Set<string>();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(re)) keys.add(m[1]);
  }
  return [...keys].sort();
}

function main() {
  const de = load('de');
  const en = load('en');
  const errors: string[] = [];
  const { onlyA, onlyB } = compareLocales(de, en);
  for (const k of onlyA) errors.push(`missing in en.json: ${k}`);
  for (const k of onlyB) errors.push(`missing in de.json: ${k}`);
  for (const [lang, data] of [['de', de], ['en', en]] as const) {
    const q = data.quotes;
    if (!Array.isArray(q) || q.length < 30) errors.push(`${lang}.json: quotes list missing or too short`);
  }
  const known = new Set(flatKeys(de).map(baseKey));
  for (const k of usedKeys(sourceFiles(join(root, 'src')))) {
    if (!known.has(k) && !known.has(baseKey(k))) errors.push(`used in code but not in locales: ${k}`);
  }
  if (errors.length) {
    console.error('Locale check failed:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  console.log(`Locale check ok (${known.size} keys).`);
}

if (require.main === module) main();
