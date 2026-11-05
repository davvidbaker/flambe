import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/** Bounded JSONL, separate from stdout (which can contain setup credentials). */
export function createDiagnosticLog(path, { maxBytes = 5 * 1024 * 1024, warn = message => console.error(message) } = {}) {
  const logPath = resolve(path);
  let warned = false;
  const write = (event, fields = {}) => {
    try {
      mkdirSync(dirname(logPath), { recursive: true, mode: 0o700 });
      const line = JSON.stringify({ ...fields, timestamp: new Date().toISOString(), event }) + '\n';
      if (existsSync(logPath) && statSync(logPath).size + Buffer.byteLength(line) > maxBytes) {
        renameSync(logPath, `${logPath}.1`);
      }
      appendFileSync(logPath, line, { mode: 0o600 });
    } catch {
      // Diagnostics must never turn a committed command into a failed/retried start.
      if (!warned) {
        warned = true;
        warn('Flambe diagnostic log could not be written; tracking continues. Check the log path and permissions.');
      }
    }
  };
  return { path: logPath, write };
}

// Allowlist metadata only: never log raw arguments, headers, messages, model context,
// decision rationale, provider errors, or credentials.
export function commandRequest(command, attrs, agent) {
  const id = value => Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
  return {
    command, trace_id: id(attrs?.trace_id), activity_id: id(attrs?.activity_id),
    agent_id: agent?.agent_id ?? attrs?.agent_id ?? null,
    requested_thread_id: id(attrs?.thread_id),
    parent_specified: Object.hasOwn(attrs ?? {}, 'parent_id'),
    requested_parent_id: id(attrs?.parent_id),
  };
}

export function commandOutcome(store, userId, request, response) {
  const activityId = response?.activity_id ?? request.activity_id;
  const activity = activityId ? store.getActivity(userId, activityId) : null;
  const actions = (response?.actions_applied ?? []).map(action => Object.fromEntries(
    ['type', 'activity_id', 'thread_id', 'parent_id', 'parent_activity_id'].filter(key => Object.hasOwn(action, key)).map(key => [key, action[key]])));
  return {
    activity_id: activityId ?? null,
    selected_thread_id: activity?.thread_id ?? null,
    selected_parent_id: activity?.parent_id ?? null,
    thread_source: actions.some(a => ['select_thread', 'reparent'].includes(a.type)) ? 'review'
      : response?.reducer?.thread_source ?? (actions.some(a => ['begin_existing', 'no_op', 'resume_existing'].includes(a.type)) ? 'existing_activity' : null),
    parent_source: response?.reducer?.parent_source ?? null,
    rules_fired: (response?.rules_fired ?? []).map(rule => rule.rule),
    actions_applied: actions,
    review_status: response?.model_review?.status ?? null,
    review_id: response?.review?.review_id ?? response?.review_id ?? null,
    thread_selection_requested: response?.review?.context?.thread_selection ?? false,
    review_error_code: response?.model_review?.code ?? null,
    direction: response?.direction ?? null,
    review_model: response?.reviewer?.model ?? null,
    review_usage: response?.reviewer?.usage ?? null,
  };
}
