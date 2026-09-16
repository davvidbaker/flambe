import { FlambeQueue } from './queue.mjs';
import { defaultAgentNamesPath, rememberAgentName, rememberedAgentName } from './agentNames.mjs';

const REQUIRED_AGENT_COMMANDS = ['start', 'end', 'suspend', 'resume', 'status', 'message'];

export function hostConfigFromEnv(env = process.env) {
  const required = ['FLAMBE_URL', 'FLAMBE_API_TOKEN'];
  const missing = required.filter(key => !env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`);
  }

  return {
    baseUrl: env.FLAMBE_URL.replace(/\/+$/, ''),
    token: env.FLAMBE_API_TOKEN,
  };
}

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

  const defaultThread = env.FLAMBE_THREAD?.trim() || undefined;

  return {
    baseUrl: env.FLAMBE_URL.replace(/\/+$/, ''),
    ...agentIdentityFromEnv(env),
    token: env.FLAMBE_API_TOKEN,
    traceId,
    ...(defaultThread ? { defaultThread } : {}),
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
  const agentNamesPath = env.FLAMBE_AGENT_NAMES_PATH?.trim() || defaultAgentNamesPath();
  // An explicit name is an override; otherwise reuse whatever the reducer named this agent.
  const agentName = env.FLAMBE_AGENT_NAME?.trim() || rememberedAgentName(agentId, agentNamesPath);
  // The product the agent runs on ("Cursor Cloud", "Codex"); many agents share one.
  const agentPlatform = env.FLAMBE_AGENT_PLATFORM?.trim() || platformFromAgentId(agentId);

  return {
    ...(agentId ? { agentId, agentNamesPath } : {}),
    ...(agentName ? { agentName } : {}),
    ...(agentPlatform ? { agentPlatform } : {}),
  };
}

function platformFromAgentId(agentId) {
  if (!agentId) return undefined;
  if (agentId.startsWith('codex:')) return 'Codex';
  if (agentId.startsWith('cursor:')) return 'Cursor';
  if (agentId.startsWith('claude:')) return 'Claude Code';
  return undefined;
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

const LIFECYCLE_PHASES = new Set(['B', 'E', 'S', 'R']);

function errorDetail(payload) {
  if (!payload) return null;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error && typeof payload.error === 'object') {
    const message = payload.error.message ?? payload.error.code;
    const openChildren = payload.error.open_children;
    if (!Array.isArray(openChildren) || openChildren.length === 0) return message ?? JSON.stringify(payload.error);

    const children = openChildren
      .map(child => `${child.activity_id} (${child.activity_name ?? child.name ?? 'unnamed'})`)
      .join(', ');
    const ids = openChildren.map(child => child.activity_id).join(', ');
    return `${message ?? 'Open children remain'}: ${children}. End ${ids} first (or pass --force).`;
  }
  if (payload.errors) return JSON.stringify(payload.errors);
  return null;
}

export class FlambeClient {
  constructor({ baseUrl, token, traceId, threadId, defaultThread, agentId, agentName, agentPlatform, agentNamesPath, fetchImpl = globalThis.fetch, now = Date.now, queuePath, queue, onReducerNote }) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
    this.agentId = agentId;
    this.agentName = agentName;
    this.agentPlatform = agentPlatform;
    this.agentNamesPath = agentNamesPath;
    this.traceId = Number(traceId);
    this.defaultThread = firstPresent(defaultThread, threadId == null ? undefined : String(threadId));
    this.fetch = fetchImpl;
    this.now = now;
    this.onReducerNote = onReducerNote;
    this.queue = queue ?? new FlambeQueue({ baseUrl: this.baseUrl, traceId: this.traceId, path: queuePath });
    this.agentCommandsCapability = null;
  }

  async supportsAgentCommands() {
    if (!this.agentCommandsCapability) {
      const probe = this.request('/api/agent-commands', { responseMetadata: true })
        .then(({ payload, contentType }) => {
          if (contentType.toLowerCase().startsWith('text/html')) return false;
          const commands = payload?.data?.commands;
          if (payload?.data?.version !== 1
            || !Array.isArray(commands)
            || REQUIRED_AGENT_COMMANDS.some(command => !commands.includes(command))) {
            throw new Error('Flambe API returned an invalid agent-command capability document');
          }
          return true;
        })
        .catch(error => {
          if (error?.status === 404 || error?.status === 405) return false;
          this.agentCommandsCapability = null;
          throw error;
        });
      this.agentCommandsCapability = probe;
    }
    return this.agentCommandsCapability;
  }

  async agentCommand(command, arguments_) {
    const payload = await this.request('/api/agent-commands', {
      method: 'POST',
      body: { command, arguments: arguments_ },
    });
    return payload.data;
  }

  commandIdentity() {
    return {
      trace_id: this.traceId,
      ...(this.agentId ? { agent_id: this.agentId } : {}),
      ...(this.agentName ? { agent_name: this.agentName } : {}),
      ...(this.agentPlatform ? { agent_platform: this.agentPlatform } : {}),
    };
  }

  async request(path, { method = 'GET', body, responseMetadata = false } = {}) {
    let response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          ...(this.agentId ? { 'x-flambe-agent-id': this.agentId } : {}),
          ...(this.agentId && this.agentName ? { 'x-flambe-agent-name': this.agentName } : {}),
          ...(this.agentId && this.agentPlatform ? { 'x-flambe-agent-platform': this.agentPlatform } : {}),
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

    this.adoptAgentName(response.headers);
    if (responseMetadata) {
      return {
        payload,
        contentType: response.headers.get('content-type') ?? '',
        status: response.status,
      };
    }
    return payload;
  }

  /**
   * The reducer names agents that arrive without a name and echoes the name on every
   * response (ADR-012). Keep it for the rest of this process, remember it for future
   * ones, and tell the worker the first time.
   */
  adoptAgentName(headers) {
    if (!this.agentId || !headers?.get) return;
    const name = headers.get('x-flambe-agent-name')?.trim();
    if (!name) return;

    const assigned = headers.get('x-flambe-agent-name-assigned') === 'true';
    if (name !== this.agentName) {
      this.agentName = name;
      if (this.agentNamesPath) rememberAgentName(this.agentId, name, this.agentNamesPath);
    }
    if (assigned) this.onReducerNote?.({ type: 'agent_named', agentId: this.agentId, name });
  }

  async whoami() {
    if (!this.agentId) {
      throw new Error('No agent id for this process; set FLAMBE_AGENT_ID (Cursor, Codex, and Claude Code sessions derive one automatically)');
    }
    const payload = await this.request('/api/agents/me');
    return {
      agentId: payload.data.agent_id,
      name: payload.data.name,
      platform: payload.data.platform ?? null,
      nameAssigned: payload.data.name_assigned === true,
    };
  }

  async getTrace() {
    const payload = await this.request(`/api/traces/${this.traceId}`);
    return payload.data;
  }

  async threads() {
    const trace = await this.getTrace();
    const threads = sortedThreads(trace);
    const defaultId = this.defaultThread
      ? matchThread(threads, this.defaultThread, this.traceId).id
      : threads[0]?.id;

    return threads.map(thread => ({
      id: thread.id,
      name: thread.name,
      rank: thread.rank,
      default: thread.id === defaultId,
    }));
  }

  async categories() {
    const payload = await this.request('/api/categories');
    return payload.data;
  }

  async status({ activeOnly = false, suspendedOnly = false } = {}) {
    if (activeOnly && suspendedOnly) throw new Error('--active and --suspended cannot be used together');
    if (await this.supportsAgentCommands()) {
      const result = await this.agentCommand('status', {
        ...this.commandIdentity(),
        active_only: activeOnly,
        suspended_only: suspendedOnly,
      });
      return result.state;
    }
    const trace = await this.getTrace();
    return this.statusFromTrace(trace, { activeOnly, suspendedOnly });
  }

  statusFromTrace(trace, { activeOnly = false, suspendedOnly = false } = {}) {
    const threadNames = new Map((trace.threads ?? []).map(thread => [thread.id, thread.name]));
    const latestByActivity = new Map();
    const startedAtByActivity = new Map();

    for (const event of trace.events ?? []) {
      if (!event.activity) continue;
      // Reducer annotations (reducer_incoming / reducer_decision) do not change state.
      if (!LIFECYCLE_PHASES.has(event.phase)) continue;

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
        agentId: event.activity.agent_id ?? null,
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

  async resolveThreadId(explicitThreadId) {
    const hasExplicit = explicitThreadId != null && String(explicitThreadId).trim() !== '';
    const selector = hasExplicit ? explicitThreadId : this.defaultThread;
    if (selector == null || String(selector).trim() === '') return undefined;

    const raw = String(selector).trim();
    if (/^\d+$/.test(raw)) {
      const id = Number(raw);
      if (id <= 0) throw new Error('--thread must be a positive integer');
      return id;
    }

    const trace = await this.getTrace();
    return matchThread(sortedThreads(trace), raw, this.traceId).id;
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
      threadId: await this.resolveThreadId(threadId),
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

  /**
   * `start` is a proposal (ADR-012): the reducer picks the parent (this agent's newest
   * active activity unless `--parent`/`--root` said otherwise), puts a child on its
   * parent's thread, inherits categories, and places roots asynchronously. So the CLI
   * sends only what the worker actually said: `parent_id` absent = infer, `null` = root.
   */
  async postStart({ name, description, threadId, parentId, categoryIds, timestamp }) {
    if (await this.supportsAgentCommands()) {
      const resolvedParentId = parentId === undefined || parentId === null
        ? parentId
        : await this.queue.resolveActivityId(parentId);
      if (String(resolvedParentId).startsWith('offline-')) {
        const error = new Error('Parent activity is queued for offline delivery');
        error.retryable = true;
        throw error;
      }
      const result = await this.agentCommand('start', {
        ...this.commandIdentity(),
        name,
        ...(description ? { description } : {}),
        ...(threadId === undefined ? {} : { thread_id: Number(threadId) }),
        ...(resolvedParentId === undefined ? {} : { parent_id: resolvedParentId }),
        category_ids: categoryIds,
        timestamp,
      });
      this.reportCommandResult(result);
      return result.activity_id;
    }

    const resolvedParentId = parentId === undefined || parentId === null
      ? parentId
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
        ...(threadId === undefined ? {} : { thread_id: threadId }),
        activity: {
          name,
          ...(description ? { description } : {}),
          ...(resolvedParentId === undefined ? {} : { parent_id: resolvedParentId }),
          categories: categoryIds,
        },
        event: {
          timestamp_integer: timestamp,
          phase: 'B',
        },
      },
    });

    const { activity, reducer } = payload.data;
    if (reducer) {
      this.onReducerNote?.({
        type: 'start_reduced',
        activityId: activity.id,
        parentId: activity.parent_id ?? null,
        threadId: activity.thread_id,
        requestedThreadId: threadId,
        parentSource: reducer.parent_source,
        threadSource: reducer.thread_source,
        categoriesSource: reducer.categories_source,
      });
    }

    return activity.id;
  }

  async end({ activityId, message, force = false }) {
    return this.lifecycleEvent({ activityId, message, phase: 'E', queueType: 'end', force, guardChildren: !force });
  }

  /**
   * Worker-side nudge to pop explicitly: refuse ending a parent while any direct child
   * is still active (B/R). Nothing has been proposed yet, so nothing is dropped. With
   * `force` the event is sent and the reducer closes the open descendants (ADR-011).
   * Skipped for offline-* ids (no server truth yet).
   */
  async assertNoOpenChildren(activityId) {
    if (String(activityId).startsWith('offline-')) return;

    const id = Number(activityId);
    if (!Number.isInteger(id) || id <= 0) return;

    const { activities } = await this.status({ activeOnly: true });
    const openChildren = activities
      .filter(activity => Number(activity.parentId) === id)
      .sort((left, right) => left.id - right.id);

    if (openChildren.length === 0) return;

    const list = openChildren
      .map(activity => `${activity.id} (${activity.name})`)
      .join(', ');
    const ids = openChildren.map(activity => activity.id).join(', ');
    throw new Error(
      `Cannot end activity ${id} while open children remain: ${list}. `
      + `End ${ids} first (or pass --force).`,
    );
  }

  async suspend({ activityId, message }) {
    return this.lifecycleEvent({ activityId, message, phase: 'S', queueType: 'suspend' });
  }

  async resume({ activityId, message }) {
    return this.lifecycleEvent({ activityId, message, phase: 'R', queueType: 'resume' });
  }

  async lifecycleEvent({ activityId, message, phase, queueType, force = false, guardChildren = false }) {
    if (!String(activityId).startsWith('offline-')) {
      const id = Number(activityId);
      if (!Number.isInteger(id) || id <= 0) throw new Error('Activity id must be a positive integer');
    }

    const timestamp = this.now();
    const input = {
      activityId,
      message,
      timestamp,
      ...(queueType === 'end' ? { force } : {}),
    };

    try {
      const id = await this.queue.resolveActivityId(activityId);
      if (String(id).startsWith('offline-')) {
        await this.queue.enqueue(queueType, input);
        return 'queued';
      }
      if (guardChildren && !await this.supportsAgentCommands()) {
        await this.assertNoOpenChildren(id);
      }
      const eventId = await this.postLifecycleEvent({ ...input, activityId: id, phase, force });
      if (phase === 'E') await this.queue.removeAlias(activityId);
      return eventId;
    } catch (error) {
      if (!error?.retryable) throw error;
      await this.queue.enqueue(queueType, input);
      return 'queued';
    }
  }

  async postLifecycleEvent({ activityId, message, timestamp, phase, force = false }) {
    if (await this.supportsAgentCommands()) {
      const command = { E: 'end', S: 'suspend', R: 'resume' }[phase];
      const result = await this.agentCommand(command, {
        ...this.commandIdentity(),
        activity_id: Number(activityId),
        ...(message ? { message } : {}),
        timestamp,
        ...(command === 'end' ? { force } : {}),
      });
      this.reportClosedDescendants(Number(activityId), result.closed_descendants ?? []);
      this.reportCommandResult(result);
      return result.event_id;
    }

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

    const closed = payload.data.reducer?.closed_descendants ?? [];
    this.reportClosedDescendants(Number(activityId), closed);

    return payload.data.id;
  }

  reportCommandResult(result) {
    if (!result) return;
    const actions = result.actions_applied ?? [];
    const direction = result.direction ?? null;
    const reply = result.reply ?? null;
    if (!direction && !reply && actions.length === 0) return;
    this.onReducerNote?.({
      type: 'command_result',
      activityId: result.activity_id,
      direction,
      reply,
      actionsApplied: actions,
      asked: actions.some(action => action.type === 'ask'),
    });
  }

  reportClosedDescendants(activityId, closed) {
    if (closed.length > 0) {
      this.onReducerNote?.({
        type: 'closed_descendants',
        activityId,
        closedDescendants: closed.map(item => ({
          activityId: item.activity_id,
          activityName: item.activity_name,
          eventId: item.event_id,
        })),
      });
    }
  }

  async flushQueue() {
    return this.queue.flush({
      start: input => this.postStart(input),
      end: input => this.postLifecycleEvent({ ...input, phase: 'E' }),
      suspend: input => this.postLifecycleEvent({ ...input, phase: 'S' }),
      resume: input => this.postLifecycleEvent({ ...input, phase: 'R' }),
      observe: input => this.postObservation(input),
    });
  }

  async observe({ kind, value, unit, observedOn, payload, at }) {
    if (!kind?.trim()) throw new Error('Observation kind is required');
    const timestamp = this.resolveStartTimestamp(at);
    const input = {
      kind: kind.trim(),
      value,
      unit,
      observedOn,
      payload,
      timestamp,
    };

    try {
      return await this.postObservation(input);
    } catch (error) {
      if (!error?.retryable) throw error;
      await this.queue.enqueue('observe', { input });
      return 'queued';
    }
  }

  async importBundle(bundle) {
    return this.request('/api/imports', { method: 'POST', body: bundle });
  }

  /**
   * Send a free-text update to the Reducer Agent. It answers with assessment /
   * direction / reply and, as the single writer for the stack (ADR-011), may apply at
   * most one activity change, reported in `actions_applied`. Never queued: a stale
   * answer is useless.
   */
  async message({ activityId, text }) {
    if (!text?.trim()) throw new Error('Message text is required');

    if (await this.supportsAgentCommands()) {
      let resolvedActivityId = activityId;
      if (activityId !== undefined) {
        resolvedActivityId = await this.queue.resolveActivityId(activityId);
        if (String(resolvedActivityId).startsWith('offline-')) {
          throw new Error('Activity is still queued for offline delivery; retry once Flambe is reachable');
        }
        const id = Number(resolvedActivityId);
        if (!Number.isInteger(id) || id <= 0) throw new Error('--activity must be a positive integer');
        resolvedActivityId = id;
      }

      const result = await this.agentCommand('message', {
        ...this.commandIdentity(),
        ...(resolvedActivityId === undefined ? {} : { activity_id: resolvedActivityId }),
        message: text.trim(),
      });
      const decision = { activityId: result.activity_id ?? resolvedActivityId, ...result };
      this.reportCommandResult(result);
      return decision;
    }

    const resolvedActivityId = activityId === undefined
      ? await this.currentActivityId()
      : await this.queue.resolveActivityId(activityId);

    if (String(resolvedActivityId).startsWith('offline-')) {
      throw new Error('Activity is still queued for offline delivery; retry once Flambe is reachable');
    }

    const id = Number(resolvedActivityId);
    if (!Number.isInteger(id) || id <= 0) throw new Error('--activity must be a positive integer');

    const payload = await this.request('/mcp', {
      method: 'POST',
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'flambe_message',
          arguments: {
            trace_id: this.traceId,
            activity_id: id,
            ...(this.agentId ? { agent_id: this.agentId } : {}),
            message: text.trim(),
          },
        },
      },
    });

    if (payload?.error) {
      throw new Error(`Reducer request failed: ${payload.error.message ?? JSON.stringify(payload.error)}`);
    }

    const result = payload?.result;
    if (!result || result.isError) {
      const detail = result?.content?.map(item => item.text).filter(Boolean).join(' ');
      throw new Error(detail || 'Reducer returned an error');
    }

    return { activityId: id, ...result.structuredContent };
  }

  /** Newest active activity for this agent, falling back to the newest active activity in the flame. */
  async currentActivityId() {
    const { activities } = await this.status({ activeOnly: true });
    const mine = this.agentId ? activities.filter(activity => activity.agentId === this.agentId) : [];
    const current = (mine.length > 0 ? mine : activities).at(-1);
    if (!current) throw new Error('No active activity to message about; pass --activity <id> or run flambe start first');
    return current.id;
  }

  async postObservation({ kind, value, unit, observedOn, payload, timestamp }) {
    const body = {
      observation: {
        kind,
        value,
        timestamp_integer: timestamp,
        ...(unit ? { unit } : {}),
        ...(observedOn ? { observed_on: observedOn } : {}),
        ...(payload ? { payload } : {}),
      },
    };

    const response = await this.request('/api/observations', { method: 'POST', body });
    return response.data.id;
  }
}

export function clientFromEnv(env = process.env, overrides = {}) {
  return new FlambeClient({ ...configFromEnv(env), queuePath: env.FLAMBE_QUEUE_PATH, ...overrides });
}

export function clientFromHostEnv(env = process.env, overrides = {}) {
  return new FlambeClient({
    ...hostConfigFromEnv(env),
    ...agentIdentityFromEnv(env),
    traceId: 1,
    queuePath: env.FLAMBE_QUEUE_PATH,
    ...overrides,
  });
}

function compareEvents(a, b) {
  const timestampDifference = Date.parse(a.timestamp) - Date.parse(b.timestamp);
  return timestampDifference || (a.id - b.id);
}

function sortedThreads(trace) {
  return [...(trace.threads ?? [])].sort((a, b) => (a.rank - b.rank) || (a.id - b.id));
}

export function threadSlug(name) {
  return String(name)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

function matchThread(threads, selector, traceId) {
  const raw = String(selector).trim();
  const available = threads.map(thread => thread.name).join(', ');
  const notFound = label => new Error(
    `Thread ${label} not found in trace ${traceId}${available ? ` (threads: ${available})` : ''}`,
  );

  if (/^\d+$/.test(raw)) {
    const id = Number(raw);
    const byId = threads.find(thread => thread.id === id);
    if (byId) return byId;
    throw notFound(raw);
  }

  const exact = threads.filter(thread => thread.name === raw);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) {
    throw new Error(`Thread name "${raw}" is ambiguous in trace ${traceId}`);
  }

  const caseInsensitive = threads.filter(thread => thread.name.toLowerCase() === raw.toLowerCase());
  if (caseInsensitive.length === 1) return caseInsensitive[0];
  if (caseInsensitive.length > 1) {
    throw new Error(`Thread name "${raw}" is ambiguous in trace ${traceId}`);
  }

  const slug = threadSlug(raw);
  if (!slug) throw notFound(`"${raw}"`);
  const bySlug = threads.filter(thread => threadSlug(thread.name) === slug);
  if (bySlug.length === 1) return bySlug[0];
  if (bySlug.length > 1) {
    throw new Error(`Thread "${raw}" is ambiguous in trace ${traceId} (matches: ${bySlug.map(thread => thread.name).join(', ')})`);
  }

  throw notFound(`"${raw}"`);
}
