// Local start/end/suspend/resume rules. HTTP is the adapter; SQLite is the source of truth.
export const COMMANDS = ['start', 'end', 'suspend', 'resume', 'status', 'message'];
const RUNNING = new Set(['B', 'R', 'X']);
const ENDED = new Set(['E', 'J', 'V']);
const LIFECYCLE = new Set([...RUNNING, ...ENDED, 'S']);
const STOPWORDS = new Set('the and for with from into that this work task item stuff'.split(' '));
const tokens = name => name.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 4 && !STOPWORDS.has(t));

export class CommandError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.status = status;
    this.body = { error: { code, message, ...extra } };
  }
}
function invalid(message) { throw new CommandError(422, 'INVALID_INPUT', message); }
function notFound() { throw new CommandError(404, 'NOT_FOUND', 'The requested resource was not found'); }
function positiveId(value, field) {
  if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value))
    || !Number.isSafeInteger(Number(value)) || Number(value) <= 0) invalid(`${field} must be a positive integer`);
  return Number(value);
}
function optionalId(value, field) { return value == null ? null : positiveId(value, field); }
function bool(value, field) {
  if (value !== undefined && typeof value !== 'boolean') invalid(`${field} must be boolean`);
  return value ?? false;
}
function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) invalid(`${field} is required`);
  return value.trim();
}
function compare(a, b) { return Date.parse(a.timestamp) - Date.parse(b.timestamp) || a.id - b.id; }

/** Derive state only from lifecycle history; annotations never reopen work. */
export function commandState(trace, filters = {}) {
  const latest = new Map();
  const begins = new Map();
  for (const event of trace.events) {
    if (!event.activity || !LIFECYCLE.has(event.phase)) continue;
    const id = event.activity.id;
    if (!latest.has(id) || compare(event, latest.get(id)) > 0) latest.set(id, event);
    if (event.phase === 'B' && (!begins.has(id) || compare(event, begins.get(id)) < 0)) begins.set(id, event);
  }
  const chain = id => {
    const result = [];
    const seen = new Set();
    while (latest.has(id) && !seen.has(id)) {
      seen.add(id);
      const event = latest.get(id);
      result.unshift(event);
      id = event.activity.parent_id;
    }
    return result;
  };
  const threads = trace.threads.map(thread => ({ ...thread, availableActions: [{
    operation: 'start', arguments: { trace_id: trace.id, thread_id: thread.id, parent_id: null },
  }] }));
  const activities = [...latest.values()].sort(compare).map(event => {
    const activity = event.activity;
    const ancestors = chain(activity.id);
    const status = RUNNING.has(event.phase)
      ? ancestors.slice(0, -1).some(a => a.phase === 'S') ? 'parent_suspended' : 'running'
      : event.phase === 'S' ? 'suspended' : 'ended';
    const descendants = [...latest.values()].filter(e => e.activity.id !== activity.id
      && RUNNING.has(e.phase) && chain(e.activity.id).some(a => a.activity.id === activity.id));
    const args = { trace_id: trace.id, activity_id: activity.id };
    const end = { operation: 'end', arguments: args, ...(descendants.length ? {
      requires: { force: true }, reason: 'open_descendants',
    } : {}) };
    const actions = status === 'running' ? [
      { operation: 'start', arguments: { trace_id: trace.id, thread_id: activity.thread.id, parent_id: activity.id } },
      { operation: 'suspend', arguments: args }, end,
    ] : status === 'suspended' ? [{ operation: 'resume', arguments: args }, end] : [];
    return {
      id: activity.id, name: activity.name, threadId: activity.thread.id,
      threadName: threads.find(t => t.id === activity.thread.id)?.name ?? null,
      parentId: activity.parent_id ?? null, agentId: activity.agent_id ?? null,
      path: ancestors.map(e => e.activity.name), categoryIds: activity.categories ?? [],
      startedAt: begins.get(activity.id)?.timestamp ?? null,
      latestEvent: { id: event.id, phase: event.phase, timestamp: event.timestamp,
        ...(event.message ? { message: event.message } : {}) },
      status, availableActions: actions,
    };
  });
  return {
    trace: { id: trace.id, name: trace.name },
    threads: threads.filter(t => !filters.thread_id || t.id === filters.thread_id),
    activities: activities.filter(a => (!filters.thread_id || a.threadId === filters.thread_id)
      && (!filters.active_only || a.status === 'running')
      && (!filters.suspended_only || ['suspended', 'parent_suspended'].includes(a.status))),
  };
}

