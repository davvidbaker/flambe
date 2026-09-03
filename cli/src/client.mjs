import { FlambeQueue } from './queue.mjs';

export function configFromEnv(env = process.env) {
  const required = ['FLAMBE_URL', 'FLAMBE_API_TOKEN', 'FLAMBE_TRACE_ID'];
  const missing = required.filter(key => !env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  }

  const traceId = Number(env.FLAMBE_TRACE_ID);
  if (!Number.isInteger(traceId) || traceId <= 0) {
    throw new Error('FLAMBE_TRACE_ID must be a positive integer');
  }

  return {
    baseUrl: env.FLAMBE_URL.replace(/\/+$/, ''),
    ...agentIdentityFromEnv(env),
    token: env.FLAMBE_API_TOKEN,
    traceId,
  };
}

export function agentIdentityFromEnv(env = process.env) {
  const agentId = env.FLAMBE_AGENT_ID?.trim()
    || (env.CODEX_SESSION_ID?.trim() && env.CODEX_THREAD_ID?.trim()
      ? `codex:${env.CODEX_SESSION_ID.trim()}:${env.CODEX_THREAD_ID.trim()}`
      : undefined)
    || (env.CURSOR_AGENT?.trim() && env.CURSOR_CONVERSATION_ID?.trim()
      ? `cursor:${env.CURSOR_CONVERSATION_ID.trim()}`
      : undefined)
    || claudeAgentId(env);
  const agentName = env.FLAMBE_AGENT_NAME?.trim() || undefined;

  return {
    ...(agentId ? { agentId } : {}),
    ...(agentName ? { agentName } : {}),
  };
}

function firstPresent(...values) {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
}

function claudeAgentId(env) {
  const inClaude = env.CLAUDECODE?.trim() || env.CLAUDE_CODE_CHILD_SESSION?.trim();
  if (!inClaude) return undefined;

  const sessionId = firstPresent(
    env.CLAUDE_CODE_SESSION_ID,
    env.CLAUDE_SESSION_ID,
    env.CLAUDE_CODE_REMOTE_SESSION_ID,
    env.CLAUDE_CODE_BRIDGE_SESSION_ID,
  );
  return sessionId ? `claude:${sessionId}` : undefined;
}

function errorDetail(payload) {
  if (!payload) return null;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.errors) return JSON.stringify(payload.errors);
  return null;
}

export class FlambeClient {
  constructor({ baseUrl, token, traceId, agentId, agentName, fetchImpl = globalThis.fetch, now = Date.now, queuePath, queue }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
    this.agentId = agentId;
    this.agentName = agentName;
    this.traceId = Number(traceId);
    this.fetch = fetchImpl;
    this.now = now;
    this.queue = queue ?? new FlambeQueue({ baseUrl: this.baseUrl, traceId: this.traceId, path: queuePath });
  }

  async request(path, { method = 'GET', body } = {}) {
    let response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          ...(this.agentId ? { 'x-flambe-agent-id': this.agentId } : {}),
          ...(this.agentId && this.agentName ? { 'x-flambe-agent-name': this.agentName } : {}),
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (error) {
      error.retryable = true;
      throw error;
    }

    const text = await response.text();
    let payload = null;

    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const detail = errorDetail(payload);
      const error = new Error(`Flambe API request failed (${response.status})${detail ? `: ${detail}` : ''}`);
      error.status = response.status;
      error.retryable = response.status >= 500;
      throw error;
    }

