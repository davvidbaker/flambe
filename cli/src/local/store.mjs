import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { agentDisplayName } from './agents.mjs';

const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  raw_token TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS traces (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  export_id TEXT NOT NULL UNIQUE,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY,
  trace_id INTEGER NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rank INTEGER NOT NULL DEFAULT 0,
  export_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color_background TEXT NOT NULL,
  color_text TEXT,
  export_id TEXT NOT NULL UNIQUE,
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  weight INTEGER,
  agent_id TEXT,
  agent_name TEXT,
  export_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS activities_categories (
  activity_id INTEGER NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (activity_id, category_id)
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  trace_id INTEGER NOT NULL REFERENCES traces(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL,
  phase TEXT NOT NULL,
  message TEXT,
  export_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS todos (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS mantras (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS attentions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  timestamp_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tabs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  count INTEGER NOT NULL,
  window_count INTEGER,
  timestamp_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS search_terms (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  payload TEXT NOT NULL DEFAULT '{}',
  observed_on TEXT,
  timestamp_ms INTEGER NOT NULL
);
`;

export const EXPORT_FORMAT = 'flambe-local-export';
export const EXPORT_VERSION = 1;

export function hashToken(rawToken) {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function generateToken() {
  return `flb_${randomBytes(32).toString('base64url')}`;
}

export function isoFromMs(ms) {
  const date = new Date(ms);
  const [whole, fraction = '000'] = date.toISOString().slice(0, -1).split('.');
  return `${whole}.${fraction.padEnd(6, '0')}Z`;
}

export class LocalStore {
  constructor(dbPath) {
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(SCHEMA);
    this.#seed();
  }

  close() {
    this.db.close();
  }

  credentials() {
    const user = this.db.prepare('SELECT * FROM users WHERE id = 1').get();
    const token = this.db.prepare('SELECT raw_token FROM api_tokens WHERE user_id = 1 ORDER BY id LIMIT 1').get();
    const trace = this.db.prepare('SELECT id, name FROM traces WHERE user_id = 1 ORDER BY id LIMIT 1').get();
    return {
      user,
      rawToken: token.raw_token,
      traceId: trace.id,
      traceName: trace.name,
    };
  }

  userById(id) {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id)) ?? null;
  }

  authenticateToken(rawToken) {
    if (typeof rawToken !== 'string' || !rawToken.startsWith('flb_')) return null;
    const row = this.db.prepare(`
      SELECT api_tokens.*, users.id AS user_id, users.name AS user_name, users.username
      FROM api_tokens
      JOIN users ON users.id = api_tokens.user_id
      WHERE token_hash = ?
    `).get(hashToken(rawToken));
    if (!row) return null;
    return {
      user: { id: row.user_id, name: row.user_name, username: row.username },
      tokenName: row.name,
    };
  }

  listTraces(userId) {
    return this.db.prepare(
      'SELECT id, name FROM traces WHERE user_id = ? ORDER BY id',
    ).all(userId).map(row => ({ id: row.id, name: row.name }));
  }

  getTrace(userId, traceId) {
    const trace = this.db.prepare(
      'SELECT * FROM traces WHERE user_id = ? AND id = ?',
    ).get(userId, Number(traceId));
    if (!trace) return null;
    const threads = this.db.prepare(
      'SELECT id, name, rank FROM threads WHERE trace_id = ? ORDER BY rank, id',
    ).all(trace.id);
    const events = this.db.prepare(`
      SELECT events.*, activities.name AS activity_name, activities.parent_id,
        activities.thread_id, activities.weight, activities.agent_id, activities.agent_name,
        activities.description AS activity_description
      FROM events
      LEFT JOIN activities ON activities.id = events.activity_id
      WHERE events.trace_id = ?
      ORDER BY events.timestamp_ms, events.id
    `).all(trace.id);

    return {
      id: trace.id,
      name: trace.name,
      threads: threads.map(thread => ({ id: thread.id, name: thread.name, rank: thread.rank })),
      events: events.map(event => this.#eventPayload(event)),
    };
  }

  createTrace(userId, name) {
    const result = this.db.prepare(
      'INSERT INTO traces (user_id, name, export_id) VALUES (?, ?, ?)',
    ).run(userId, name, randomUUID());
    const traceId = Number(result.lastInsertRowid);
    this.db.prepare(
      'INSERT INTO threads (trace_id, name, rank, export_id) VALUES (?, ?, 0, ?)',
    ).run(traceId, 'Main', randomUUID());
    return this.getTrace(userId, traceId);
  }

  updateTrace(userId, traceId, attrs) {
    if (attrs?.name) {
      this.db.prepare('UPDATE traces SET name = ? WHERE user_id = ? AND id = ?')
        .run(attrs.name, userId, Number(traceId));
    }
    return this.getTrace(userId, traceId);
  }

  deleteTrace(userId, traceId) {
    const result = this.db.prepare('DELETE FROM traces WHERE user_id = ? AND id = ?')
      .run(userId, Number(traceId));
    return result.changes > 0;
  }

  reorderThreads(userId, traceId, threadIds) {
    const trace = this.getTrace(userId, traceId);
    if (!trace) return { error: 'not_found' };
    const existing = trace.threads.map(thread => thread.id);
    const incoming = threadIds.map(Number);
    if (incoming.length !== existing.length || new Set(incoming).size !== existing.length
      || incoming.some(id => !existing.includes(id))) {
      return { error: 'invalid' };
    }
    incoming.forEach((id, rank) => {
      this.db.prepare('UPDATE threads SET rank = ? WHERE id = ?').run(rank, id);
    });
    return { threads: this.getTrace(userId, traceId).threads };
  }

  createThread(userId, traceId, attrs) {
    const trace = this.db.prepare('SELECT id FROM traces WHERE user_id = ? AND id = ?')
      .get(userId, Number(traceId));
    if (!trace) return null;
    const rank = Number.isInteger(attrs?.rank) ? attrs.rank : 0;
    const result = this.db.prepare(
      'INSERT INTO threads (trace_id, name, rank, export_id) VALUES (?, ?, ?, ?)',
    ).run(trace.id, attrs.name, rank, randomUUID());
    return this.db.prepare('SELECT id, name, rank FROM threads WHERE id = ?')
      .get(Number(result.lastInsertRowid));
  }

  getThread(userId, threadId) {
    return this.db.prepare(`
      SELECT threads.id, threads.name, threads.rank
      FROM threads
      JOIN traces ON traces.id = threads.trace_id
      WHERE threads.id = ? AND traces.user_id = ?
    `).get(Number(threadId), userId) ?? null;
  }

  updateThread(userId, threadId, attrs) {
    const thread = this.getThread(userId, threadId);
    if (!thread) return null;
    this.db.prepare('UPDATE threads SET name = COALESCE(?, name), rank = COALESCE(?, rank) WHERE id = ?')
      .run(attrs.name ?? null, attrs.rank ?? null, thread.id);
    return this.getThread(userId, threadId);
  }

  deleteThread(userId, threadId) {
    const thread = this.getThread(userId, threadId);
    if (!thread) return false;
    this.db.prepare('DELETE FROM threads WHERE id = ?').run(thread.id);
    return true;
  }

  listCategories(userId) {
    return this.db.prepare(
      'SELECT id, name, color_background, color_text FROM categories WHERE user_id = ? ORDER BY id',
    ).all(userId);
  }

  createCategory(userId, attrs, activityIds = []) {
    const result = this.db.prepare(
      'INSERT INTO categories (user_id, name, color_background, color_text, export_id) VALUES (?, ?, ?, ?, ?)',
    ).run(userId, attrs.name, attrs.color_background, attrs.color_text ?? '#000000', randomUUID());
    const id = Number(result.lastInsertRowid);
    for (const activityId of activityIds) {
      this.db.prepare(
        'INSERT OR IGNORE INTO activities_categories (activity_id, category_id) VALUES (?, ?)',
      ).run(Number(activityId), id);
    }
    return this.db.prepare('SELECT id, name, color_background, color_text FROM categories WHERE id = ?').get(id);
  }

  updateCategory(userId, id, attrs) {
    const existing = this.db.prepare(
      'SELECT * FROM categories WHERE user_id = ? AND id = ?',
    ).get(userId, Number(id));
    if (!existing) return null;
    this.db.prepare(
      'UPDATE categories SET name = COALESCE(?, name), color_background = COALESCE(?, color_background), color_text = COALESCE(?, color_text) WHERE id = ?',
    ).run(attrs.name ?? null, attrs.color_background ?? null, attrs.color_text ?? null, existing.id);
    return this.db.prepare('SELECT id, name, color_background, color_text FROM categories WHERE id = ?').get(existing.id);
  }

  deleteCategory(userId, id) {
    const result = this.db.prepare('DELETE FROM categories WHERE user_id = ? AND id = ?')
      .run(userId, Number(id));
    return result.changes > 0;
  }

  createActivity(userId, { traceId, threadId, activity, event, agentId, agentName, tokenName }) {
    const thread = this.db.prepare(`
      SELECT threads.id, threads.trace_id
      FROM threads
      JOIN traces ON traces.id = threads.trace_id
      WHERE threads.id = ? AND threads.trace_id = ? AND traces.user_id = ?
    `).get(Number(threadId), Number(traceId), userId);
    if (!thread) return { error: 'not_found' };

    let parentId = activity.parent_id ?? null;
    if (parentId != null) {
      const parent = this.db.prepare(
        'SELECT id FROM activities WHERE id = ? AND thread_id = ?',
      ).get(Number(parentId), thread.id);
      if (!parent) return { error: 'not_found' };
      parentId = parent.id;
    }

    const categoryIds = Array.isArray(activity.categories) ? activity.categories.map(Number) : [];
    if (categoryIds.length > 0) {
      const found = this.db.prepare(
        `SELECT id FROM categories WHERE user_id = ? AND id IN (${categoryIds.map(() => '?').join(',')})`,
      ).all(userId, ...categoryIds);
      if (found.length !== new Set(categoryIds).size) return { error: 'not_found' };
    }

    const agent = agentId
      ? { agent_id: agentId, agent_name: agentDisplayName(agentId, agentName, tokenName) }
      : { agent_id: null, agent_name: null };

    const inserted = this.db.prepare(`
      INSERT INTO activities (thread_id, parent_id, name, description, weight, agent_id, agent_name, export_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      thread.id,
      parentId,
      activity.name,
      activity.description ?? null,
      activity.weight ?? null,
      agent.agent_id,
      agent.agent_name,
      randomUUID(),
    );
    const activityId = Number(inserted.lastInsertRowid);
    for (const categoryId of categoryIds) {
      this.db.prepare(
        'INSERT INTO activities_categories (activity_id, category_id) VALUES (?, ?)',
      ).run(activityId, categoryId);
    }

    const timestamp = Number(event.timestamp_integer);
    const eventRow = this.db.prepare(`
      INSERT INTO events (trace_id, activity_id, timestamp_ms, phase, message, export_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(thread.trace_id, activityId, timestamp, event.phase, event.message ?? null, randomUUID());

    return {
      activity: {
        id: activityId,
        name: activity.name,
        description: activity.description ?? null,
        weight: activity.weight ?? null,
        parent_id: parentId,
        thread_id: thread.id,
      },
      event: { id: Number(eventRow.lastInsertRowid), phase: event.phase },
    };
  }

  getActivity(userId, id) {
    const row = this.db.prepare(`
      SELECT activities.*
      FROM activities
      JOIN threads ON threads.id = activities.thread_id
      JOIN traces ON traces.id = threads.trace_id
      WHERE activities.id = ? AND traces.user_id = ?
    `).get(Number(id), userId);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      weight: row.weight,
      parent_id: row.parent_id,
      thread_id: row.thread_id,
    };
  }

  updateActivity(userId, id, attrs) {
    const current = this.getActivity(userId, id);
    if (!current) return null;
    this.db.prepare(`
      UPDATE activities SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        weight = COALESCE(?, weight),
        parent_id = COALESCE(?, parent_id)
      WHERE id = ?
    `).run(attrs.name ?? null, attrs.description ?? null, attrs.weight ?? null, attrs.parent_id ?? null, current.id);

    if (Array.isArray(attrs.category_ids)) {
      this.db.prepare('DELETE FROM activities_categories WHERE activity_id = ?').run(current.id);
      for (const categoryId of attrs.category_ids) {
        this.db.prepare(
          'INSERT INTO activities_categories (activity_id, category_id) VALUES (?, ?)',
        ).run(current.id, Number(categoryId));
      }
    }

    if (attrs.thread_id != null && Number(attrs.thread_id) !== current.thread_id) {
      const thread = this.getThread(userId, attrs.thread_id);
      if (!thread) return { error: 'not_found' };
      this.db.prepare('UPDATE activities SET thread_id = ?, parent_id = NULL WHERE id = ?')
        .run(thread.id, current.id);
    }

    return this.getActivity(userId, current.id);
  }

  deleteActivity(userId, id) {
    const current = this.getActivity(userId, id);
    if (!current) return false;
    this.db.prepare('DELETE FROM activities WHERE id = ?').run(current.id);
    return true;
  }

  createEvent(userId, { traceId, activityId, event }) {
    const activity = this.db.prepare(`
      SELECT activities.id, threads.trace_id
      FROM activities
      JOIN threads ON threads.id = activities.thread_id
      JOIN traces ON traces.id = threads.trace_id
      WHERE activities.id = ? AND traces.id = ? AND traces.user_id = ?
    `).get(Number(activityId), Number(traceId), userId);
    if (!activity) return { error: 'not_found' };

    const result = this.db.prepare(`
      INSERT INTO events (trace_id, activity_id, timestamp_ms, phase, message, export_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      activity.trace_id,
      activity.id,
      Number(event.timestamp_integer),
      event.phase,
      event.message ?? null,
      randomUUID(),
    );
    return { id: Number(result.lastInsertRowid), phase: event.phase };
  }

  updateEvent(userId, id, attrs) {
    const existing = this.db.prepare(`
      SELECT events.id FROM events
      JOIN traces ON traces.id = events.trace_id
      WHERE events.id = ? AND traces.user_id = ?
    `).get(Number(id), userId);
    if (!existing) return null;
    this.db.prepare(
      'UPDATE events SET phase = COALESCE(?, phase), message = COALESCE(?, message) WHERE id = ?',
    ).run(attrs.phase ?? null, attrs.message ?? null, existing.id);
    const row = this.db.prepare('SELECT id, phase FROM events WHERE id = ?').get(existing.id);
    return { id: row.id, phase: row.phase };
  }

  deleteEvent(userId, id) {
    const existing = this.db.prepare(`
      SELECT events.id FROM events
      JOIN traces ON traces.id = events.trace_id
      WHERE events.id = ? AND traces.user_id = ?
    `).get(Number(id), userId);
    if (!existing) return false;
    this.db.prepare('DELETE FROM events WHERE id = ?').run(existing.id);
    return true;
  }

  userDashboard(userId) {
    const user = this.userById(userId);
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      traces: this.listTraces(userId),
      categories: this.listCategories(userId),
      todos: this.db.prepare('SELECT id, name, description FROM todos WHERE user_id = ?').all(userId),
      mantras: this.db.prepare('SELECT id, name, timestamp_ms FROM mantras WHERE user_id = ? ORDER BY id').all(userId)
        .map(row => ({ id: row.id, name: row.name, timestamp: isoFromMs(row.timestamp_ms) })),
      attentionShifts: this.db.prepare(
        'SELECT id, thread_id, timestamp_ms FROM attentions WHERE user_id = ? ORDER BY id',
      ).all(userId).map(row => ({
        id: row.id,
        thread_id: row.thread_id,
        timestamp: isoFromMs(row.timestamp_ms),
      })),
      tabs: this.db.prepare(
        'SELECT id, count, window_count, timestamp_ms FROM tabs WHERE user_id = ? ORDER BY id',
      ).all(userId).map(row => ({
        id: row.id,
        count: row.count,
        window_count: row.window_count,
        timestamp: isoFromMs(row.timestamp_ms),
      })),
      searchTerms: this.db.prepare(
        'SELECT id, term, timestamp_ms FROM search_terms WHERE user_id = ? ORDER BY id',
      ).all(userId).map(row => ({
        id: row.id,
        term: row.term,
        timestamp: isoFromMs(row.timestamp_ms),
      })),
      observations: this.listObservations(userId),
    };
  }

  createTodo(userId, attrs) {
    const result = this.db.prepare(
      'INSERT INTO todos (user_id, name, description) VALUES (?, ?, ?)',
    ).run(userId, attrs.name, attrs.description ?? null);
    return this.db.prepare('SELECT id, name, description FROM todos WHERE id = ?')
      .get(Number(result.lastInsertRowid));
  }

  createMantra(userId, attrs) {
    const timestamp = Number(attrs.timestamp_integer ?? Date.now());
    const result = this.db.prepare(
      'INSERT INTO mantras (user_id, name, timestamp_ms) VALUES (?, ?, ?)',
    ).run(userId, attrs.name, timestamp);
    return { id: Number(result.lastInsertRowid), name: attrs.name };
  }

  createAttention(userId, attrs) {
    const thread = this.getThread(userId, attrs.thread_id);
    if (!thread) return { error: 'not_found' };
    const timestamp = Number(attrs.timestamp_integer ?? Date.now());
    const result = this.db.prepare(
      'INSERT INTO attentions (user_id, thread_id, timestamp_ms) VALUES (?, ?, ?)',
    ).run(userId, thread.id, timestamp);
    return { id: Number(result.lastInsertRowid) };
  }

  upsertObservation(userId, attrs) {
    const kind = String(attrs.kind ?? '').trim().toLowerCase();
    const timestamp = Number(attrs.timestamp_integer ?? Date.now());
    const observedOn = attrs.observed_on ?? null;
    const payload = JSON.stringify(attrs.payload && typeof attrs.payload === 'object' ? attrs.payload : {});

    if (observedOn) {
      const existing = this.db.prepare(
        'SELECT * FROM observations WHERE user_id = ? AND kind = ? AND observed_on = ?',
      ).get(userId, kind, observedOn);
      if (existing) {
        const merged = { ...JSON.parse(existing.payload), ...(attrs.payload ?? {}) };
        this.db.prepare(
          'UPDATE observations SET value = ?, unit = COALESCE(?, unit), payload = ?, timestamp_ms = ? WHERE id = ?',
        ).run(attrs.value, attrs.unit ?? null, JSON.stringify(merged), timestamp, existing.id);
        return { observation: this.#observationPayload(this.db.prepare('SELECT * FROM observations WHERE id = ?').get(existing.id)), created: false };
      }
    }

    const result = this.db.prepare(`
      INSERT INTO observations (user_id, kind, value, unit, payload, observed_on, timestamp_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, kind, attrs.value, attrs.unit ?? null, payload, observedOn, timestamp);
    return {
      observation: this.#observationPayload(
        this.db.prepare('SELECT * FROM observations WHERE id = ?').get(Number(result.lastInsertRowid)),
      ),
      created: true,
    };
  }

  listObservations(userId) {
    return this.db.prepare(
      'SELECT * FROM observations WHERE user_id = ? ORDER BY id',
    ).all(userId).map(row => this.#observationPayload(row));
  }

  exportBundle() {
    const categories = this.db.prepare(
      'SELECT export_id, name, color_background, color_text FROM categories WHERE user_id = 1 ORDER BY id',
    ).all();
    const traces = this.db.prepare('SELECT * FROM traces WHERE user_id = 1 ORDER BY id').all();
    const categoryById = new Map(
      this.db.prepare('SELECT id, export_id FROM categories WHERE user_id = 1').all()
        .map(row => [row.id, row.export_id]),
    );

    return {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exported_at: isoFromMs(Date.now()),
      categories: categories.map(row => ({
        export_id: row.export_id,
        name: row.name,
        color_background: row.color_background,
        color_text: row.color_text,
      })),
      traces: traces.map(trace => this.#exportTrace(trace, categoryById)),
      observations: this.listObservations(1).map(({ id: _id, ...rest }) => rest),
    };
  }

  #exportTrace(trace, categoryById) {
    const threads = this.db.prepare(
      'SELECT * FROM threads WHERE trace_id = ? ORDER BY rank, id',
    ).all(trace.id);
    const threadExport = new Map(threads.map(thread => [thread.id, thread.export_id]));
    const activities = this.db.prepare(`
      SELECT activities.* FROM activities
      JOIN threads ON threads.id = activities.thread_id
      WHERE threads.trace_id = ?
      ORDER BY activities.id
    `).all(trace.id);
    const activityExport = new Map(activities.map(activity => [activity.id, activity.export_id]));
    const events = this.db.prepare(
      'SELECT * FROM events WHERE trace_id = ? ORDER BY timestamp_ms, id',
    ).all(trace.id);

    return {
      export_id: trace.export_id,
      name: trace.name,
      threads: threads.map(thread => ({
        export_id: thread.export_id,
        name: thread.name,
        rank: thread.rank,
      })),
      activities: activities.map(activity => ({
        export_id: activity.export_id,
        name: activity.name,
        description: activity.description,
        weight: activity.weight,
        parent_export_id: activity.parent_id == null ? null : activityExport.get(activity.parent_id) ?? null,
        thread_export_id: threadExport.get(activity.thread_id),
        category_export_ids: this.db.prepare(
          'SELECT category_id FROM activities_categories WHERE activity_id = ?',
        ).all(activity.id).map(row => categoryById.get(row.category_id)).filter(Boolean),
        agent_id: activity.agent_id,
        agent_name: activity.agent_name,
      })),
      events: events.map(event => ({
        export_id: event.export_id,
        activity_export_id: event.activity_id == null ? null : activityExport.get(event.activity_id) ?? null,
        timestamp_integer: event.timestamp_ms,
        phase: event.phase,
        message: event.message,
      })),
    };
  }

  #eventPayload(event) {
    const categoryIds = event.activity_id == null
      ? []
      : this.db.prepare(
        'SELECT category_id FROM activities_categories WHERE activity_id = ?',
      ).all(event.activity_id).map(row => row.category_id);

    return {
      id: event.id,
      timestamp: isoFromMs(event.timestamp_ms),
      phase: event.phase,
      message: event.message ?? null,
      activity: event.activity_id == null ? null : {
        id: event.activity_id,
        name: event.activity_name,
        agent_id: event.agent_id ?? null,
        agent_name: event.agent_name ?? null,
        parent_id: event.parent_id ?? null,
        thread: { id: event.thread_id },
        categories: categoryIds,
        weight: event.weight ?? null,
      },
    };
  }

  #observationPayload(row) {
    return {
      id: row.id,
      kind: row.kind,
      value: row.value,
      unit: row.unit,
      payload: JSON.parse(row.payload || '{}'),
      observed_on: row.observed_on,
      timestamp: isoFromMs(row.timestamp_ms),
    };
  }

  #seed() {
    const user = this.db.prepare('SELECT id FROM users WHERE id = 1').get();
    if (user) return;

    this.db.exec('BEGIN');
    try {
      this.db.prepare('INSERT INTO users (id, name, username) VALUES (1, ?, ?)').run('Local', 'local');
      const rawToken = generateToken();
      this.db.prepare(
        'INSERT INTO api_tokens (user_id, name, token_hash, raw_token) VALUES (1, ?, ?, ?)',
      ).run('local', hashToken(rawToken), rawToken);
      const trace = this.db.prepare(
        'INSERT INTO traces (user_id, name, export_id) VALUES (1, ?, ?)',
      ).run('Main', randomUUID());
      this.db.prepare(
        'INSERT INTO threads (trace_id, name, rank, export_id) VALUES (?, ?, 0, ?)',
      ).run(Number(trace.lastInsertRowid), 'Main', randomUUID());
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
}
