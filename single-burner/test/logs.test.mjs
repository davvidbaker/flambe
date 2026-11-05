import assert from 'node:assert/strict';
import { appendFileSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createLogReader, formatLogRecord, parseLogsArgs, viewLogs } from '../bin/logs.mjs';

const entry = (fields = {}) => ({ timestamp: '2026-11-05T17:41:05.196Z', event: 'command.completed',
  command: 'start', activity_id: 305, selected_thread_id: 2, thread_source: 'default',
  request_id: '92e035b3-794e-4883-8ba1-84c3710d5339', agent_id: 'codex:session:agent123', ...fields });
const jsonLine = fields => JSON.stringify(entry(fields)) + '\n';
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'flambe-log-viewer-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return { dir, path: join(dir, 'local.sqlite.log') };
}

test('viewer options default to follow, allow custom paths and reject bad inputs', () => {
  const defaults = parseLogsArgs([]);
  assert.equal(defaults.follow, true);
  assert.equal(defaults.lines, 30);
  assert.ok(defaults.path.endsWith('local.sqlite.log'));
  const custom = parseLogsArgs(['--db', './my.sqlite', '--no-follow', '--lines', '0', '--json', '--verbose']);
  assert.equal(custom.path, resolve('./my.sqlite.log'));
  assert.equal(custom.follow, false);
  assert.equal(custom.lines, 0);
  assert.equal(custom.json, true);
  assert.equal(custom.verbose, true);
  assert.equal(parseLogsArgs(['--log', './custom.log', '--db', './other.sqlite']).path, resolve('./custom.log'));
  assert.equal(parseLogsArgs(['--help']).help, true);
  for (const args of [['--lines', '-1'], ['--lines', '1.2'], ['--lines', '10001'], ['--lines'], ['--log', '--json'], ['--bad']]) {
    assert.throws(() => parseLogsArgs(args));
  }
});

