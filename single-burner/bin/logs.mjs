import { closeSync, fstatSync, openSync, readSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { StringDecoder } from 'node:string_decoder';

export const logsUsage = `Usage: flambe-single-burner logs [options]

Show the last 30 useful events, then follow the log. Does not start a server.

Options:
  --log <path>  Diagnostic log (default: <db path>.log)
  --db <path>   Database whose log to read (default: ~/.flambe/local.sqlite)
  --lines <n>   Number of recent displayed events (default: 30; 0 = only new events)
  --no-follow   Print recent events and exit
  --follow      Keep watching (the default); follows rotation and waits for creation
  --json        Show raw JSON records, including intermediate command stages
  --verbose     Show all stages and full request, agent, and review identifiers
  --help        Show this help
`;

export function parseLogsArgs(args) {
  let dbPath = join(homedir(), '.flambe', 'local.sqlite');
  let logPath;
  const options = { lines: 30, follow: true, json: false, verbose: false };
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--follow') options.follow = true;
    else if (arg === '--no-follow') options.follow = false;
    else if (arg === '--json') options.json = true;
    else if (arg === '--verbose') options.verbose = true;
    else if (['--db', '--log', '--lines'].includes(arg)) {
      const value = args[++index];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      if (arg === '--db') dbPath = value;
      if (arg === '--log') logPath = value;
      if (arg === '--lines') {
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > 10000) {
          throw new Error('--lines must be an integer from 0 to 10000');
        }
        options.lines = Number(value);
      }
    } else throw new Error(`Unknown logs option: ${arg}`);
  }
  return { ...options, path: resolve(logPath ?? `${dbPath}.log`) };
}

const safe = value => String(value).replace(/[\x00-\x1f\x7f-\x9f]/g, ' ');
const identifier = value => value == null ? '-' : `#${safe(value)}`;

/** Render 0.1.8 JSONL without opening its database or needing the server to be up. */
export function formatLogRecord(record, { verbose = false } = {}) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return null;
  const time = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(record.timestamp ?? '')
    ? record.timestamp.slice(11, 19) : '--:--:--';
  if (record.event === 'server.started') {
    return `${time} SERVER  v${safe(record.app_version ?? '?')} (engine ${safe(record.engine_version ?? '?')})  reducer=${safe(record.reducer_mode ?? '?')}`
      + (record.reducer_mode === 'off' ? '  WARNING: unspecified roots use the first-ranked thread' : '');
  }
  const completed = record.event === 'command.completed';
  const failed = record.event === 'command.failed';
  if (!verbose && (!completed && !failed || record.command === 'status' && !failed)) return null;
  if (!['command.received', 'command.recorded', 'command.completed', 'command.failed'].includes(record.event)) return null;
  const label = safe(record.command ?? '?').toUpperCase().padEnd(7);
  const parts = [`${time} ${label} ${identifier(record.activity_id)}`];
  if (failed) {
    parts.push(`FAILED: ${safe(record.error_code ?? 'UNKNOWN')}`);
    // 0.1.8 failures can lack activity/review ids. Do not guess the activity.
    if (!verbose && record.request_id) parts.push(`request=${safe(record.request_id).slice(0, 8)}`);
    if (!verbose && record.agent_id) parts.push(`agent=…${safe(record.agent_id).slice(-8)}`);
  } else {
    if (record.selected_thread_id != null) parts.push(`→ thread ${safe(record.selected_thread_id)}`);
    if (record.thread_source === 'default') parts.push('(fallback)');
    if (record.thread_source === 'parent') parts.push(`inherited from parent ${identifier(record.selected_parent_id)}`);
    else if (record.selected_parent_id != null) parts.push(`parent=${identifier(record.selected_parent_id)}`);
    if (record.thread_source === 'request') parts.push('(requested)');
    if (record.thread_source === 'existing_activity') parts.push('(reused existing activity)');
    if (record.thread_source === 'review') parts.push('(AI placement)');
    if (record.requested_thread_id != null && record.selected_thread_id != null
      && record.requested_thread_id !== record.selected_thread_id) parts.push(`requested thread ${safe(record.requested_thread_id)}`);
    if (record.review_status === 'awaiting_decision') parts.push(record.thread_selection_requested
      ? 'WAITING for thread-selection review' : 'WAITING for work-AI review');
    else if (record.review_status === 'failed') parts.push(`REVIEW FAILED: ${safe(record.review_error_code ?? 'UNKNOWN')}`);
    else if (record.review_status === 'available') parts.push('review available on request');
    else if (record.review_status === 'completed') parts.push('review completed'
      + ((record.actions_applied ?? []).length ? '' : '; no actions applied'));
    if (record.direction && record.direction !== 'continue') parts.push(`direction=${safe(record.direction)}`);
  }
  if ((failed ? record.error_code : record.review_error_code) === 'REDUCER_CODEX_AUTH_REQUIRED') {
    parts.push('Reducer Codex login is missing or expired. Run the dedicated-profile login command shown in the FSB server terminal, then retry the review.');
  }
  if (verbose) {
    parts.push(`[${safe(record.event)}]`, `request=${safe(record.request_id ?? '-')}`,
      `agent=${safe(record.agent_id ?? '-')}`, `review=${safe(record.review_id ?? '-')}`);
    if (Array.isArray(record.rules_fired) && record.rules_fired.length) parts.push(`rules=${record.rules_fired.map(safe).join(',')}`);
  }
  return parts.join('  ');
}

