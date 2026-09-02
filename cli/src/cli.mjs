import { clientFromEnv } from './client.mjs';

const usage = `Usage:
  flambe start <activity name> [--description <text>] [--thread <id>] [--category <id>...] [--started-at <ISO-8601>]
  flambe end <activity-id> [message]
  flambe status [--active] [--json]
  flambe threads [--json]
  flambe categories [--json]
  flambe ping

Configuration:
  Loads .env from the current working directory.
  Existing shell environment variables take precedence.

Required values:
  FLAMBE_URL
  FLAMBE_API_TOKEN
  FLAMBE_TRACE_ID`;

function parseStart(args) {
  const nameParts = [];
  let description;
  let threadId;
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

  return { name: nameParts.join(' '), description, threadId, categoryIds, startedAt };
}

function parseStatus(args) {
  let activeOnly = false;
  let json = false;

  for (const arg of args) {
    if (arg === '--active') activeOnly = true;
    else if (arg === '--json') json = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return { activeOnly, json };
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

  if (command === 'start') {
    const activityId = await flambe.start(parseStart(args));
    stdout.write(`${activityId}\n`);
    return;
  }

  if (command === 'end') {
    const [activityId, ...messageParts] = args;
    if (!activityId) throw new Error('Usage: flambe end <activity-id> [message]');
    const eventId = await flambe.end({ activityId, message: messageParts.join(' ') || undefined });
    stdout.write(`${eventId}\n`);
    return;
  }

  if (command === 'status') {
    const { activeOnly, json } = parseStatus(args);
    const status = await flambe.status({ activeOnly });

    if (json) {
      stdout.write(`${JSON.stringify(status)}\n`);
    } else {
      for (const activity of status.activities) {
        stdout.write(`${activity.id}\t${activity.name}\t${activity.threadId}\t${activity.threadName ?? ''}\t${activity.categoryIds.join(',')}\t${activity.latestEvent.phase}\t${activity.latestEvent.timestamp}\n`);
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

  throw new Error(`Unknown command: ${command}\n\n${usage}`);
}
