import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

import { clientFromEnv, clientFromHostEnv } from './client.mjs';
import { clearQuestion, readOpenQuestion, rememberQuestion } from './questions.mjs';

// `node:sqlite` still prints an ExperimentalWarning on import in some Node 22 releases.
// Only serve/export need it, so load those modules on demand and keep every other
// command's stderr clean for reducer notes.
const loadServe = () => import('./local/serve.mjs');
const loadStore = () => import('./local/store.mjs');

function defaultDbPath() {
  return join(homedir(), '.flambe', 'local.sqlite');
}

const usage = `Usage:
  flambe start <activity name> [--description <text>] [--thread <id|name>] [--parent <id> | --root] [--category <id>...] [--started-at <ISO-8601>]
  flambe end <activity-id> [message] [--force]
  flambe suspend <activity-id> [message]
  flambe resume <activity-id> [message]
  flambe status [--active | --suspended] [--json]
  flambe threads [--json]
  flambe categories [--json]
  flambe ping
  flambe whoami [--json]
  flambe message <text> [--activity <id>] [--json]
  flambe observe <kind> <value> [--unit <unit>] [--on <YYYY-MM-DD>] [--payload <json>] [--at <ISO-8601>]
  flambe serve [--port <n>] [--db <path>] [--static <dir>]
  flambe export [file] [--db <path>]
  flambe import <file> [--url <url>] [--token <token>]

Configuration:
  Loads .env from the current working directory.
  Existing shell environment variables take precedence.

Required values:
  FLAMBE_URL
  FLAMBE_API_TOKEN
  FLAMBE_TRACE_ID

Optional:
  FLAMBE_AGENT_ID    Stable ID for this running agent; enables named flame lanes.
                     Derived from Codex, Cursor, or Claude Code session env when unset.
  FLAMBE_AGENT_NAME  Override the lane name. Unset, the reducer names the agent and the
                     CLI remembers it in ~/.flambe/agent-names.json. Do not put this in .env.
  FLAMBE_AGENT_PLATFORM  Product the agent runs on, shared by many agents ("Cursor Cloud",
                     "Codex"). Derived from the session type when unset.
  FLAMBE_AGENT_NAMES_PATH  Where remembered agent names live.
  FLAMBE_THREAD      Thread name, unique slug, or id for start when --thread is omitted
                     (overridden by --thread). 'flambe' matches 'flambé🔥'. The reducer
                     still keeps a child on its parent's thread.
  FLAMBE_QUEUE_PATH  Local offline queue path (default: ~/.flambe/event-queue.json)
  FLAMBE_LOCAL_DB    SQLite path for flambe serve / export (default: ~/.flambe/local.sqlite)

serve / export do not need FLAMBE_URL. import needs FLAMBE_URL and FLAMBE_API_TOKEN (the production instance).`;

function parseStart(args) {
  const nameParts = [];
  let description;
  let threadId;
  let parentId;
  let startedAt;
  const categoryIds = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--description') {
      description = args[index + 1];
      if (description === undefined) throw new Error('--description requires a value');
      index += 1;
    } else if (arg === '--thread') {
      threadId = args[index + 1];
      if (threadId === undefined) throw new Error('--thread requires a value');
      index += 1;
    } else if (arg === '--parent') {
      if (parentId !== undefined) throw new Error('--parent and --root cannot be combined');
      parentId = args[index + 1];
      if (parentId === undefined) throw new Error('--parent requires a value');
      index += 1;
    } else if (arg === '--root') {
      if (parentId !== undefined) throw new Error('--parent and --root cannot be combined');
      parentId = null;
    } else if (arg === '--category') {
      const categoryId = args[index + 1];
      if (categoryId === undefined) throw new Error('--category requires a value');
      categoryIds.push(categoryId);
      index += 1;
    } else if (arg === '--started-at') {
      startedAt = args[index + 1];
      if (startedAt === undefined) throw new Error('--started-at requires a value');
      index += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      nameParts.push(arg);
    }
  }

  return {
    name: nameParts.join(' '),
    description,
    threadId,
    ...(parentId === undefined ? {} : { parentId }),
    categoryIds,
    startedAt,
  };
}

function parseEnd(args) {
  let force = false;
  const positional = [];

  for (const arg of args) {
    if (arg === '--force') force = true;
    else if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }

  const [activityId, ...messageParts] = positional;
  return {
    activityId,
    message: messageParts.join(' ') || undefined,
    force,
  };
}

