import { randomUUID } from 'node:crypto';
import { CommandError, commandState } from './commands.mjs';
import { applyReviewedDecision, fail, schema, system } from './reducer-review.mjs';

const lifetime = 15 * 60_000;
const canonical = value => JSON.stringify(value, function (key, item) {
  return item && typeof item === 'object' && !Array.isArray(item)
    ? Object.fromEntries(Object.keys(item).sort().map(k => [k, item[k]])) : item;
});
const requireAgent = agentId => {
  if (typeof agentId !== 'string' || !agentId.trim()) throw fail('AGENT_ID_REQUIRED', 'Use the same stable agent_id to request and submit a work-AI review.');
};
const instructions = `${system}
You are the current work AI, not an independent reviewer. Evaluate the user's intent
and this snapshot before continuing. For this work-AI review, ask and reparent are
also allowed on current; reparent only a running current to reparent_candidates.
Submit your decision with flambe_decide (MCP) or flambe decide (CLI), using this
review_id, trace, instance, and the same agent_id. Do not claim independent approval.
If you cannot judge safely, use direction escalate with no actions and ask the user.
A lifecycle proposal is already recorded: do not repeat it to request review.
On REDUCER_STATE_CHANGED or REVIEW_EXPIRED, request a fresh flambe_message review.`;

export function createWorkAIReviewer(store) {
  return {
    request(userId, { traceId, activityId, agentId, context, snapshotHash, result }) {
      requireAgent(agentId);
      const id = randomUUID();
      const now = Date.now();
      const reviewedContext = { ...context, reviewer_mode: 'agent' };
      store.db.prepare('DELETE FROM reducer_reviews WHERE created_ms < ?').run(now - 86_400_000);
      store.db.prepare(`INSERT INTO reducer_reviews
        (id, user_id, trace_id, activity_id, agent_id, context, snapshot_hash, created_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, userId, traceId, activityId, agentId,
        JSON.stringify(reviewedContext), snapshotHash, now);
      return { activity_id: activityId, rules_fired: [], closed_descendants: [], actions_applied: [], ...result,
        model_review: { mode: 'agent', status: 'awaiting_decision' },
        review: { review_id: id, expires_at: new Date(now + lifetime).toISOString(),
          context: reviewedContext, instructions, decision_schema: schema } };
    },
    submit(userId, attrs, agentId) {
      requireAgent(agentId);
      if (!attrs || typeof attrs.review_id !== 'string' || !Number.isSafeInteger(Number(attrs.trace_id)) || Number(attrs.trace_id) <= 0) {
        throw fail('INVALID_INPUT', 'A review_id and positive trace_id are required.');
      }
      store.db.exec('BEGIN IMMEDIATE');
      try {
        const review = store.db.prepare('SELECT * FROM reducer_reviews WHERE id = ? AND user_id = ? AND trace_id = ? AND agent_id = ?')
          .get(attrs.review_id, userId, Number(attrs.trace_id), agentId);
        if (!review) throw fail('REVIEW_NOT_FOUND', 'No matching review exists for this instance, trace, and agent.', 404);
        if (review.receipt) {
          if (canonical(attrs.decision) !== review.decision) throw fail('REVIEW_ALREADY_DECIDED', 'This review already has a different decision.', 409);
          const response = { ...JSON.parse(review.receipt), replayed: true, state: commandState(store.getTrace(userId, review.trace_id)) };
          store.db.exec('COMMIT');
          return response;
        }
        if (Date.now() > review.created_ms + lifetime) throw fail('REVIEW_EXPIRED', 'Request a fresh review before submitting a decision.', 409);
        const response = { ...applyReviewedDecision(store, { userId, traceId: review.trace_id, activityId: review.activity_id,
          context: JSON.parse(review.context), snapshotHash: review.snapshot_hash, decision: attrs.decision,
          reviewer: { mode: 'agent', agent_id: agentId } }), review_id: review.id };
        store.db.prepare('UPDATE reducer_reviews SET decision = ?, receipt = ? WHERE id = ?')
          .run(canonical(attrs.decision), JSON.stringify(response), review.id);
        store.db.exec('COMMIT');
        return response;
      } catch (error) {
        store.db.exec('ROLLBACK');
        if (error instanceof CommandError) throw error;
        throw fail('REDUCER_PERSISTENCE_ERROR', 'The review decision could not be saved; no review changes were applied.', 503);
      }
    },
  };
}

/** Routine replies expose current work; explicit status can still request full history. */
export function compactWorkAIResult(result, agentId) {
  if (!result?.state?.activities) return result;
  const activities = result.state.activities;
  const byId = new Map(activities.map(a => [a.id, a]));
  const keep = new Set([result.activity_id]);
  for (const a of activities) if (a.agentId === agentId && a.status !== 'ended') keep.add(a.id);
  for (const a of [...(result.actions_applied ?? []), ...(result.closed_descendants ?? [])]) {
    if (a.activity_id != null) keep.add(a.activity_id);
    if (a.parent_activity_id != null) keep.add(a.parent_activity_id);
  }
  for (const id of [...keep]) {
    const seen = new Set();
    let parent = byId.get(id)?.parentId;
    while (parent != null && !seen.has(parent)) {
      seen.add(parent); keep.add(parent); parent = byId.get(parent)?.parentId;
    }
  }
  const visible = activities.filter(a => keep.has(a.id));
  return { ...result, state: { ...result.state, activities: visible,
    scope: 'current_activity_and_own_open_work', omitted_activity_count: activities.length - visible.length } };
}
