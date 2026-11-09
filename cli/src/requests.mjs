/**
 * Runtime-independent request lifecycle. A request is an ordinary root activity:
 * it spans agent turns and handoffs, while nested activities describe focused work.
 * Only an explicit completion signal ends it.
 */
export function requestHeadline(prompt) {
  const text = String(prompt ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return 'Attachment request';
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
}

/** Begin a request, independent of whether the client points at Cloud or Single Burner. */
export async function beginRequest(client, { name, prompt } = {}) {
  const title = name == null ? requestHeadline(prompt) : requestHeadline(name);
  return client.start({ name: title, parentId: null });
}

/**
 * The caller, not an idle/settled event, decides the request has been satisfied.
 * Do not force: open subactivities must be finished first, or completion fails.
 */
export async function completeRequest(client, { activityId, message } = {}) {
  if (!activityId) throw new Error('A request activity id is required');
  return client.end({ activityId, ...(message ? { message } : {}), force: false });
}
