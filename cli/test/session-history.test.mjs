import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readSessionHistory } from '../src/session-history.mjs';

test('Claude history includes subagents once and reports malformed records without returning content', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'flambe-history-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const parent = join(dir, 'session.jsonl');
  const children = join(dir, 'session', 'subagents');
  await mkdir(children, { recursive: true });
  const record = (uuid, content) => JSON.stringify({ type: 'assistant', uuid,
    timestamp: '2026-11-15T12:00:00Z', message: { role: 'assistant', content } });
  const duplicate = record('shared', [{ type: 'text', text: 'PRIVATE SESSION TEXT' }]);
  await writeFile(parent, `${duplicate}\n`);
  await writeFile(join(children, 'agent-child.jsonl'), `${duplicate}\ninvalid\n${record('child', [{ type: 'tool_use', name: 'Bash' }])}\n`);

  const result = await readSessionHistory('claude', parent);
  assert.equal(result.entries.length, 2);
  assert.deepEqual(result.entries[1].tools, ['Bash']);
  assert.match(result.coverage_gaps[0], /1 unreadable record/);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE SESSION TEXT/);
});
