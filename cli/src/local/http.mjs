import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { COMMANDS, CommandError, executeCommand } from './commands.mjs';

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendEmpty(res, status, headers = {}) {
  res.writeHead(status, headers);
  res.end();
}

function setSessionCookie(resHeaders, userId) {
  resHeaders.push(['set-cookie', `flambe_user=${userId}; Path=/; HttpOnly; SameSite=Lax`]);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name) cookies[name] = rest.join('=');
  }
  return cookies;
}

function bearer(req) {
  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function mimeFor(filePath) {
  switch (extname(filePath)) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'text/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.svg': return 'image/svg+xml';
    case '.png': return 'image/png';
    case '.ico': return 'image/x-icon';
    case '.woff2': return 'font/woff2';
    default: return 'application/octet-stream';
  }
}

function authenticate(store, req) {
  const token = bearer(req);
  if (token) {
    const auth = store.authenticateToken(token);
    if (auth) return { user: auth.user, tokenName: auth.tokenName };
  }
  const userId = parseCookies(req.headers.cookie).flambe_user;
  if (userId) {
    const user = store.userById(userId);
    if (user) return { user, tokenName: null };
  }
  return null;
}

function parseJson(buffer) {
  if (!buffer.length) return {};
  return JSON.parse(buffer.toString('utf8'));
}

function headerBag() {
  const headers = [];
  return {
    push: (name, value) => headers.push([name, value]),
    apply(res, status, extra = {}) {
      res.writeHead(status, Object.fromEntries([...headers, ...Object.entries(extra)]));
    },
    list: headers,
  };
}

// Same contract as FlambeNextWeb.Plugs.AgentIdentity (ADR-012).
function identifyAgent(store, req, auth) {
  if (!auth) return null;
  const agentId = req.headers['x-flambe-agent-id'];
  const agentName = req.headers['x-flambe-agent-name'];
  const agentPlatform = req.headers['x-flambe-agent-platform'];
  if (typeof agentId !== 'string') return null;
  return store.identifyAgent(
    auth.user.id,
    agentId,
    typeof agentName === 'string' ? agentName : undefined,
    typeof agentPlatform === 'string' ? agentPlatform : undefined,
  );
}

function agentHeaders(agent) {
  if (!agent) return {};
  return {
    'x-flambe-agent-name': agent.name,
    ...(agent.assigned ? { 'x-flambe-agent-name-assigned': 'true' } : {}),
  };
}

