import { clientFromEnv } from './client.mjs';

const usage = `Usage:
  flambe start <activity name> [--description <text>] [--thread <id>]
  flambe end <activity-id> [message]
  flambe ping

Environment:
  FLAMBE_URL
  FLAMBE_API_TOKEN
  FLAMBE_TRACE_ID`;

function parseStart(args) {
  const nameParts = [];
  let description;
  let threadId;

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
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      nameParts.push(arg);
    }
  }

  return { name: nameParts.join(' '), description, threadId };
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

  if (command === 'ping') {
    const trace = await flambe.getTrace();
    stdout.write(`${trace.id}\t${trace.name}\n`);
    return;
  }

  throw new Error(`Unknown command: ${command}\n\n${usage}`);
}