/** A command and all of its corrections commit together, or not at all. */
export function executeCommand(store, userId, command, attrs, headerAgent = null) {
  if (!COMMANDS.includes(command) || !attrs || typeof attrs !== 'object' || Array.isArray(attrs)) {
    invalid('command and arguments are required');
  }
  const traceId = positiveId(attrs.trace_id, 'trace_id');
  const trace = store.getTrace(userId, traceId);
  if (!trace) notFound();
  const before = commandState(trace);
  const byId = new Map(before.activities.map(a => [a.id, a]));
  const timestamp = attrs.timestamp ?? Date.now();
  if (!Number.isSafeInteger(timestamp) || !Number.isFinite(new Date(timestamp).getTime())) invalid('timestamp must be milliseconds since epoch');
  const threadId = optionalId(attrs.thread_id, 'thread_id');
  // Starts resolve the parent's lane even if a different lane was requested.
  if (command === 'status' && threadId && !trace.threads.some(t => t.id === threadId)) notFound();
  const filters = { thread_id: threadId,
    active_only: bool(attrs.active_only, 'active_only'),
    suspended_only: bool(attrs.suspended_only, 'suspended_only') };
  if (filters.active_only && filters.suspended_only) invalid('active_only and suspended_only cannot both be true');
  const result = { direction: null, reply: null, actions_applied: [], rules_fired: [], closed_descendants: [] };
  if (command === 'status') return { ...result, state: commandState(trace, filters) };
  if (command === 'message') {
    requiredText(attrs.message, 'message');
    if (attrs.activity_id != null && !byId.has(positiveId(attrs.activity_id, 'activity_id'))) notFound();
    throw new CommandError(503, 'REDUCER_NOT_CONFIGURED',
      'Model review is unavailable in the self-contained runtime. Lifecycle commands remain available; no content was sent to a provider.');
  }
  if (attrs.message != null && typeof attrs.message !== 'string') invalid('message must be a string');
  if (attrs.description != null && typeof attrs.description !== 'string') invalid('description must be a string');
  const force = bool(attrs.force, 'force');
  const agentId = headerAgent?.agent_id ?? attrs.agent_id;
  if (agentId != null && (typeof agentId !== 'string' || !agentId.trim() || agentId.length > 200)) invalid('agent_id is invalid');

  const ancestors = activity => {
    const chain = [];
    const seen = new Set();
    while (activity && !seen.has(activity.id)) {
      seen.add(activity.id);
      chain.unshift(activity);
      activity = byId.get(activity.parentId);
    }
    return chain;
  };
  const record = (id, phase, message) => {
    const event = store.createEvent(userId, { traceId, activityId: id,
      event: { phase, message, timestamp_integer: timestamp } });
    if (event.error) notFound();
    return event;
  };
  const annotate = (id, rule, applied) => {
    result.rules_fired.push({ rule, applied });
    record(id, 'reducer_decision', `rule=${rule} | applied=${JSON.stringify(applied)}`);
  };

  store.db.exec('BEGIN IMMEDIATE');
  try {
    const agent = headerAgent ?? (agentId ? store.identifyAgent(userId, agentId, attrs.agent_name, attrs.agent_platform) : null);
    if (command === 'start') {
      const name = requiredText(attrs.name, 'name');
      if (name.length > 255) invalid('name must be at most 255 characters');
      const categories = attrs.category_ids ?? [];
      if (!Array.isArray(categories)) invalid('category_ids must be an array');
      const categoryIds = [...new Set(categories.map(id => positiveId(id, 'category_id')))];
      const explicitParent = Object.hasOwn(attrs, 'parent_id');
      const requestedParent = optionalId(attrs.parent_id, 'parent_id');
      if (requestedParent && !byId.has(requestedParent)) notFound();
      const duplicate = agentId && [...before.activities].reverse().find(a => a.agentId === agentId
        && a.name === name && !ENDED.has(a.latestEvent.phase));
      if (duplicate) {
        result.activity_id = duplicate.id;
        const type = duplicate.latestEvent.phase === 'S' ? 'resume_existing' : 'no_op';
        result.event_id = type === 'resume_existing'
          ? record(duplicate.id, 'R', 'Resumed by reducer: duplicate start').id : duplicate.latestEvent.id;
        const action = { type, activity_id: duplicate.id };
        result.actions_applied.push(action);
        annotate(duplicate.id, 'duplicate_open', action);
      } else {
        const parent = explicitParent ? byId.get(requestedParent) : [...before.activities].reverse()
          .find(a => a.status === 'running' && (agentId ? a.agentId === agentId : a.threadId === (threadId ?? trace.threads[0]?.id)));
        for (const ancestor of ancestors(parent)) {
          if (ancestor.latestEvent.phase !== 'S') continue;
          record(ancestor.id, 'R', 'Resumed by reducer: child started under suspended work');
          result.actions_applied.push({ type: 'resume_ancestor', activity_id: ancestor.id });
        }
        const created = store.createActivity(userId, {
          traceId, threadId, agent, reduce: true,
          activity: { name, description: attrs.description, categories: categoryIds,
            parent_id: parent?.id ?? null },
          event: { phase: 'B', timestamp_integer: timestamp },
        });
        if (created.error) notFound();
        result.activity_id = created.activity.id;
        result.event_id = created.event.id;
        result.reducer = { ...created.reducer,
          parent_source: parent ? explicitParent ? 'explicit' : 'inferred' : 'root' };
        if (result.actions_applied.length) annotate(result.activity_id, 'resume_ancestor',
          result.actions_applied.map(a => a.activity_id));
        if (!parent && agentId && before.activities.some(a => a.agentId === agentId && a.status === 'running')) {
          annotate(result.activity_id, 'new_root_while_open', { type: 'skipped', reason: 'model_unavailable' });
        } else if (parent) {
          const ancestorTokens = new Set(ancestors(parent).flatMap(a => tokens(a.name)));
          const childTokens = tokens(name);
          if (childTokens.length && childTokens.every(t => !ancestorTokens.has(t))) {
            annotate(result.activity_id, 'name_unfit', { type: 'skipped', reason: 'model_unavailable' });
          }
        }
      }
    } else {
      const id = positiveId(attrs.activity_id, 'activity_id');
      const activity = byId.get(id);
      if (!activity) notFound();
      const phase = command === 'end' ? attrs.phase ?? (attrs.message ? 'V' : 'E') : command === 'resume' ? 'R' : 'S';
      if (command === 'end' && !ENDED.has(phase)) invalid('end phase must be E, J, or V');
      const descendants = before.activities.filter(a => a.id !== id && RUNNING.has(a.latestEvent.phase)
        && ancestors(a).some(p => p.id === id)).sort((a, b) => b.path.length - a.path.length || b.id - a.id);
      if (command === 'end' && descendants.length && !force) {
        throw new CommandError(409, 'OPEN_CHILDREN', 'End descendants first or use force: true', {
          open_children: descendants.map(a => ({ activity_id: a.id, activity_name: a.name })),
        });
      }
      if (command === 'end') {
        for (const child of descendants) {
          const event = record(child.id, 'E', `Ended by reducer: parent activity ${id} (${activity.name}) ended`);
          result.closed_descendants.push({ activity_id: child.id, activity_name: child.name, event_id: event.id });
        }
        if (!descendants.length && activity.parentId != null) result.rules_fired.push({
          rule: 'pop_to_parent', applied: { activity_id: activity.parentId, name: byId.get(activity.parentId)?.name },
        });
      }
      result.activity_id = id;
      result.event_id = record(id, phase, attrs.message).id;
    }
    result.state = commandState(store.getTrace(userId, traceId));
    store.db.exec('COMMIT');
    return result;
  } catch (error) {
    store.db.exec('ROLLBACK');
    throw error;
  }
}
