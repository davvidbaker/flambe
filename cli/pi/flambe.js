import { clientFromEnv } from '../src/client.mjs';
import { loadProjectEnv } from '../src/env.mjs';
import { beginRequest, requestHeadline } from '../src/requests.mjs';

export { requestHeadline } from '../src/requests.mjs';

/**
 * The Pi adapter detects when requests begin. Completion belongs to the work,
 * not to Pi's agent_end/agent_settled or session shutdown notifications.
 *
 * A live root remains available across prompts, reloads, and session resumes.
 * The agent explicitly ends it with "flambe request complete" only after the
 * user's original request has actually been satisfied.
 */
export function registerPiActivityRoots(pi, {
  env = process.env,
  makeClient = clientFromEnv,
  loadEnv = loadProjectEnv,
} = {}) {
  const originalSessionId = env.PI_SESSION_ID;
  const originalRequestRootId = env.FLAMBE_REQUEST_ROOT_ID;
  let root = null;

  const warn = (ctx, message, error) => {
    if (ctx.hasUI) ctx.ui.notify(`Flambé: ${message}: ${error.message}`, 'warning');
  };

  pi.on('before_agent_start', async (event, ctx) => {
    if (event.messageType !== 'user') return;

    const sessionId = ctx.sessionManager.getSessionId();
    if (!sessionId) return;
    env.PI_SESSION_ID = sessionId;

    const config = { ...env };
    try {
      loadEnv({ cwd: ctx.cwd, env: config });
      if (!['FLAMBE_URL', 'FLAMBE_API_TOKEN', 'FLAMBE_TRACE_ID'].every(key => config[key]?.trim())) return;

      // Resolve under the current Pi session, not an earlier session's root.
      config.PI_SESSION_ID = sessionId;
      delete config.FLAMBE_REQUEST_ROOT_ID;
      const client = makeClient(config);
      await client.supportsAgentCommands();
      const active = (await client.status({ activeOnly: true })).activities;
      const roots = active.filter(activity => activity.parentId == null
        && activity.agentId === client.agentId && activity.status === 'running');
      // Reuse the active request until the agent explicitly completes it.
      const existing = roots.at(-1);
      const id = existing?.id ?? await beginRequest(client, { prompt: event.prompt });
      root = { sessionId, id, client };
      env.FLAMBE_REQUEST_ROOT_ID = String(id);
      return {
        systemPrompt: `${event.systemPrompt}

Flambé is tracking the user's current request as root activity #${id}. Keep this root open through handoffs, retries, follow-ups, and pauses. Use normal Flambé commands to track meaningful subactivities. ONLY when the original request is actually complete, finish any open subactivities and run \`flambe request complete ${id} "<brief outcome>"\` before giving the final answer. If blocked or incomplete, leave the root open; do not close it merely because this Pi run ended. New prompts will continue the root until it is complete.`,
      };
    } catch (error) {
      root = null;
      if (originalRequestRootId === undefined) delete env.FLAMBE_REQUEST_ROOT_ID;
      else env.FLAMBE_REQUEST_ROOT_ID = originalRequestRootId;
      warn(ctx, 'could not track the request', error);
    }
  });

  pi.on('session_shutdown', () => {
    // Never equate the end of a session with the end of the user's request.
    root = null;
    if (originalSessionId === undefined) delete env.PI_SESSION_ID;
    else env.PI_SESSION_ID = originalSessionId;
    if (originalRequestRootId === undefined) delete env.FLAMBE_REQUEST_ROOT_ID;
    else env.FLAMBE_REQUEST_ROOT_ID = originalRequestRootId;
  });
}

export default registerPiActivityRoots;