    return payload;
  }

  async getTrace() {
    const payload = await this.request(`/api/traces/${this.traceId}`);
    return payload.data;
  }

  async threads() {
    const trace = await this.getTrace();
    const threads = [...(trace.threads ?? [])]
      .sort((a, b) => (a.rank - b.rank) || (a.id - b.id));

    return threads.map((thread, index) => ({
      id: thread.id,
      name: thread.name,
      rank: thread.rank,
      default: index === 0,
    }));
  }

  async categories() {
    const payload = await this.request('/api/categories');
    return payload.data;
  }

  async status({ activeOnly = false, suspendedOnly = false } = {}) {
    if (activeOnly && suspendedOnly) throw new Error('--active and --suspended cannot be used together');
    const trace = await this.getTrace();
    return this.statusFromTrace(trace, { activeOnly, suspendedOnly });
  }

  statusFromTrace(trace, { activeOnly = false, suspendedOnly = false } = {}) {
    const threadNames = new Map((trace.threads ?? []).map(thread => [thread.id, thread.name]));
    const latestByActivity = new Map();
    const startedAtByActivity = new Map();

    for (const event of trace.events ?? []) {
      if (!event.activity) continue;

      if (event.phase === 'B') {
        const startedAt = startedAtByActivity.get(event.activity.id);
        if (!startedAt || compareEvents(event, startedAt) < 0) startedAtByActivity.set(event.activity.id, event);
      }

      const current = latestByActivity.get(event.activity.id);
      if (!current || compareEvents(event, current) > 0) {
        latestByActivity.set(event.activity.id, event);
      }
    }

    const pathsByActivity = new Map();
    const activityById = new Map([...latestByActivity.values()].map(event => [event.activity.id, event.activity]));
    const pathFor = activity => {
      if (pathsByActivity.has(activity.id)) return pathsByActivity.get(activity.id);
      const parent = activity.parent_id == null ? null : activityById.get(activity.parent_id);
      const path = [...(parent ? pathFor(parent) : []), activity.name];
      pathsByActivity.set(activity.id, path);
      return path;
    };

    const activities = [...latestByActivity.values()]
      .filter(event => !activeOnly || event.phase === 'B' || event.phase === 'R')
      .filter(event => !suspendedOnly || event.phase === 'S')
      .sort(compareEvents)
      .map(event => ({
        id: event.activity.id,
        name: event.activity.name,
        threadId: event.activity.thread.id,
        threadName: threadNames.get(event.activity.thread.id) ?? null,
        parentId: event.activity.parent_id ?? null,
        path: pathFor(event.activity),
        categoryIds: event.activity.categories ?? [],
        startedAt: startedAtByActivity.get(event.activity.id)?.timestamp ?? null,
        latestEvent: {
          id: event.id,
          phase: event.phase,
          timestamp: event.timestamp,
          ...(event.message ? { message: event.message } : {}),
        },
      }));

    return {
      trace: { id: trace.id, name: trace.name },
      activities,
    };
  }

  resolveThreadId(explicitThreadId, trace) {
    if (explicitThreadId !== undefined && explicitThreadId !== null) {
      const id = Number(explicitThreadId);
      if (!Number.isInteger(id) || id <= 0) throw new Error('--thread must be a positive integer');
      return id;
    }

    const threads = [...(trace.threads ?? [])].sort((a, b) => (a.rank - b.rank) || (a.id - b.id));
    if (threads.length === 0) throw new Error(`Trace ${this.traceId} has no threads`);
    return threads[0].id;
  }

  resolveCategoryIds(categoryIds = []) {
    const resolved = categoryIds.map(categoryId => Number(categoryId));
    if (resolved.some(id => !Number.isInteger(id) || id <= 0)) {
      throw new Error('--category must be a positive integer');
    }
    return [...new Set(resolved)];
  }

  resolveParentId(parentId) {
    if (parentId === undefined || parentId === null) return parentId;
    if (String(parentId).startsWith('offline-')) return parentId;
    const id = Number(parentId);
    if (!Number.isInteger(id) || id <= 0) throw new Error('--parent must be a positive integer');
    return id;
  }

  resolveStartTimestamp(startedAt) {
    if (startedAt === undefined || startedAt === null) return this.now();
    if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(startedAt)) {
      throw new Error('--started-at must be an ISO-8601 timestamp with a timezone');
    }

    const timestamp = Date.parse(startedAt);
    if (!Number.isFinite(timestamp)) {
      throw new Error('--started-at must be a valid ISO-8601 timestamp');
    }

    return timestamp;
  }

  async start({ name, description, threadId, parentId, categoryIds, startedAt }) {
    if (!name?.trim()) throw new Error('Activity name is required');
    const timestamp = this.resolveStartTimestamp(startedAt);
    const resolvedCategoryIds = this.resolveCategoryIds(categoryIds);

    const input = {
      name: name.trim(),
      description,
      threadId,
      parentId: this.resolveParentId(parentId),
      categoryIds: resolvedCategoryIds,
      timestamp,
    };

    try {
      return await this.postStart(input);
    } catch (error) {
      if (!error?.retryable) throw error;
      return this.queue.enqueue('start', { input });
    }
  }

  async postStart({ name, description, threadId, parentId, categoryIds, timestamp }) {
    const trace = await this.getTrace();
    const resolvedThreadId = this.resolveThreadId(threadId, trace);
    const activeActivities = this.statusFromTrace(trace, { activeOnly: true }).activities;
    const inferredParentId = activeActivities
      .filter(activity => activity.threadId === resolvedThreadId)
      .at(-1)?.id;
    const resolvedParentId = parentId === undefined
      ? inferredParentId
      : await this.queue.resolveActivityId(parentId);

    if (String(resolvedParentId).startsWith('offline-')) {
      const error = new Error('Parent activity is queued for offline delivery');
      error.retryable = true;
      throw error;
    }

    const payload = await this.request('/api/activities', {
      method: 'POST',
      body: {
        trace_id: this.traceId,
        thread_id: resolvedThreadId,
        activity: {
          name,
          ...(description ? { description } : {}),
          ...(resolvedParentId ? { parent_id: resolvedParentId } : {}),
          categories: categoryIds,
        },
        event: {
          timestamp_integer: timestamp,
          phase: 'B',
        },
      },
    });

    return payload.data.activity.id;
  }

  async end({ activityId, message }) {
    return this.lifecycleEvent({ activityId, message, phase: 'E', queueType: 'end' });
  }

  async suspend({ activityId, message }) {
    return this.lifecycleEvent({ activityId, message, phase: 'S', queueType: 'suspend' });
  }

  async resume({ activityId, message }) {
    return this.lifecycleEvent({ activityId, message, phase: 'R', queueType: 'resume' });
  }

  async lifecycleEvent({ activityId, message, phase, queueType }) {
    if (!String(activityId).startsWith('offline-')) {
      const id = Number(activityId);
      if (!Number.isInteger(id) || id <= 0) throw new Error('Activity id must be a positive integer');
    }

    const timestamp = this.now();
    const input = { activityId, message, timestamp };

    try {
      const id = await this.queue.resolveActivityId(activityId);
      if (String(id).startsWith('offline-')) {
        await this.queue.enqueue(queueType, input);
        return 'queued';
      }
      const eventId = await this.postLifecycleEvent({ ...input, activityId: id, phase });
      if (phase === 'E') await this.queue.removeAlias(activityId);
      return eventId;
    } catch (error) {
      if (!error?.retryable) throw error;
      await this.queue.enqueue(queueType, input);
      return 'queued';
    }
  }

  async postLifecycleEvent({ activityId, message, timestamp, phase }) {
    const payload = await this.request('/api/events', {
      method: 'POST',
      body: {
        trace_id: this.traceId,
        activity_id: Number(activityId),
        event: {
          timestamp_integer: timestamp,
          phase,
          ...(message ? { message } : {}),
        },
      },
    });

    return payload.data.id;
  }

  async flushQueue() {
    return this.queue.flush({
      start: input => this.postStart(input),
      end: input => this.postLifecycleEvent({ ...input, phase: 'E' }),
      suspend: input => this.postLifecycleEvent({ ...input, phase: 'S' }),
      resume: input => this.postLifecycleEvent({ ...input, phase: 'R' }),
    });
  }
}

export function clientFromEnv(env = process.env, overrides = {}) {
  return new FlambeClient({ ...configFromEnv(env), queuePath: env.FLAMBE_QUEUE_PATH, ...overrides });
}

function compareEvents(a, b) {
  const timestampDifference = Date.parse(a.timestamp) - Date.parse(b.timestamp);
  return timestampDifference || (a.id - b.id);
}