function parseStatus(args) {
  let activeOnly = false;
  let suspendedOnly = false;
  let json = false;

  for (const arg of args) {
    if (arg === '--active') activeOnly = true;
    else if (arg === '--suspended') suspendedOnly = true;
    else if (arg === '--json') json = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (activeOnly && suspendedOnly) throw new Error('--active and --suspended cannot be used together');
  return { activeOnly, suspendedOnly, json };
}

function parseObserve(args) {
  const positional = [];
  let unit;
  let observedOn;
  let payload;
  let at;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--unit') {
      unit = args[index + 1];
      if (unit === undefined) throw new Error('--unit requires a value');
      index += 1;
    } else if (arg === '--on') {
      observedOn = args[index + 1];
      if (observedOn === undefined) throw new Error('--on requires a value');
      index += 1;
    } else if (arg === '--payload') {
      const raw = args[index + 1];
      if (raw === undefined) throw new Error('--payload requires a JSON object');
      try {
        payload = JSON.parse(raw);
      } catch {
        throw new Error('--payload must be valid JSON');
      }
      if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('--payload must be a JSON object');
      }
      index += 1;
    } else if (arg === '--at') {
      at = args[index + 1];
      if (at === undefined) throw new Error('--at requires a value');
      index += 1;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  const [kind, valueText, ...rest] = positional;
  if (!kind || valueText === undefined || rest.length > 0) {
    throw new Error('Usage: flambe observe <kind> <value> [--unit <unit>] [--on <YYYY-MM-DD>] [--payload <json>] [--at <ISO-8601>]');
  }

  const value = Number(valueText);
  if (!Number.isFinite(value)) throw new Error('value must be a finite number');
  if (observedOn !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(observedOn)) {
    throw new Error('--on must be YYYY-MM-DD');
  }

  return {
    kind,
    value,
    unit,
    observedOn,
    payload,
    at,
  };
}

function parseJson(args) {
  if (args.length === 0) return false;
  if (args.length === 1 && args[0] === '--json') return true;
  throw new Error(`Unknown option: ${args[0]}`);
}

function takeOption(args, name) {
  const index = args.indexOf(name);
  if (index === -1) return { value: undefined, rest: args };
  const value = args[index + 1];
  if (value === undefined) throw new Error(`${name} requires a value`);
  return { value, rest: [...args.slice(0, index), ...args.slice(index + 2)] };
}

function parseServe(args, env) {
  let rest = args;
  let port;
  let dbPath;
  let staticDir;
  ({ value: port, rest } = takeOption(rest, '--port'));
  ({ value: dbPath, rest } = takeOption(rest, '--db'));
  ({ value: staticDir, rest } = takeOption(rest, '--static'));
  if (rest.length > 0) throw new Error(`Unknown option: ${rest[0]}`);
  return {
    port: port ? Number(port) : 4001,
    dbPath: dbPath ?? env.FLAMBE_LOCAL_DB ?? defaultDbPath(),
    staticDir,
  };
}

function parseExport(args, env) {
  let rest = args;
  let dbPath;
  ({ value: dbPath, rest } = takeOption(rest, '--db'));
  const positional = rest.filter(arg => !arg.startsWith('--'));
  const unknown = rest.filter(arg => arg.startsWith('--'));
  if (unknown.length > 0) throw new Error(`Unknown option: ${unknown[0]}`);
  if (positional.length > 1) throw new Error('Usage: flambe export [file] [--db <path>]');
  return {
    file: positional[0] ?? 'flambe-export.json',
    dbPath: dbPath ?? env.FLAMBE_LOCAL_DB ?? defaultDbPath(),
  };
}

function parseMessage(args) {
  let rest = args;
  let activityId;
  ({ value: activityId, rest } = takeOption(rest, '--activity'));
  const json = rest.includes('--json');
  rest = rest.filter(arg => arg !== '--json');
  const unknown = rest.filter(arg => arg.startsWith('--'));
  if (unknown.length > 0) throw new Error(`Unknown option: ${unknown[0]}`);
  const text = rest.join(' ').trim();
  if (!text) throw new Error('Usage: flambe message <text> [--activity <id>] [--json]');
  return { text, activityId, json };
}

