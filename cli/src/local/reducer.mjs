import { CommandError, commandState, executeCommand } from './commands.mjs';
import { createReducerProvider, reducerConfig } from './reducer-provider.mjs';
import { applyReviewedDecision, fail, fingerprint, schema, system, view } from './reducer-review.mjs';
import { compactWorkAIResult, createWorkAIReviewer } from './work-ai-review.mjs';

/** Await models outside SQLite transactions; validate and commit against an unchanged trace. */
export function createLocalCommandRunner(store, options = {}) {
  const provider = options.provider ?? createReducerProvider(reducerConfig(options.env), options);
  const enabled = provider.mode !== 'off';
  const workAI = provider.mode === 'agent' ? createWorkAIReviewer(store) : null;
  const dispatch = async (userId, command, attrs, agent = null) => {
    if (enabled && attrs?.allow_stack_changes !== undefined && typeof attrs.allow_stack_changes !== 'boolean') {
      throw fail('INVALID_INPUT', 'allow_stack_changes must be boolean.');
    }
    const agentId = agent?.agent_id ?? attrs?.agent_id;
    if (enabled && agentId != null && (typeof agentId !== 'string' || !agentId.trim() || agentId.length > 200)) {
      throw fail('INVALID_INPUT', 'agent_id is invalid.');
    }
    if (command === 'decide') {
      if (!workAI) throw fail('REDUCER_NOT_CONFIGURED', 'Decision submission requires agent reducer mode.', 503);
      return workAI.submit(userId, attrs, agentId);
    }
    const previous = enabled && command === 'start' ? store.getTrace(userId, attrs?.trace_id) : null;
    let result;
    try { result = executeCommand(store, userId, command, attrs, agent, { modelReviewAvailable: enabled, reviewStarts: !workAI || Boolean(provider.reviewStarts) }); }
    catch (error) {
      if (!enabled || command !== 'message' || error.body?.error?.code !== 'REDUCER_NOT_CONFIGURED') throw error;
    }
    const rule = result?.rules_fired.find(r => ['initial_thread_selection', 'new_root_while_open', 'name_unfit'].includes(r.rule));
    if (command !== 'message' && (!enabled || !rule)) return result;
    if (workAI && command !== 'message' && !provider.reviewStarts && rule.rule !== 'initial_thread_selection') {
      return { ...result, model_review: { mode: 'agent', status: 'available' },
        review_available: { activity_id: result.activity_id, reason: rule.rule,
          message: 'Tracking was recorded. Request flambe_message or flambe message for this activity when judgment is needed.' } };
    }
    const traceId = Number(attrs.trace_id);
    const id = result?.activity_id ?? (attrs.activity_id != null ? Number(attrs.activity_id)
      : store.newestActiveActivity(traceId, { agentId })?.id);
    const trace = store.getTrace(userId, traceId);
    const snapshotHash = fingerprint(trace);
    const candidates = (previous || workAI) ? commandState(previous ?? trace).activities.filter(a => a.status === 'running'
      && a.agentId === agentId && a.id !== id).map(a => a.id) : [];
    try {
      const context = view(store, userId, trace, id, rule?.rule ?? 'message',
        attrs.message ?? 'Review this activity placement.', agentId, attrs.allow_stack_changes === false, candidates, { compact: Boolean(workAI) });
      if (workAI) return workAI.request(userId, { traceId, activityId: id, agentId, context, snapshotHash, result });
      const decision = await provider.review({ system, context, schema });
      store.db.exec('BEGIN IMMEDIATE');
      try {
        const response = applyReviewedDecision(store, { userId, traceId, activityId: id,
          context, snapshotHash, decision, reviewer: { mode: provider.mode, model: provider.model }, result });
        store.db.exec('COMMIT');
        return response;
      } catch (error) { store.db.exec('ROLLBACK'); throw error; }
    } catch (error) {
      const safe = error instanceof CommandError ? error : fail('REDUCER_PROVIDER_ERROR', 'AI reducer review failed.', 502);
      if (command === 'message') throw safe;
      // The worker's lifecycle event already committed. Provider failure must not drop it or invite duplicate starts.
      try {
        store.createEvent(userId, { traceId, activityId: id, event: { phase: 'reducer_decision',
          message: `AI review failed: ${safe.body.error.code}; recorded work was preserved.`, timestamp_integer: Date.now() } });
      } catch { /* An audit write failure must not turn an already-committed start into a retry. */ }
      return { ...result, model_review: { mode: provider.mode, status: 'failed', ...safe.body.error },
        state: commandState(store.getTrace(userId, traceId)) };
    }
  };
  const run = async (userId, command, attrs, agent = null) => {
    const response = await dispatch(userId, command, attrs, agent);
    return workAI && command !== 'status'
      ? compactWorkAIResult(response, agent?.agent_id ?? attrs?.agent_id) : response;
  };
  run.info = { mode: provider.mode, model: provider.model ?? null, enabled, work_ai_reviews: Boolean(workAI), review_starts: workAI ? Boolean(provider.reviewStarts) : enabled };
  return run;
}
