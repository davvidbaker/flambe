import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-single-env-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fileURLToPath(new URL('../bin', import.meta.url)), join(dir, 'bin'), { recursive: true });
  const installed = fileURLToPath(new URL('../node_modules/@davvidbaker/flambe-cli', import.meta.url));
  const engine = existsSync(installed) ? installed : fileURLToPath(new URL('../../cli', import.meta.url));
  mkdirSync(join(dir, 'node_modules', '@davvidbaker'), { recursive: true });
  symlinkSync(engine, join(dir, 'node_modules', '@davvidbaker', 'flambe-cli'), process.platform === 'win32' ? 'junction' : 'dir');
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module', version: 'test' }));
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (key.startsWith('FLAMBE_LOCAL_')) delete env[key];
  return { dir, env, bin: join(dir, 'bin', 'flambe-single-burner.mjs') };
}

for (const [name, shell, expected] of [
  ['loads reducer mode and model from launch-directory .env', {}, 'local (file-model)'],
  ['preserves shell reducer mode over .env', { FLAMBE_LOCAL_REDUCER_MODE: 'off' }, 'off'],
  ['preserves shell reducer model over .env', { FLAMBE_LOCAL_REDUCER_MODEL: 'shell-model' }, 'local (shell-model)'],
  ['starts normally without .env', null, 'off'],
]) {
  test(name, { timeout: 15000 }, async t => {
    const f = fixture(t);
    if (shell !== null) writeFileSync(join(f.dir, '.env'),
      'FLAMBE_LOCAL_REDUCER_MODE=local\nFLAMBE_LOCAL_REDUCER_MODEL="file-model"\nFLAMBE_LOCAL_REDUCER_API_KEY=private-fixture-key\n');
    const probe = net.createServer();
    await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
    const port = probe.address().port;
    await new Promise(resolve => probe.close(resolve));
    const child = spawn(process.execPath, [f.bin, '--port', String(port), '--db', join(f.dir, 'test.sqlite')], {
      cwd: f.dir, env: { ...f.env, ...shell }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    const closed = new Promise(resolve => child.once('close', resolve));
    let output = '';
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk.toString(); });
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10000);
        child.stdout.on('data', chunk => {
          output += chunk.toString();
          if (output.includes('Guides: other agents, hosted ChatGPT, and reducer setup')) { clearTimeout(timer); resolve(); }
        });
        child.once('error', problem => { clearTimeout(timer); reject(problem); });
        child.once('exit', () => { clearTimeout(timer); reject(new Error(`Server exited before startup: ${stderr}`)); });
      });
      const reducer = output.match(/^  Reducer   (.+)$/m)?.[1];
      assert.equal(reducer, expected);
      assert.equal(output.includes('private-fixture-key'), false);
      assert.equal(readFileSync(join(f.dir, 'test.sqlite.log'), 'utf8').includes('private-fixture-key'), false);
    } finally {
      child.kill('SIGTERM');
      await closed;
    }
  });
}

test('help, version, and log viewing never read .env or open a server database', t => {
  const f = fixture(t);
  mkdirSync(join(f.dir, '.env')); // Server .env reads would fail with EISDIR/EPERM.
  const log = join(f.dir, 'existing.log');
  writeFileSync(log, '');
  for (const args of [['--help'], ['--version'], ['logs', '--help'], ['logs', '--log', log, '--no-follow']]) {
    const result = spawnSync(process.execPath, [f.bin, ...args], { cwd: f.dir, env: f.env, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(f.dir, 'test.sqlite')), false);
  }
  const failed = spawnSync(process.execPath, [f.bin, '--db', join(f.dir, 'test.sqlite')], {
    cwd: f.dir, env: f.env, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(failed.status, 1);
  assert.match(failed.stderr, /EISDIR|EPERM|EACCES/);
  assert.equal(existsSync(join(f.dir, 'test.sqlite')), false, 'bad .env fails before opening SQLite');
});