function parseImport(args) {
  let rest = args;
  let url;
  let token;
  ({ value: url, rest } = takeOption(rest, '--url'));
  ({ value: token, rest } = takeOption(rest, '--token'));
  const positional = rest.filter(arg => !arg.startsWith('--'));
  const unknown = rest.filter(arg => arg.startsWith('--'));
  if (unknown.length > 0) throw new Error(`Unknown option: ${unknown[0]}`);
  if (positional.length !== 1) throw new Error('Usage: flambe import <file> [--url <url>] [--token <token>]');
  return { file: positional[0], url, token };
}

function formatAction(action) {
  if (action.type === 'create_child') return `created child ${action.activity_id} under ${action.parent_activity_id}`;
  if (action.type === 'update_activity') return `updated activity ${action.activity_id}`;
  if (action.type === 'reparent') return `reparented ${action.activity_id} under ${action.parent_activity_id}`;
  if (action.type === 'rename') return `renamed ${action.activity_id} to ${action.name}`;
  if (action.type === 'ask') return `asked about ${action.activity_id}`;
  if (action.type === 'resume_existing') return `resumed existing ${action.activity_id}`;
  if (action.type === 'resume_ancestor') return `resumed ancestor ${action.activity_id}`;
  if (action.type === 'no_op') return `left ${action.activity_id} as it was`;
  if (action.type === 'keep') return 'kept the recorded structure';
  if (action.type === 'skipped') return 'recorded the proposal; model review skipped';
  return JSON.stringify(action);
}

function formatReducerNote(note) {
  if (note.type === 'closed_descendants') {
    const list = note.closedDescendants.map(item => `${item.activityId} (${item.activityName})`).join(', ');
    return `reducer closed open descendants of ${note.activityId}: ${list}\n`;
  }
  if (note.type === 'agent_named') {
    return `reducer named this agent "${note.name}"; the CLI will use it from now on\n`;
  }
  if (note.type === 'command_result') {
    const lines = [];
    if (note.direction) lines.push(`direction\t${note.direction}\n`);
    if (note.reply) lines.push(`reply\t${note.reply}\n`);
    if (note.actionsApplied?.length) {
      lines.push(`actions\t${note.actionsApplied.map(formatAction).join('; ')}\n`);
    }
    return lines.join('');
  }
  if (note.type === 'start_reduced') {
    const parts = [];
    if (note.parentSource === 'inferred') parts.push(`nested ${note.activityId} under ${note.parentId}`);
    if (note.threadSource === 'parent' && note.requestedThreadId !== undefined && note.requestedThreadId !== note.threadId) {
      parts.push(`kept it on the parent's thread ${note.threadId}, not ${note.requestedThreadId}`);
    }
    if (note.categoriesSource === 'parent') parts.push('inherited the parent\'s categories');
    return parts.length > 0 ? `reducer ${parts.join('; ')}\n` : '';
  }
  return `reducer: ${JSON.stringify(note)}\n`;
}

