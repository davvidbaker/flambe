import assert from 'node:assert/strict';
import test from 'node:test';
import { LocalStore } from '../src/local/store.mjs';
import { reconcileTrace } from '../src/local/reconcile.mjs';

function fixture(t) {
  const store = new LocalStore(':memory:');
  t.after(() => store.close());
  const { user, traceId } = store.credentials();
  const agent = { agent_id: 'reconcile-test', name: 'Repair Agent' };
  const trace = () => store.getTrace(user.id, traceId);
  const reconcile = proposal => reconcileTrace(store, user.id, traceId, agent, proposal);
  return { store, trace, reconcile };
}

function change(trace, extra = {}) {
  return {
    ref: 'work', name: 'Verify repair', reason: 'Start missing from trace',
    thread_id: trace.threads[0].id,
    events: [{ phase: 'B', timestamp_ms: 1000, timing: 'observed', basis: 'Session tool timestamp' }],
    ...extra,
  };
}

test('repair restores active work, records provenance, and replays without duplicates', t => {
  const { trace, reconcile } = fixture(t);
  const proposal = {
    repair_id: 'first', trace_version: reconcile().json.data.trace_version,
    changes: [change(trace())], coverage_gaps: ['Subagent log unavailable'],
  };
  const result = reconcile(proposal).json.data;
  assert.equal(result.active_stack.length, 1);
  assert.equal(result.applied[0].provenance[0].timing, 'observed');
  assert.equal(reconcile(proposal).json.data.replayed, true);
  assert.equal(trace().events.length, 1);
  assert.equal(reconcile({ ...proposal, repair_id: 'stale' }).json.error, 'TRACE_VERSION_CHANGED');
});

test('repair retimes identified events and defers conflicting corrections', t => {
  const { trace, reconcile } = fixture(t);
  const first = reconcile({
    repair_id: 'first', trace_version: reconcile().json.data.trace_version, changes: [change(trace())],
  }).json.data;
  const original = first.applied[0].after.events[0];
  const activityId = first.applied[0].activity_id;
  const unplaced = change(trace(), { ref: 'lost', parent_ref: 'unknown' });
  const corrected = change(trace(), { activity_id: activityId });
  Object.assign(corrected.events[0], { event_id: original.id, timestamp_ms: 2000, timing: 'estimated' });
  const result = reconcile({
    repair_id: 'retime', trace_version: first.trace_version, changes: [corrected, unplaced],
  }).json.data;
  assert.equal(result.applied[0].before.events[0].timestamp_ms, 1000);
  assert.equal(result.applied[0].after.events[0].timestamp_ms, 2000);
  assert.equal(result.conflicts[0].code, 'PARENT_UNRESOLVED');
});

test('a failed receipt write rolls back all history changes', t => {
  const { store, trace, reconcile } = fixture(t);
  const baseline = reconcile().json.data.trace_version;
  store.db.exec(`CREATE TRIGGER reject_repair BEFORE INSERT ON reconciliation_receipts
    BEGIN SELECT RAISE(ABORT, 'failed receipt'); END;`);
  assert.throws(() => reconcile({
    repair_id: 'rollback', trace_version: baseline, changes: [change(trace())],
  }), /failed receipt/);
  assert.equal(trace().events.length, 0);
  assert.equal(reconcile().json.data.trace_version, baseline);
});

test('repair reparents an existing activity and adds a missing transition without replacing its start', t => {
  const { trace, reconcile } = fixture(t);
  const first = reconcile({
    repair_id: 'first', trace_version: reconcile().json.data.trace_version,
    changes: [change(trace())],
  }).json.data;
  const original = first.applied[0].after.events[0];
  const parent = change(trace(), { ref: 'parent', name: 'Release' });
  parent.events[0].timestamp_ms = 900;
  const child = change(trace(), { activity_id: first.applied[0].activity_id, parent_ref: 'parent' });
  child.events[0].event_id = original.id;
  child.events.push({ phase: 'S', timestamp_ms: 1200, timing: 'estimated', basis: 'Work paused before the next task' });
  const result = reconcile({
    repair_id: 'hierarchy', trace_version: first.trace_version, changes: [parent, child],
  }).json.data;
  assert.equal(result.applied[1].before.activity.parent_id, null);
  assert.equal(result.applied[1].after.activity.parent_id, result.applied[0].activity_id);
  assert.equal(result.applied[1].after.events[0].id, original.id);
  assert.equal(result.applied[1].after.events[1].phase, 'S');
  assert.equal(result.active_stack.length, 1);
});

