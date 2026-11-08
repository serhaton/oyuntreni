/// <reference types="node" />
/**
 * Fails if user-facing text is written directly in the UI code instead of
 * coming from the translation layer (src/i18n). Looks for:
 *   - words typed directly inside <Text>…</Text>
 *   - accessibilityLabel="literal words"
 *   - Alert.alert('literal words')
 * Symbols and digits (✓, ⌫, ?, 12) are allowed.
 *
 *   npm run test:i18n
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = ['app', 'src'];
const LETTER = /[A-Za-zÇĞİÖŞÜçğıöşü]/;

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return listFiles(path);
    return path.endsWith('.tsx') ? [path] : [];
  });
}

const problems: string[] = [];
for (const file of ROOTS.flatMap(listFiles)) {
  const source = readFileSync(file, 'utf8');
  const where = (index: number) => `${file}:${source.slice(0, index).split('\n').length}`;

  // Text directly between a JSX tag's ">" and "</Text>" (single- or multi-line), without {expressions}.
  for (const m of source.matchAll(/>([^<>{}]*)<\/(?:Animated\.)?Text>/g)) {
    if (LETTER.test(m[1])) problems.push(`${where(m.index!)}  literal text in <Text>: "${m[1].trim()}"`);
  }
  for (const m of source.matchAll(/accessibilityLabel="([^"]*)"/g)) {
    if (LETTER.test(m[1])) problems.push(`${where(m.index!)}  literal accessibilityLabel: "${m[1]}"`);
  }
  for (const m of source.matchAll(/Alert\.alert\(\s*['"`]([^'"`]*)/g)) {
    if (LETTER.test(m[1])) problems.push(`${where(m.index!)}  literal Alert text: "${m[1]}"`);
  }
}

if (problems.length) {
  console.log(problems.map((p) => `FAIL  ${p}`).join('\n'));
  console.log(`${problems.length} hard-coded text(s) found: move them to src/i18n.`);
  process.exit(1);
}
console.log('No hard-coded user-facing text found.');
