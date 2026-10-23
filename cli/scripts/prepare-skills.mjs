import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

const source = fileURLToPath(new URL('../../.codex/skills/flambe-cli/SKILL.md', import.meta.url));
const target = fileURLToPath(new URL('../skills/flambe-cli/SKILL.md', import.meta.url));
if (existsSync(source)) {
  mkdirSync(dirname(target), {recursive: true});
  copyFileSync(source, target);
} else if (!existsSync(target)) {
  throw new Error('The CLI package is missing its canonical flambe-cli skill.');
}
