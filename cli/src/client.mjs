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
  constructor({ baseUrl, token, traceId, fetchImpl = globalThis.fetch, now = Date.now }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
    this.traceId = Number(traceId);
    this.fetch = fetchImpl;
    this.now = now;
  }

  async request(path, { method = 'GET', body } = {}) {
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.token}`,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

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
      throw new Error(`Flambe API request failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }

    return payload;
  }

  async getTrace() {
    const payload = await this.request(`/api/traces/${this.traceId}`);
    return payload.data;
  }

  async status({ activeOnly = false } = {}) {
    const trace = await this.getTrace();
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

  async start({ name, description, threadId }) {
    if (!name?.trim()) throw new Error('Activity name is required');
    const resolvedThreadId = await this.resolveThreadId(threadId);

    const payload = await this.request('/api/activities', {
      method: 'POST',
      body: {
        trace_id: this.traceId,
        thread_id: resolvedThreadId,
        activity: {
          name: name.trim(),
          ...(description ? { description } : {}),
          categories: [],
        },
        event: {
          timestamp_integer: this.now(),
          phase: 'B',
        },
      },
    });

    return payload.data.activity.id;
  }

  async end({ activityId, message }) {
    const id = Number(activityId);
    if (!Number.isInteger(id) || id <= 0) throw new Error('Activity id must be a positive integer');

    const payload = await this.request('/api/events', {
      method: 'POST',
      body: {
        trace_id: this.traceId,
        activity_id: id,
        event: {
          timestamp_integer: this.now(),
          phase: 'E',
          ...(message ? { message } : {}),
        },
      },
    });

    return payload.data.id;
  }
}

export function clientFromEnv(env = process.env, overrides = {}) {
  return new FlambeClient({ ...configFromEnv(env), ...overrides });
}

function compareEvents(a, b) {
  const timestampDifference = Date.parse(a.timestamp) - Date.parse(b.timestamp);
  return timestampDifference || (a.id - b.id);
}