test('human output highlights fallbacks, waiting, inherited lanes and actual AI choices', () => {
  const waiting = formatLogRecord(entry({ review_status: 'awaiting_decision', thread_selection_requested: true }));
  assert.match(waiting, /17:41:05 START\s+#305\s+→ thread 2\s+\(fallback\)\s+WAITING for thread-selection review/);
  assert.equal(waiting.includes('92e035b3'), false);
  const inherited = formatLogRecord(entry({ activity_id: 307, selected_parent_id: 303, thread_source: 'parent', requested_thread_id: 3 }));
  assert.match(inherited, /inherited from parent #303/);
  assert.match(inherited, /requested thread 3/);
  const selected = formatLogRecord(entry({ command: 'decide', selected_thread_id: 3, thread_source: 'review', review_status: 'completed',
    actions_applied: [{ type: 'select_thread', activity_id: 305, thread_id: 3 }] }));
  assert.match(selected, /AI placement/);
  assert.match(selected, /review completed/);
  assert.equal(selected.includes('no actions'), false);
  assert.match(formatLogRecord(entry({ command: 'decide', thread_source: null, review_status: 'completed', actions_applied: [] })), /no actions applied/);
  assert.match(formatLogRecord(entry({ review_status: 'failed', review_error_code: 'REDUCER_TIMEOUT' })), /REVIEW FAILED: REDUCER_TIMEOUT/);
});

test('failed decisions show short correlation ids, never invent an activity, and verbose exposes full ids', () => {
  const failed = entry({ event: 'command.failed', command: 'decide', activity_id: null, error_code: 'REDUCER_STATE_CHANGED' });
  const text = formatLogRecord(failed);
  assert.match(text, /DECIDE\s+-\s+FAILED: REDUCER_STATE_CHANGED/);
  assert.match(text, /request=92e035b3/);
  assert.match(text, /agent=…agent123/);
  assert.equal(text.includes('#305'), false);
  assert.ok(formatLogRecord(failed, { verbose: true }).includes(failed.request_id));
  const received = entry({ event: 'command.received' });
  assert.equal(formatLogRecord(received), null);
  assert.ok(formatLogRecord(received, { verbose: true }).includes('command.received'));
  assert.equal(formatLogRecord(entry({ command: 'status' })), null);
  assert.equal(formatLogRecord({ event: 'unrelated' }), null);
  assert.equal(formatLogRecord(null), null);
  const unsafe = formatLogRecord(entry({ error_code: '\u001b[31merror\nnew line', event: 'command.failed' }));
  assert.equal(/[\u001b\n]/.test(unsafe), false);
});

test('server output makes both versions and reducer-off behavior obvious', () => {
  const text = formatLogRecord(entry({ event: 'server.started', app_version: '0.1.9', engine_version: '0.1.8', reducer_mode: 'off' }));
  assert.match(text, /SERVER\s+v0.1.9 \(engine 0.1.8\)/);
  assert.match(text, /WARNING/);
});

test('reader waits for complete UTF-8 records and follows rename rotation and truncation without duplicates', t => {
  const { path } = fixture(t);
  const lines = [];
  const reader = createLogReader(path, { line: line => lines.push(line) });
  t.after(() => reader.close());
  assert.equal(reader.poll(), false);
  const bytes = Buffer.from('first 🔥\nsecond\n');
  writeFileSync(path, bytes.subarray(0, 8)); // middle of the emoji
  reader.poll();
  assert.deepEqual(lines, []);
  appendFileSync(path, bytes.subarray(8));
  reader.poll();
  reader.poll();
  assert.deepEqual(lines, ['first 🔥', 'second']);
  appendFileSync(path, 'late\n');
  renameSync(path, `${path}.1`);
  assert.equal(reader.poll(), false); // drains the old file during a rotation gap
  writeFileSync(path, 'new\n');
  reader.poll();
  assert.deepEqual(lines, ['first 🔥', 'second', 'late', 'new']);
  writeFileSync(path, 'x\n');
  reader.poll();
  assert.equal(lines.at(-1), 'x');
});

test('reader bounds oversized records and resumes at the next newline', t => {
  const { path } = fixture(t);
  writeFileSync(path, 'x'.repeat(1024 * 1024 + 1) + '\nvalid\n');
  const lines = [];
  const warnings = [];
  const reader = createLogReader(path, { line: line => lines.push(line), warn: warning => warnings.push(warning) });
  t.after(() => reader.close());
  reader.poll();
  assert.deepEqual(lines, ['valid']);
  assert.equal(warnings.length, 1);
});

test('recent lines count displayed events rather than raw stages; malformed lines warn without dumping content', t => {
  const { path } = fixture(t);
  writeFileSync(path, jsonLine({ activity_id: 1 }) + jsonLine({ event: 'command.recorded' })
    + 'private invalid content\n' + jsonLine({ activity_id: 2 }) + jsonLine({ activity_id: 3 }));
  let output = '';
  let errors = '';
  viewLogs({ path, lines: 2, follow: false }, { stdout: { write: text => { output += text; } }, stderr: { write: text => { errors += text; } } });
  assert.equal(output.trim().split('\n').length, 2);
  assert.equal(output.includes('#1'), false);
  assert.ok(output.includes('#2'));
  assert.ok(output.includes('#3'));
  assert.ok(errors.includes('malformed'));
  assert.equal(errors.includes('private invalid content'), false);
  output = '';
  viewLogs({ path, lines: 1, follow: false, json: true }, { stdout: { write: text => { output += text; } }, stderr: { write() {} } });
  assert.equal(JSON.parse(output).activity_id, 3);
  assert.throws(() => viewLogs({ path: path + '.missing', follow: false }), /No diagnostic log found/);
});

test('live viewer waits for log creation and emits only new events with --lines 0', { timeout: 2000 }, async t => {
  const { path } = fixture(t);
  let output = '';
  let notify;
  const received = new Promise(resolve => { notify = resolve; });
  const viewer = viewLogs({ path, lines: 0, follow: true }, {
    intervalMs: 10, stderr: { write() {} }, stdout: { write: text => { output += text; notify(); } },
  });
  t.after(() => viewer.close());
  writeFileSync(path, jsonLine({ activity_id: 42 }));
  await received;
  assert.ok(output.includes('#42'));
});

test('logs command reads real files without opening a server or importing SQLite', t => {
  const { path, dir } = fixture(t);
  writeFileSync(path, jsonLine({ review_status: 'awaiting_decision', thread_selection_requested: true }));
  const executable = fileURLToPath(new URL('../bin/flambe-single-burner.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [executable, 'logs', '--no-follow', '--db', join(dir, 'local.sqlite')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /WAITING for thread-selection review/);
  assert.equal(result.stderr.includes('SQLite'), false);
  const raw = spawnSync(process.execPath, [executable, 'logs', '--no-follow', '--log', path, '--json'], { encoding: 'utf8' });
  assert.equal(raw.status, 0, raw.stderr);
  assert.equal(JSON.parse(raw.stdout).activity_id, 305);
  assert.equal(readFileSync(path, 'utf8'), jsonLine({ review_status: 'awaiting_decision', thread_selection_requested: true }));
});