export async function run(argv, { env = process.env, stdout = process.stdout, stderr = process.stderr, client, questionsPath } = {}) {
  const [command, ...args] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    stdout.write(`${usage}\n`);
    return;
  }

  if (command === 'serve') {
    const options = parseServe(args, env);
    const { listenLocal, printServeBanner } = await loadServe();
    const listening = await listenLocal(options);
    printServeBanner(listening, stdout);
    await new Promise((resolveClose, reject) => {
      listening.server.on('close', resolveClose);
      listening.server.on('error', reject);
    });
    return;
  }

  if (command === 'export') {
    const { file, dbPath } = parseExport(args, env);
    const { LocalStore } = await loadStore();
    const store = new LocalStore(dbPath);
    try {
      const bundle = store.exportBundle();
      const outPath = resolve(file);
      writeFileSync(outPath, `${JSON.stringify(bundle, null, 2)}\n`);
      stdout.write(`${outPath}\n`);
    } finally {
      store.close();
    }
    return;
  }

  if (command === 'import') {
    const { file, url, token } = parseImport(args);
    const bundle = JSON.parse(readFileSync(resolve(file), 'utf8'));
    const flambe = client ?? clientFromHostEnv({
      ...env,
      ...(url ? { FLAMBE_URL: url } : {}),
      ...(token ? { FLAMBE_API_TOKEN: token } : {}),
    });
    const result = await flambe.importBundle(bundle);
    stdout.write(`${JSON.stringify(result.data ?? result)}\n`);
    return;
  }

  // Reducer notes go to stderr so stdout stays a machine-friendly id.
  const questionFile = questionsPath ?? (client ? undefined : env.FLAMBE_QUESTIONS_PATH);
  const persistQuestions = Boolean(questionsPath) || !client;
  const traceId = env.FLAMBE_TRACE_ID;
  const pendingQuestion = !persistQuestions || command === 'message'
    ? undefined
    : readOpenQuestion(traceId, questionFile);
  if (pendingQuestion) {
    stderr.write(`reducer still waiting on activity ${pendingQuestion.activityId}: ${pendingQuestion.reply}\n`);
  }
  const onReducerNote = note => {
    const text = formatReducerNote(note);
    if (text) stderr.write(text);
    if (persistQuestions && note.type === 'command_result' && note.asked) {
      rememberQuestion(traceId, { activityId: note.activityId, reply: note.reply }, questionFile);
    }
  };
  const flambe = client ?? clientFromEnv(env, { onReducerNote });
  flambe.onReducerNote ??= onReducerNote;
  await flambe.flushQueue?.();

  if (command === 'start') {
    const activityId = await flambe.start(parseStart(args));
    stdout.write(`${activityId}\n`);
    return;
  }

  if (command === 'end') {
    const { activityId, message, force } = parseEnd(args);
    if (!activityId) throw new Error('Usage: flambe end <activity-id> [message] [--force]');
    const eventId = await flambe.end({ activityId, message, force });
    stdout.write(`${eventId}\n`);
    return;
  }

  if (command === 'suspend' || command === 'resume') {
    const [activityId, ...messageParts] = args;
    if (!activityId) throw new Error(`Usage: flambe ${command} <activity-id> [message]`);
    const eventId = await flambe[command]({ activityId, message: messageParts.join(' ') || undefined });
    stdout.write(`${eventId}\n`);
    return;
  }

  if (command === 'status') {
    const { activeOnly, suspendedOnly, json } = parseStatus(args);
    const status = await flambe.status({ activeOnly, suspendedOnly });

    if (json) {
      stdout.write(`${JSON.stringify(status)}\n`);
    } else {
      for (const activity of status.activities) {
        stdout.write(`${activity.id}\t${activity.path.join(' > ')}\t${activity.threadId}\t${activity.threadName ?? ''}\t${activity.categoryIds.join(',')}\t${activity.latestEvent.phase}\t${activity.latestEvent.timestamp}\n`);
      }
    }

    return;
  }

  if (command === 'threads') {
    const json = parseJson(args);
    const threads = await flambe.threads();
    if (json) stdout.write(`${JSON.stringify(threads)}\n`);
    else {
      for (const thread of threads) {
        stdout.write(`${thread.id}\t${thread.rank}\t${thread.name}${thread.default ? '\tdefault' : ''}\n`);
      }
    }
    return;
  }

  if (command === 'categories') {
    const json = parseJson(args);
    const categories = await flambe.categories();
    if (json) stdout.write(`${JSON.stringify(categories)}\n`);
    else {
      for (const category of categories) {
        stdout.write(`${category.id}\t${category.name}\t${category.color_background}\t${category.color_text}\n`);
      }
    }
    return;
  }

  if (command === 'ping') {
    const trace = await flambe.getTrace();
    stdout.write(`${trace.id}\t${trace.name}\n`);
    return;
  }

  if (command === 'whoami') {
    const json = parseJson(args);
    const me = await flambe.whoami();
    if (json) stdout.write(`${JSON.stringify(me)}\n`);
    else stdout.write(`${me.agentId}\t${me.name}\t${me.platform ?? ''}\n`);
    return;
  }

  if (command === 'observe') {
    const observationId = await flambe.observe(parseObserve(args));
    stdout.write(`${observationId}\n`);
    return;
  }

  if (command === 'message') {
    const { text, activityId, json } = parseMessage(args);
    const decision = await flambe.message({ activityId, text });
    if (persistQuestions) clearQuestion(traceId, questionFile);
    if (json) {
      stdout.write(`${JSON.stringify(decision)}\n`);
    } else {
      stdout.write(`activity\t${decision.activityId}\n`);
      stdout.write(`assessment\t${decision.assessment}\n`);
      stdout.write(`direction\t${decision.direction ?? '-'}\n`);
      stdout.write(`reply\t${decision.reply ?? '-'}\n`);
      const applied = (decision.actions_applied ?? []).filter(action => action.type !== 'no_op');
      if (applied.length > 0) {
        stdout.write(`actions\t${applied.map(formatAction).join('; ')}\n`);
      }
    }
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage}`);
}
