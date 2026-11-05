import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { printStartup } from '../bin/startup.mjs';

test('startup shows version, diagnostic path, and reducer-off placement warning', () => {
  const store = { credentials: () => ({ rawToken: 'fixture-token', traceId: 1 }), instance: () => ({ id: 'fixture-instance' }) };
  for (const mode of ['off', 'agent', 'api', 'codex']) {
    let output = '';
    printStartup({ host: '127.0.0.1', port: 4123, store, reducerInfo: { mode },
      version: 'app-test', engineVersion: 'engine-test', logPath: '/private/test.log' },
    { write: text => { output += text; } });
    assert.ok(output.includes('Flambé Single Burner vapp-test'));
    assert.ok(output.includes('app-test (engine engine-test)'));
    assert.ok(output.includes('flambe-single-burner logs --log'));
    assert.ok(output.includes('/private/test.log'));
    assert.equal(output.includes('AI is off'), mode === 'off');
    assert.equal(output.includes('dedicated Codex login'), mode === 'codex');
    assert.ok(output.includes('fixture-token')); // Setup credentials remain terminal-only.
  }
});

test('executable exposes version and log option using the current engine', t => {
  // Isolate package resolution: no global installs or npm registry dependency.
  const dir = mkdtempSync(join(tmpdir(), 'flambe-single-burner-cli-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fileURLToPath(new URL('../bin', import.meta.url)), join(dir, 'bin'), { recursive: true });
  const app = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  // Release jobs install the published dependency, not ../cli's dependencies.
  // Prefer that installed engine; use the repository checkout for local development.
  const installed = fileURLToPath(new URL('../node_modules/@davvidbaker/flambe-cli', import.meta.url));
  const engineDir = existsSync(installed) ? installed : fileURLToPath(new URL('../../cli', import.meta.url));
  const engine = JSON.parse(readFileSync(join(engineDir, 'package.json'), 'utf8'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module', version: app.version }));
  mkdirSync(join(dir, 'node_modules', '@davvidbaker'), { recursive: true });
  symlinkSync(engineDir, join(dir, 'node_modules', '@davvidbaker', 'flambe-cli'),
    process.platform === 'win32' ? 'junction' : 'dir');
  const run = args => spawnSync(process.execPath, [join(dir, 'bin', 'flambe-single-burner.mjs'), ...args], { encoding: 'utf8' });
  const version = run(['--version']);
  assert.equal(version.status, 0, version.stderr);
  assert.equal(version.stdout, `Single Burner ${app.version} (engine ${engine.version})\n`);
  const help = run(['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.ok(help.stdout.includes('--log <path>'));
  const invalid = run(['--log']);
  assert.equal(invalid.status, 1);
  assert.ok(invalid.stderr.includes('--log requires a value'));
});
