import assert from 'node:assert/strict';
import test from 'node:test';
import { budgetContext, contextLimitBytes, contextStats } from '../src/local/reducer-context.mjs';
import { validate } from '../src/local/reducer-review.mjs';

const row = (id, attrs = {}) => ({ id, name: `Activity ${id}`, parent_id: null, thread_id: 1,
  agent_id: 'worker', status: 'ended', description: null,
  latest_event: { id, phase: 'E', timestamp: '2026-11-05T12:00:00Z' }, ...attrs });
function context(extra = [], fields = {}) {
  return { instance: { id: 'fixture', name: 'Single Burner' }, trace: { id: 1, name: 'Work' },
    current: 2, kind: 'message', message: 'Review current approach', agent_id: 'worker', advice_only: false,
    reparent_candidates: [], stack: [row(1, { name: 'Root intent', status: 'running' }),
      row(2, { name: 'Current work', parent_id: 1, status: 'running' }), ...extra],
    threads: [{ id: 1, name: 'Engineering' }, { id: 2, name: 'Other work' }],
    thread_selection: false, context_scope: 'open_work_and_recent_history', ...fields };
}
const history = count => Array.from({ length: count }, (_, n) => row(n + 10, {
  description: 'History detail '.repeat(180), latest_event: { id: n + 10, phase: 'E',
    timestamp: new Date(Date.UTC(2026, 10, 5, 12, 0, n)).toISOString(), message: 'Completion note '.repeat(180) },
}));
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const fits = value => assert.ok(bytes(value) <= contextLimitBytes, `${bytes(value)} bytes`);

test('small contexts retain all evidence verbatim and report zero omissions', () => {
  const input = context([row(3, { description: 'Important exact details' })]);
  const result = budgetContext(input, [1, 2]);
  assert.deepEqual(result.stack, input.stack);
  assert.equal(result.message, input.message);
  assert.deepEqual(result.threads, input.threads);
  assert.equal(result.context_budget.omitted_activities, 0);
  assert.equal(result.context_budget.shortened_fields, 0);
  assert.equal(input.context_budget, undefined);
  assert.equal(contextStats(result).bytes, bytes(result));
  fits(result);
});

test('large recent history is selected under budget while the current path and candidate ancestry are retained', () => {
  const input = context([...history(700), row(9001, { status: 'running', parent_id: 9000 }),
    row(9000, { name: 'Candidate root intent', status: 'ended' })], { reparent_candidates: [9001] });
  const result = budgetContext(input, [1, 2, 9000, 9001]);
  fits(result);
  for (const id of [1, 2, 9000, 9001]) assert.ok(result.stack.some(a => a.id === id));
  assert.deepEqual(result.reparent_candidates, [9001]);
  assert.deepEqual(result.threads, input.threads);
  assert.ok(result.context_budget.omitted_ended_activities > 600);
  assert.equal(result.context_budget.omitted_open_activities, 0);
  assert.equal(result.context_budget.omitted_activities, input.stack.length - result.stack.length);
  assert.equal(result.context_budget.source_bytes, bytes(input));
  assert.deepEqual(budgetContext(input, [1, 2, 9000, 9001]), result);
});

test('open work is prioritized over ended history and own work over other agents', () => {
  const input = context([...history(300), ...Array.from({ length: 200 }, (_, n) => row(2000 + n,
    { status: 'running', agent_id: 'other', description: 'Open detail '.repeat(200), thread_id: 2 })),
  row(9001, { status: 'running', description: 'Own open work' })]);
  const result = budgetContext(input, [1, 2]);
  fits(result);
  assert.equal(result.stack[2].id, 9001);
  assert.ok(result.context_budget.omitted_open_activities > 0);
  assert.equal(result.stack.some(a => a.status === 'ended'), false);
});

test('recent history on the current lane is preferred and sorted newest first', () => {
  const input = context(history(150).map((a, i) => ({ ...a, thread_id: i % 2 ? 1 : 2 })));
  const result = budgetContext(input, [1, 2]);
  const selected = result.stack.slice(2);
  assert.equal(selected[0].id, 159);
  assert.ok(selected.every(a => a.thread_id === 1));
  fits(result);
});

