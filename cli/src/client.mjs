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
    token: env.FLAMBE_API_TOKEN,
    traceId,
  };
}

function errorDetail(payload) {
  if (!payload) return null;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.errors) return JSON.stringify(payload.errors);
  return null;
}

export class FlambeClient {
  constructor({ baseUrl, token, traceId, fetchImpl = globalThis.fetch, now = Date.now, queuePath, queue }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
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

  async status({ activeOnly = false } = {}) {
    const trace = await this.getTrace();
    const threadNames = new Map((trace.threads ?? []).map(thread => [thread.id, thread.name]));
    const latestByActivity = new Map();

    for (const event of trace.events ?? []) {
      if (!event.activity) continue;

      const current = latestByActivity.get(event.activity.id);
      if (!current || compareEvents(event, current) > 0) {
        latestByActivity.set(event.activity.id, event);
      }
    }

    const activities = [...latestByActivity.values()]
      .filter(event => !activeOnly || event.phase === 'B')
      .sort(compareEvents)
      .map(event => ({
        id: event.activity.id,
        name: event.activity.name,
        threadId: event.activity.thread.id,
        threadName: threadNames.get(event.activity.thread.id) ?? null,
        categoryIds: event.activity.categories ?? [],
        startedAt: event.phase === 'B' ? event.timestamp : null,
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

  async resolveThreadId(explicitThreadId) {
    if (explicitThreadId !== undefined && explicitThreadId !== null) {
      const id = Number(explicitThreadId);
      if (!Number.isInteger(id) || id <= 0) throw new Error('--thread must be a positive integer');
      return id;
    }

    const trace = await this.getTrace();
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

  async start({ name, description, threadId, categoryIds, startedAt }) {
    if (!name?.trim()) throw new Error('Activity name is required');
    const timestamp = this.resolveStartTimestamp(startedAt);
    const resolvedCategoryIds = this.resolveCategoryIds(categoryIds);

    const input = {
      name: name.trim(),
      description,
      threadId,
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

  async postStart({ name, description, threadId, categoryIds, timestamp }) {
    const resolvedThreadId = await this.resolveThreadId(threadId);

    const payload = await this.request('/api/activities', {
      method: 'POST',
      body: {
        trace_id: this.traceId,
        thread_id: resolvedThreadId,
        activity: {
          name,
          ...(description ? { description } : {}),
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
    if (!String(activityId).startsWith('offline-')) {
      const id = Number(activityId);
      if (!Number.isInteger(id) || id <= 0) throw new Error('Activity id must be a positive integer');
    }

    const timestamp = this.now();
    const input = { activityId, message, timestamp };

    try {
      const id = await this.queue.resolveActivityId(activityId);
      const eventId = await this.postEnd({ ...input, activityId: id });
      await this.queue.removeAlias(activityId);
      return eventId;
    } catch (error) {
      if (!error?.retryable) throw error;
      await this.queue.enqueue('end', input);
      return 'queued';
    }
  }

  async postEnd({ activityId, message, timestamp }) {
    const payload = await this.request('/api/events', {
      method: 'POST',
      body: {
        trace_id: this.traceId,
        activity_id: Number(activityId),
        event: {
          timestamp_integer: timestamp,
          phase: 'E',
          ...(message ? { message } : {}),
        },
      },
    });

    return payload.data.id;
  }

  async flushQueue() {
    return this.queue.flush({
      start: input => this.postStart(input),
      end: input => this.postEnd(input),
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
