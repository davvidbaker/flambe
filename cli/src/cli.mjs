import { clientFromEnv } from './client.mjs';

const usage = `Usage:
  flambe start <activity name> [--description <text>] [--thread <id>] [--parent <id> | --root] [--category <id>...] [--started-at <ISO-8601>]
  flambe end <activity-id> [message] [--force]
  flambe suspend <activity-id> [message]
  flambe resume <activity-id> [message]
  flambe status [--active | --suspended] [--json]
  flambe threads [--json]
  flambe categories [--json]
  flambe ping
  flambe observe <kind> <value> [--unit <unit>] [--on <YYYY-MM-DD>] [--payload <json>] [--at <ISO-8601>]

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
  FLAMBE_AGENT_NAME  Display name for this agent's lane. Do not put this in .env.
  FLAMBE_QUEUE_PATH  Local offline queue path (default: ~/.flambe/event-queue.json)`;

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

export async function run(argv, { env = process.env, stdout = process.stdout, client } = {}) {
  const [command, ...args] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    stdout.write(`${usage}\n`);
    return;
  }

  const flambe = client ?? clientFromEnv(env);
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

  if (command === 'observe') {
    const observationId = await flambe.observe(parseObserve(args));
    stdout.write(`${observationId}\n`);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage}`);
}