test('large mandatory descriptions and lifecycle notes are marked and shortened at UTF-8 boundaries', () => {
  const original = '😀漢字\\\"\n'.repeat(25000);
  const input = context([], { stack: [row(1, { name: 'Exact root intent', description: original, status: 'running' }),
    row(2, { name: 'Exact current intent', parent_id: 1, status: 'running', description: original,
      latest_event: { id: 2, phase: 'B', timestamp: '2026-11-05T12:00:00Z', message: original } })] });
  const result = budgetContext(input, [1, 2]);
  fits(result);
  for (const a of result.stack) {
    assert.ok(a.description.includes('shortened for review'));
    assert.equal(a.description.includes('\ufffd'), false);
    assert.ok(Buffer.byteLength(a.description) <= 8192);
    assert.ok(a.review_text_shortened.includes('description'));
  }
  assert.equal(result.stack[0].name, 'Exact root intent');
  assert.equal(result.stack[1].name, 'Exact current intent');
  assert.equal(result.context_budget.shortened_fields, 3);
  assert.equal(input.stack[0].description, original);
  assert.equal(input.stack[1].latest_event.message, original);
});

test('required root intent stays intact when it fits, even if optional history must be omitted', () => {
  const input = context(history(100));
  input.stack[0].description = 'Exact root constraints '.repeat(1000);
  const result = budgetContext(input, [1, 2]);
  fits(result);
  assert.equal(result.stack[0].description, input.stack[0].description);
  assert.equal(result.stack[0].review_text_shortened, undefined);
  assert.ok(result.context_budget.omitted_activities > 0);
});

test('candidate text is shortened before the current root description', () => {
  const input = context([row(3, { status: 'running', description: 'Candidate detail '.repeat(10000) })],
    { reparent_candidates: [3] });
  input.stack[0].description = 'Root constraints '.repeat(1500);
  const result = budgetContext(input, [1, 2, 3]);
  fits(result);
  assert.equal(result.stack[0].description, input.stack[0].description);
  assert.ok(result.stack.find(a => a.id === 3).review_text_shortened.includes('description'));
});

test('root/current lifecycle messages stay intact before shortening unrelated candidate details', () => {
  const input = context([row(3, { status: 'running', description: 'Candidate detail '.repeat(10000) })],
    { reparent_candidates: [3] });
  input.stack[0].latest_event.message = 'Root constraint in lifecycle note '.repeat(500);
  const result = budgetContext(input, [1, 2, 3]);
  fits(result);
  assert.equal(result.stack[0].latest_event.message, input.stack[0].latest_event.message);
  assert.equal(result.stack[0].review_text_shortened, undefined);
});

test('omitted activities cannot become mutation targets; visible no-op/advice permissions are unchanged', () => {
  const input = context(history(300));
  const result = budgetContext(input, [1, 2]);
  const included = new Set(result.stack.map(a => a.id));
  const omitted = input.stack.find(a => !included.has(a.id));
  const decision = { assessment: 'on_track', direction: 'continue', reply: null, rationale: 'Review', actions: [] };
  assert.deepEqual(validate(decision, result), []);
  assert.throws(() => validate({ ...decision, actions: [{ type: 'update_activity', activity_id: omitted.id,
    name: 'Not allowed', description: null }] }, result), e => e.body?.error?.code === 'REDUCER_INVALID_DECISION');
});

test('a shortened description cannot be overwritten by a model that never saw its full original', () => {
  const input = context();
  input.stack[0].description = 'Hidden original constraint '.repeat(5000);
  const result = budgetContext(input, [1, 2]);
  const decision = { assessment: 'on_track', direction: 'continue', reply: null, rationale: 'Review',
    actions: [{ type: 'update_activity', activity_id: 1, name: null, description: 'Replace with partial text' }] };
  assert.throws(() => validate(decision, result), e => e.body?.error?.code === 'REDUCER_INVALID_DECISION');
  assert.deepEqual(validate({ ...decision, actions: [{ type: 'update_activity', activity_id: 1, name: 'Clarified name', description: null }] }, result),
    [{ type: 'update_activity', activity_id: 1, name: 'Clarified name', description: null }]);
});

for (const [name, fields, required] of [
  ['full request', { message: 'x'.repeat(70000) }, [1, 2]],
  ['full thread catalog', { threads: Array.from({ length: 1000 }, (_, id) => ({ id, name: 'x'.repeat(255) })) }, [1, 2]],
  ['mandatory structure', { stack: Array.from({ length: 500 }, (_, id) => row(id + 1, { name: 'x'.repeat(255) })) }, Array.from({ length: 500 }, (_, n) => n + 1)],
]) {
  test(`irreducible ${name} still fails explicitly rather than dropping required evidence`, () => {
    assert.throws(() => budgetContext(context([], fields), required), e => e.body?.error?.code === 'REDUCER_CONTEXT_TOO_LARGE');
  });
}
