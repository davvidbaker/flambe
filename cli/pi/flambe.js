import { clientFromEnv } from '../src/client.mjs';
import { loadProjectEnv } from '../src/env.mjs';

/** One readable headline for a whole Pi user request, without an extra model call. */
export function requestHeadline(prompt) {
  const text = String(prompt ?? '').trim().replace(/\s+/g, ' ');
  if (!text) return 'Image or attachment request';
  return text.length > 120 ? `${text.slice(0, 119)}…` : text;
}

/**
 * Pi owns the root lifecycle. The normal Flambé CLI owns child activities.
 * PI_SESSION_ID makes shell-invoked "flambe start" use the same agent identity
 * as this extension, so the reducer nests those starts under the open root.
 */
export function registerPiActivityRoots(pi, {
  env = process.env,
  makeClient = clientFromEnv,
  loadEnv = loadProjectEnv,
} = {}) {
  const originalSessionId = env.PI_SESSION_ID;
  let root = null;

  const warn = (ctx, action, error) => {
    if (ctx.hasUI) ctx.ui.notify(`Flambé: couldn't ${action}: ${error.message}`, 'warning');
  };

  const finish = async (ctx, message) => {
    const current = root;
    root = null;
    if (!current) return;
    try {
      // At settlement, unfinished child activities must not strand the root.
      await current.client.end({ activityId: current.id, force: true, ...(message ? { message } : {}) });
    } catch (error) {
      warn(ctx, 'close the request activity', error);
    }
  };

  pi.on('before_agent_start', async (event, ctx) => {
    if (event.messageType !== 'user') return;

    // If a new user request arrives before settlement, give it a fresh root.
    await finish(ctx, 'Superseded by a new request');

    const sessionId = ctx.sessionManager.getSessionId();
    if (!sessionId) return;
    // Child shell tools inherit this, and CLI already derives pi:<session id>.
    env.PI_SESSION_ID = sessionId;

    const config = { ...env };
    try {
      loadEnv({ cwd: ctx.cwd, env: config });
      if (!['FLAMBE_URL', 'FLAMBE_API_TOKEN', 'FLAMBE_TRACE_ID'].every(key => config[key]?.trim())) return;
      const client = makeClient(config);
      // Detect a stopped or unauthorized server rather than silently queuing a
      // root that the child activity commands cannot yet see.
      await client.supportsAgentCommands();
      const id = await client.start({ name: requestHeadline(event.prompt), parentId: null });
      root = { id, client };
    } catch (error) {
      warn(ctx, 'start the request activity', error);
    }
  });

  pi.on('agent_settled', async (event, ctx) => {
    await finish(ctx, event.aborted ? 'Interrupted' : undefined);
  });

  pi.on('session_shutdown', async (_event, ctx) => {
    await finish(ctx, 'Pi session closed');
    if (originalSessionId === undefined) delete env.PI_SESSION_ID;
    else env.PI_SESSION_ID = originalSessionId;
  });
}

export default registerPiActivityRoots;
