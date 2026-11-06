import { CommandError } from './commands.mjs';

export const contextLimitBytes = 65_536;
const size = value => Buffer.byteLength(JSON.stringify(value));
const marker = '\n[… shortened for review …]\n';

/** Keep both ends without splitting UTF-8 code points. Never edit persisted text. */
function shorten(value, limit) {
  if (typeof value !== 'string' || Buffer.byteLength(value) <= limit) return value;
  const bytes = Buffer.from(value);
  const available = limit - Buffer.byteLength(marker);
  let end = Math.floor(available / 2);
  let start = bytes.length - (available - end);
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end--;
  while ((bytes[start] & 0xc0) === 0x80) start++;
  return bytes.subarray(0, end).toString('utf8') + marker + bytes.subarray(start).toString('utf8');
}

function boundedRow(row, descriptionLimit, eventLimit) {
  const description = shorten(row.description, descriptionLimit);
  const message = shorten(row.latest_event?.message, eventLimit);
  const fields = [];
  if (description !== row.description) fields.push('description');
  if (message !== row.latest_event?.message) fields.push('latest_event.message');
  return { ...row, description,
    latest_event: { ...row.latest_event, ...(message !== undefined ? { message } : {}) },
    ...(fields.length ? { review_text_shortened: fields } : {}) };
}

/** Preserve mandatory structure; select optional evidence, never silently drop authority. */
export function budgetContext(context, requiredIds) {
  const sourceBytes = size(context);
  const metadata = { limit_bytes: contextLimitBytes, source_bytes: sourceBytes,
    omitted_activities: 0, omitted_open_activities: 0, omitted_ended_activities: 0, shortened_fields: 0 };
  const complete = { ...context, context_budget: metadata };
  if (size(complete) <= contextLimitBytes) return complete;

  // Reserve room for the final counts growing from single to multiple digits.
  const target = contextLimitBytes - 512;
  const required = new Set(requiredIds);
  const byId = new Map(context.stack.map(row => [row.id, row]));
  const current = byId.get(context.current);
  let root = current;
  const seen = new Set();
  while (root && !seen.has(root.id) && byId.has(root.parent_id)) {
    seen.add(root.id); root = byId.get(root.parent_id);
  }
  const core = context.stack.filter(row => required.has(row.id));
  const base = { ...context, stack: [], context_budget: metadata };
  const baseBytes = size(base);
  const rowsBytes = rows => rows.reduce((n, row) => n + size(row), 0) + Math.max(0, rows.length - 1);
  let selected = core;
  // Prefer intact root intent. Only shorten mandatory text if it cannot fit.
  for (const limits of [[Infinity, 1024, Infinity, 512], [8192, 1024, 2048, 512], [4096, 256, 512, 128]]) {
    if (baseBytes + rowsBytes(selected) <= target) break;
    selected = core.map(row => {
      const primary = row.id === context.current || row.id === root?.id;
      return boundedRow(row, primary ? limits[0] : limits[1], primary ? limits[2] : limits[3]);
    });
  }
  let used = baseBytes + rowsBytes(selected);
  if (used > target) {
    throw new CommandError(413, 'REDUCER_CONTEXT_TOO_LARGE',
      'Required activity ancestry, placement candidates, thread catalog, or review message exceeds the local reducer limit; no model request was sent.');
  }

  const rank = row => row.status !== 'ended'
    ? (row.agent_id === context.agent_id ? 0 : 2) + (row.thread_id === current?.thread_id ? 0 : 1)
    : 4 + (row.thread_id === current?.thread_id ? 0 : 1);
  const optional = context.stack.filter(row => !required.has(row.id)).sort((a, b) =>
    rank(a) - rank(b) || (Date.parse(b.latest_event.timestamp) - Date.parse(a.latest_event.timestamp) || b.id - a.id));
  for (const original of optional) {
    const row = boundedRow(original, 1024, 512);
    const cost = size(row) + (selected.length ? 1 : 0);
    if (used + cost > target) continue;
    selected.push(row); used += cost;
  }
  const included = new Set(selected.map(row => row.id));
  const omitted = context.stack.filter(row => !included.has(row.id));
  metadata.omitted_activities = omitted.length;
  metadata.omitted_open_activities = omitted.filter(row => row.status !== 'ended').length;
  metadata.omitted_ended_activities = omitted.length - metadata.omitted_open_activities;
  metadata.shortened_fields = selected.reduce((n, row) => n + (row.review_text_shortened?.length ?? 0), 0);
  const result = { ...base, stack: selected };
  if (size(result) > contextLimitBytes) throw new CommandError(413, 'REDUCER_CONTEXT_TOO_LARGE', 'Required reducer context exceeds the local limit; no model request was sent.');
  return result;
}

export function contextStats(context) {
  return { bytes: size(context), ...(context.context_budget ?? {}) };
}