async function dispatch(store, req, url, body, { auth, agent }) {
  const method = req.method ?? 'GET';
  const path = url.pathname;

  if (method === 'GET' && path === '/api/health') {
    return { status: 200, json: { status: 'ok' } };
  }

  if (method === 'POST' && path === '/auth/identity/callback') {
    const { user, traceId } = store.credentials();
    const headers = headerBag();
    headers.push('set-cookie', `flambe_user=${user.id}; Path=/; HttpOnly; SameSite=Lax`);
    return {
      status: 200,
      json: { data: { id: user.id, username: user.username, trace_id: traceId } },
      headers,
    };
  }

  if (method === 'DELETE' && path === '/auth/logout') {
    const headers = headerBag();
    headers.push('set-cookie', 'flambe_user=; Path=/; HttpOnly; Max-Age=0');
    return { status: 204, headers };
  }

  const needAuth = path.startsWith('/api/') && path !== '/api/health' && path !== '/api/register';
  if (needAuth && !auth) {
    return { status: 401, json: { error: 'UNAUTHENTICATED' } };
  }

  const userId = auth?.user?.id;

  if (path === '/api/agent-commands') {
    if (method === 'GET') return { status: 200, json: { data: {
      version: 1, commands: COMMANDS, runtime_mode: 'local_self_contained', model_review: false,
    } } };
    if (method === 'POST') return { status: 200, json: {
      data: executeCommand(store, userId, body.command, body.arguments, agent),
    } };
  }

  if (method === 'GET' && path === '/api/agents/me') {
    if (!agent) {
      return { status: 400, json: { error: 'AGENT_ID_REQUIRED', detail: 'Send x-flambe-agent-id with a bearer token' } };
    }
    return { status: 200, json: { data: { agent_id: agent.agent_id, name: agent.name, platform: agent.platform ?? null, name_assigned: agent.assigned } } };
  }

  if (method === 'GET' && path === '/api/export') {
    return { status: 200, json: store.exportBundle() };
  }

  if (method === 'GET' && path === '/api/categories') {
    return { status: 200, json: { data: store.listCategories(userId) } };
  }

  if (method === 'POST' && path === '/api/categories') {
    const category = store.createCategory(userId, body.category ?? {}, body.activity_ids ?? []);
    return { status: 201, json: { data: category } };
  }

  const categoryMatch = path.match(/^\/api\/categories\/(\d+)$/);
  if (categoryMatch) {
    const id = categoryMatch[1];
    if (method === 'GET') {
      const categories = store.listCategories(userId);
      const category = categories.find(row => String(row.id) === id);
      if (!category) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: category } };
    }
    if (method === 'PUT') {
      const category = store.updateCategory(userId, id, body.category ?? {});
      if (!category) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: category } };
    }
    if (method === 'DELETE') {
      if (!store.deleteCategory(userId, id)) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 204 };
    }
  }

  if (method === 'GET' && path === '/api/traces') {
    return { status: 200, json: { data: store.listTraces(userId) } };
  }

  if (method === 'POST' && path === '/api/traces') {
    const trace = store.createTrace(userId, body.trace?.name ?? 'Untitled');
    return { status: 201, json: { data: { id: trace.id, name: trace.name, events: [], threads: trace.threads } } };
  }

  const threadOrder = path.match(/^\/api\/traces\/(\d+)\/thread_order$/);
  if (threadOrder && method === 'PUT') {
    const result = store.reorderThreads(userId, threadOrder[1], body.thread_ids ?? []);
    if (result.error === 'not_found') return { status: 404, json: { error: 'NOT_FOUND' } };
    if (result.error === 'invalid') {
      return { status: 422, json: { errors: { thread_ids: ['must include each thread in this trace exactly once'] } } };
    }
    return { status: 200, json: { data: { threads: result.threads } } };
  }

  const traceMatch = path.match(/^\/api\/traces\/(\d+)$/);
  if (traceMatch) {
    const id = traceMatch[1];
    if (method === 'GET') {
      const trace = store.getTrace(userId, id);
      if (!trace) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: trace } };
    }
    if (method === 'PUT') {
      const trace = store.updateTrace(userId, id, body.trace ?? {});
      if (!trace) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: trace } };
    }
    if (method === 'DELETE') {
      if (!store.deleteTrace(userId, id)) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 204 };
    }
  }

  if (method === 'POST' && path === '/api/threads') {
    const thread = store.createThread(userId, body.trace_id, body.thread ?? {});
    if (!thread) return { status: 404, json: { error: 'NOT_FOUND' } };
    return { status: 201, json: { data: thread } };
  }

  const threadMatch = path.match(/^\/api\/threads\/(\d+)$/);
  if (threadMatch) {
    const id = threadMatch[1];
    if (method === 'GET') {
      const thread = store.getThread(userId, id);
      if (!thread) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: thread } };
    }
    if (method === 'PUT') {
      const thread = store.updateThread(userId, id, body.thread ?? {});
      if (!thread) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: thread } };
    }
    if (method === 'DELETE') {
      if (!store.deleteThread(userId, id)) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 204 };
    }
  }

  if (method === 'POST' && path === '/api/activities') {
    if (auth.tokenName !== null) {
      const activity = body.activity ?? {};
      const folded = executeCommand(store, userId, 'start', {
        trace_id: body.trace_id, thread_id: body.thread_id, name: activity.name,
        description: activity.description, category_ids: activity.categories,
        ...(Object.hasOwn(activity, 'parent_id') ? { parent_id: activity.parent_id } : {}),
        timestamp: body.event?.timestamp_integer,
      }, agent);
      return { status: 201, json: { data: {
        activity: store.getActivity(userId, folded.activity_id),
        event: { id: folded.event_id,
          phase: folded.state.activities.find(a => a.id === folded.activity_id)?.latestEvent.phase },
        reducer: folded.reducer ?? { actions_applied: folded.actions_applied },
        direction: folded.direction, reply: folded.reply, rules_fired: folded.rules_fired,
        actions_applied: folded.actions_applied,
      } } };
    }
    const result = store.createActivity(userId, {
      traceId: body.trace_id,
      threadId: body.thread_id,
      activity: body.activity ?? {},
      event: body.event ?? {},
      agent,
    });
    if (result.error) return { status: 404, json: { error: 'NOT_FOUND' } };
    return { status: 201, json: { data: result } };
  }

  const activityMatch = path.match(/^\/api\/activities\/(\d+)$/);
  if (activityMatch) {
    const id = activityMatch[1];
    if (method === 'GET') {
      const activity = store.getActivity(userId, id);
      if (!activity) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: activity } };
    }
    if (method === 'PUT') {
      const activity = store.updateActivity(userId, id, body.activity ?? {});
      if (activity?.error === 'not_found' || !activity) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: activity } };
    }
    if (method === 'DELETE') {
      if (!store.deleteActivity(userId, id)) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 204 };
    }
  }

  if (method === 'POST' && path === '/api/events') {
    const phase = body.event?.phase;
    const command = { E: 'end', J: 'end', V: 'end', S: 'suspend', R: 'resume' }[phase];
    if (auth.tokenName !== null && command) {
      const folded = executeCommand(store, userId, command, {
        trace_id: body.trace_id, activity_id: body.activity_id,
        timestamp: body.event?.timestamp_integer, message: body.event?.message,
        phase, force: body.force ?? true,
      }, agent);
      return { status: 201, json: { data: {
        id: folded.event_id, phase,
        reducer: { closed_descendants: folded.closed_descendants,
          rules_fired: folded.rules_fired, actions_applied: folded.actions_applied,
          direction: folded.direction, reply: folded.reply },
      } } };
    }
    const result = store.createEvent(userId, {
      traceId: body.trace_id,
      activityId: body.activity_id,
      event: body.event ?? {},
    });
    if (result.error) return { status: 404, json: { error: 'NOT_FOUND' } };
    return { status: 201, json: { data: result } };
  }

  const eventMatch = path.match(/^\/api\/events\/(\d+)$/);
  if (eventMatch) {
    const id = eventMatch[1];
    if (method === 'PUT') {
      const event = store.updateEvent(userId, id, body.event ?? {});
      if (!event) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 200, json: { data: event } };
    }
    if (method === 'DELETE') {
      if (!store.deleteEvent(userId, id)) return { status: 404, json: { error: 'NOT_FOUND' } };
      return { status: 204 };
    }
  }

  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch && method === 'GET') {
    if (String(userId) !== userMatch[1]) return { status: 404, json: { error: 'NOT_FOUND' } };
    return { status: 200, json: { data: store.userDashboard(userId) } };
  }

  if (method === 'POST' && path === '/api/todos') {
    return { status: 201, json: { data: store.createTodo(userId, body.todo ?? {}) } };
  }

  if (method === 'POST' && path === '/api/mantras') {
    return { status: 201, json: { data: store.createMantra(userId, body.mantra ?? {}) } };
  }

  if (method === 'POST' && path === '/api/attentions') {
    const attention = store.createAttention(userId, body.attention ?? {});
    if (attention.error) return { status: 404, json: { error: 'NOT_FOUND' } };
    return { status: 201, json: { data: attention } };
  }

  if (method === 'POST' && path === '/api/observations') {
    const { observation, created } = store.upsertObservation(userId, body.observation ?? {});
    return { status: created ? 201 : 200, json: { data: observation } };
  }

  if (method === 'GET' && path === '/api/observations') {
    return { status: 200, json: { data: store.listObservations(userId) } };
  }

  if (method === 'GET' && path === '/api/api-tokens') {
    const { rawToken } = store.credentials();
    return {
      status: 200,
      json: { data: [{ id: 1, name: 'local', inserted_at: isoNow(), last_used_at: null, hint: 'see flambe serve output' }] },
    };
  }

  if (method === 'POST' && path === '/api/register') {
    return { status: 404, json: { error: 'LOCAL_MODE' } };
  }

  return { status: 404, json: { error: 'NOT_FOUND' } };
}