/** Poll by file identity and byte offset; drain the old file before following rotation. */
export function createLogReader(path, { line, warn = () => {} }) {
  let fd = null;
  let identity = null;
  let offset = 0;
  let decoder = new StringDecoder('utf8');
  let pending = '';
  let discard = false;
  const buffer = Buffer.alloc(64 * 1024);
  const reset = () => { offset = 0; pending = ''; discard = false; decoder = new StringDecoder('utf8'); };
  const drain = () => {
    let count;
    while ((count = readSync(fd, buffer, 0, buffer.length, offset)) > 0) {
      offset += count;
      const pieces = decoder.write(buffer.subarray(0, count)).split('\n');
      for (let index = 0; index < pieces.length; index++) {
        if (!discard) pending += pieces[index];
        if (pending.length > 1024 * 1024) {
          pending = ''; discard = true;
          warn('Skipping oversized diagnostic log record.');
        }
        if (index < pieces.length - 1) {
          if (!discard && pending.trim()) line(pending);
          pending = ''; discard = false;
        }
      }
    }
  };
  return {
    poll() {
      if (fd !== null) {
        if (fstatSync(fd).size < offset) reset(); // copy-truncate
        drain();
      }
      let current;
      try { current = statSync(path); }
      catch (error) { if (error.code === 'ENOENT') return false; throw error; }
      if (!current.isFile()) throw new Error('Diagnostic log path is not a regular file.');
      if (fd !== null && current.dev === identity.dev && current.ino === identity.ino) return true;
      if (fd !== null) { drain(); closeSync(fd); }
      fd = null;
      reset();
      try { fd = openSync(path, 'r'); }
      catch (error) { if (error.code === 'ENOENT') return false; throw error; }
      identity = fstatSync(fd);
      drain();
      return true;
    },
    close() { if (fd !== null) closeSync(fd); fd = null; },
  };
}

export function viewLogs(options, { stdout = process.stdout, stderr = process.stderr, intervalMs = 250 } = {}) {
  let initial = true;
  const recent = [];
  let malformed = false;
  const warn = message => stderr.write(`${message}\n`);
  const reader = createLogReader(options.path, { warn, line: raw => {
    let record;
    try { record = JSON.parse(raw); }
    catch {
      if (!malformed) warn('Skipping malformed diagnostic log records (use the original file for inspection).');
      malformed = true;
      return;
    }
    const text = options.json ? raw : formatLogRecord(record, options);
    if (text == null) return;
    if (initial) {
      if (options.lines > 0) {
        recent.push(text);
        if (recent.length > options.lines) recent.shift();
      }
    } else stdout.write(`${text}\n`);
  } });
  try {
    const exists = reader.poll();
    if (!exists && !options.follow) throw new Error(`No diagnostic log found at ${options.path}. Start Single Burner first or pass --log <path>.`);
    for (const text of recent) stdout.write(`${text}\n`);
    initial = false;
    if (!options.follow) { reader.close(); return { close() {} }; }
    warn(`Following ${options.path}${exists ? '' : ' (waiting for the log to be created)'}. Ctrl+C to stop.`);
    const timer = setInterval(() => {
      try { reader.poll(); }
      catch {
        clearInterval(timer); reader.close();
        warn('Unable to read diagnostic log; check the path and permissions.');
        process.exitCode = 1;
      }
    }, intervalMs);
    return { close() { clearInterval(timer); reader.close(); } };
  } catch (error) { reader.close(); throw error; }
}
