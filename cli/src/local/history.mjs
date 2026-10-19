import { createHmac, timingSafeEqual } from 'node:crypto';

/** Signed reciprocal creation history; snapshots never accept client-supplied row contents. */
export function reverseCreation(store, userId, traceId, body) {
  traceId = Number(traceId);
  if (!store.getTrace(userId, traceId)) return { status: 404, json: { error: 'NOT_FOUND' } };
  const db = store.db;
  const row = (table, id) => db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(Number(id));
  const rows = (table, activityId) => db.prepare(`SELECT * FROM ${table} WHERE activity_id = ? ORDER BY id`).all(activityId);
  const children = id => db.prepare('SELECT id, parent_id, thread_id FROM activities WHERE parent_id = ? ORDER BY id').all(id);
  const categories = id => db.prepare('SELECT category_id FROM activities_categories WHERE activity_id = ? ORDER BY category_id').all(id).map(c => c.category_id);
  const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const fail = () => { throw new Error('HISTORY_CHANGED'); };
  const signature = value => createHmac('sha256', store.credentials().rawToken).update(`creation-history-v1:${value}`).digest();
  const sign = record => {
    const value = Buffer.from(JSON.stringify(record)).toString('base64url');
    return `${value}.${signature(value).toString('base64url')}`;
  };
  const insert = (table, data) => {
    // Column names come from this database, not the restoration token.
    const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    db.prepare(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map(() => '?').join(',')})`)
      .run(...columns.map(column => data[column] ?? null));
  };
  let record;
  if (typeof body.token === 'string') {
    try {
      const [value, mac, extra] = body.token.split('.');
      const expected = signature(value);
      const supplied = Buffer.from(mac ?? '', 'base64url');
      if (extra || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error();
      record = JSON.parse(Buffer.from(value, 'base64url').toString());
      if (record.userId !== userId || record.traceId !== traceId || !['remove', 'restore'].includes(record.mode)) throw new Error();
    } catch { return { status: 422, json: { error: 'INVALID_HISTORY' } }; }
  }
  db.exec('SAVEPOINT history_reverse');
  try {
    if (!record) {
      const id = Number(body.target_id);
      const activity = body.kind === 'activity' ? store.getActivity(userId, id) : null;
      const event = body.kind === 'event' ? row('events', id) : null;
      if (activity && (store.getThread(userId, activity.thread_id) && row('threads', activity.thread_id)?.trace_id) === traceId) {
        record = { userId, traceId, mode: 'remove', snapshot: { kind: 'activity',
          activity: row('activities', id), events: rows('events', id), categories: categories(id), children: children(id) } };
      } else if (event?.trace_id === traceId) {
        let weight = null;
        if (body.restore_weight) {
          const activityId = Number(body.restore_weight.activity_id);
          const old = body.restore_weight.weight;
          if (activityId !== event.activity_id || (old !== null && !Number.isInteger(old))) fail();
          weight = { activity_id: activityId, before: row('activities', activityId).weight, after: old };
        }
        record = { userId, traceId, mode: 'remove', snapshot: { kind: 'event', event, weight } };
      } else fail();
    }
    const { snapshot, mode } = record;
    if (snapshot.kind === 'activity') {
      const activity = snapshot.activity;
      if ((store.getThread(userId, activity.thread_id) && row('threads', activity.thread_id)?.trace_id) !== traceId) fail();
      if (mode === 'remove') {
        if (!equal(row('activities', activity.id), activity) || !equal(rows('events', activity.id), snapshot.events)
          || !equal(categories(activity.id), snapshot.categories) || !equal(children(activity.id), snapshot.children)) fail();
        db.prepare('DELETE FROM activities WHERE id = ?').run(activity.id);
      } else {
        if (row('activities', activity.id)) fail();
        if (activity.parent_id && row('activities', activity.parent_id)?.thread_id !== activity.thread_id) fail();
        for (const child of snapshot.children) {
          const current = store.getActivity(userId, child.id);
          if (!current || current.parent_id !== null || current.thread_id !== child.thread_id) fail();
        }
        for (const event of snapshot.events) if (row('events', event.id) || event.trace_id !== traceId || event.activity_id !== activity.id) fail();
        for (const id of snapshot.categories) if (row('categories', id)?.user_id !== userId) fail();
        insert('activities', activity);
        for (const event of snapshot.events) insert('events', event);
        for (const id of snapshot.categories) db.prepare('INSERT INTO activities_categories (activity_id, category_id) VALUES (?, ?)').run(activity.id, id);
        for (const child of snapshot.children) db.prepare('UPDATE activities SET parent_id = ? WHERE id = ?').run(activity.id, child.id);
      }
    } else if (snapshot.kind === 'event') {
      const event = snapshot.event;
      if (event.trace_id !== traceId || !store.getActivity(userId, event.activity_id)) fail();
      if (mode === 'remove' ? !equal(row('events', event.id), event) : Boolean(row('events', event.id))) fail();
      if (snapshot.weight) {
        const weight = snapshot.weight;
        if (weight.activity_id !== event.activity_id) fail();
        if (row('activities', weight.activity_id).weight !== (mode === 'remove' ? weight.before : weight.after)) fail();
        db.prepare('UPDATE activities SET weight = ? WHERE id = ?').run(mode === 'remove' ? weight.after : weight.before, weight.activity_id);
      }
      if (mode === 'remove') db.prepare('DELETE FROM events WHERE id = ?').run(event.id);
      else insert('events', event);
    } else fail();
    const inverse = sign({ ...record, mode: mode === 'remove' ? 'restore' : 'remove' });
    db.exec('RELEASE history_reverse');
    return { status: 200, json: { data: { undo_token: inverse } } };
  } catch {
    db.exec('ROLLBACK TO history_reverse; RELEASE history_reverse');
    return { status: 409, json: { error: 'HISTORY_CHANGED' } };
  }
}