function isoNow() {
  return new Date().toISOString();
}

function tryStatic(staticDir, urlPath, res) {
  if (!staticDir) return false;
  const root = resolve(staticDir);
  const indexPath = join(root, 'assets', 'index.html');
  const requested = urlPath === '/' || !urlPath.includes('.')
    ? indexPath
    : join(root, urlPath.replace(/^\//, ''));
  const normalized = normalize(requested);
  if (!normalized.startsWith(root)) return false;
  if (!existsSync(normalized) || !statSync(normalized).isFile()) {
    if (existsSync(indexPath)) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      createReadStream(indexPath).pipe(res);
      return true;
    }
    return false;
  }
  res.writeHead(200, { 'content-type': mimeFor(normalized) });
  createReadStream(normalized).pipe(res);
  return true;
}

export async function handleLocalRequest(store, req, res, { staticDir } = {}) {
  const host = req.headers.host ?? '127.0.0.1';
  const url = new URL(req.url ?? '/', `http://${host}`);
  // A locally served UI must not send trace content to a compiled-in remote API.
  res.setHeader('content-security-policy', "connect-src 'self'; form-action 'self'; frame-ancestors 'none'");
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    sendJson(res, 403, { error: 'LOCAL_HOST_REQUIRED' });
    return;
  }
  if (req.headers.origin) {
    let origin;
    try { origin = new URL(req.headers.origin); } catch { /* rejected below */ }
    if (!origin || !['http:', 'https:'].includes(origin.protocol)
      || !['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) {
      sendJson(res, 403, { error: 'LOCAL_ORIGIN_REQUIRED' });
      return;
    }
  }

  if (!url.pathname.startsWith('/api') && !url.pathname.startsWith('/auth')) {
    if (tryStatic(staticDir, url.pathname, res)) return;
    const { rawToken, traceId } = store.credentials();
    const html = `<!doctype html><meta charset="utf-8"><title>Flambe local</title>
<body style="font-family:sans-serif;max-width:40rem;margin:3rem auto;line-height:1.4">
<h1>Flambe local</h1>
<p>CLI API is running. From the repository root, run <code>npm --prefix frontend run build:local</code>, then restart <code>flambe serve</code> to open the local chart here.</p>
<pre>FLAMBE_URL=http://${host}
FLAMBE_RUNTIME_MODE=local_self_contained
FLAMBE_API_TOKEN=${rawToken}
FLAMBE_TRACE_ID=${traceId}</pre>
</body>`;
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  let body = {};
  try {
    body = parseJson(await readBody(req));
  } catch {
    sendJson(res, 400, { error: 'INVALID_JSON' });
    return;
  }

  const auth = authenticate(store, req);
  const agent = identifyAgent(store, req, auth);
  let result;
  try {
    result = await dispatch(store, req, url, body, { auth, agent });
  } catch (error) {
    if (!(error instanceof CommandError)) throw error;
    result = { status: error.status, json: error.body };
  }
  const identity = agentHeaders(agent);
  if (result.status === 204) {
    if (result.headers) result.headers.apply(res, 204, identity);
    else sendEmpty(res, 204, identity);
    return;
  }

  const payload = JSON.stringify(result.json);
  const extra = { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(payload), ...identity };
  if (result.headers) result.headers.apply(res, result.status, extra);
  else res.writeHead(result.status, extra);
  res.end(payload);
}

export { sendJson, setSessionCookie };