test('the reducer sees the whole proposal and can defer a change, with fallback on provider failure', async t => {
  const { store, trace, reconcile } = fixture(t);
  const { reviewReconciliation } = await import('../src/local/reconcile.mjs');
  const { user, traceId } = store.credentials();
  const agent = { agent_id: 'reconcile-test', name: 'Repair Agent' };
  const proposal = {
    repair_id: 'review', trace_version: reconcile().json.data.trace_version,
    changes: [change(trace()), change(trace(), { ref: 'second' })],
  };
  const accepted = await reviewReconciliation(store, user.id, traceId, agent, proposal, ({ context }) => {
    assert.deepEqual(context.proposal, proposal);
    return { accepted_refs: ['work'] };
  });
  assert.deepEqual([...accepted.accepted], ['work']);
  const offline = await reviewReconciliation(store, user.id, traceId, agent, proposal, () => {
    throw new Error('Unavailable');
  });
  assert.equal(offline, undefined);
  const result = reconcileTrace(store, user.id, traceId, agent, proposal, accepted).json.data;
  assert.equal(result.review, 'reducer');
  assert.equal(result.conflicts[0].code, 'REDUCER_DEFERRED');
});

test('delegated work keeps its identity when evidence links it to the caller tree', t => {
  const { trace, reconcile } = fixture(t);
  const child = change(trace(), { ref: 'child', parent_ref: 'work', agent_id: 'child-agent', session_ref: 'child-session' });
  child.events[0].timestamp_ms = 1100;
  const unlinked = change(trace(), { ref: 'unlinked', agent_id: 'other' });
  const result = reconcile({
    repair_id: 'delegated', trace_version: reconcile().json.data.trace_version,
    changes: [change(trace()), child, unlinked],
  }).json.data;
  assert.equal(result.applied[1].after.activity.agent_id, 'child-agent');
  assert.equal(result.applied[1].after.activity.parent_id, result.applied[0].activity_id);
  assert.equal(result.active_stack.length, 2);
  assert.equal(result.conflicts[0].code, 'ACTIVITY_OWNERSHIP_UNVERIFIED');
  assert.equal(reconcile().json.data.events[1].agent_id, 'child-agent');
});

test('reviewed placement is audited and still checked against the historical bounds', async t => {
  const { store, trace, reconcile } = fixture(t);
  const { reviewReconciliation } = await import('../src/local/reconcile.mjs');
  const { user, traceId } = store.credentials();
  const agent = { agent_id: 'reconcile-test', name: 'Repair Agent' };
  const child = change(trace(), { ref: 'child' });
  child.events[0].timestamp_ms = 2000;
  const proposal = {
    repair_id: 'placement', trace_version: reconcile().json.data.trace_version,
    changes: [change(trace()), child, change(trace(), { ref: 'before-parent',
      events: [{ phase: 'B', timestamp_ms: 500, timing: 'observed', basis: 'Recorded too early' }],
    })],
  };
  const review = await reviewReconciliation(store, user.id, traceId, agent, proposal, () => ({
    accepted_refs: ['work', 'child', 'before-parent'],
    placements: [{ ref: 'child', parent_ref: 'work' }, { ref: 'before-parent', parent_ref: 'work' }],
  }));
  const result = reconcileTrace(store, user.id, traceId, agent, proposal, review).json.data;
  assert.equal(result.applied[1].reviewed_parent_ref, 'work');
  assert.equal(result.conflicts[0].code, 'ACTIVITY_PLACEMENT_UNVERIFIED');
  assert.equal(result.applied[1].after.activity.parent_id, result.applied[0].activity_id);
});
