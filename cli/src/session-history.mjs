import { createReadStream } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

function summarize(harness, record) {
  const timestamp = Date.parse(record.timestamp);
  if (!Number.isFinite(timestamp)) return null;
  const detail = harness === 'codex' ? record.payload : record.message;
  const type = typeof record.type === 'string' ? record.type : 'unknown';
  const entry = { timestamp_ms: timestamp, type };
  if (typeof detail?.type === 'string') entry.kind = detail.type;
  if (typeof detail?.role === 'string') entry.role = detail.role;
  if (typeof detail?.name === 'string') entry.tool = detail.name;
  const content = detail?.content;
  if (Array.isArray(content)) {
    const tools = content.filter(item => ['tool_use', 'toolCall'].includes(item?.type))
      .map(item => item.name).filter(name => typeof name === 'string');
    if (tools.length) entry.tools = tools;
  }
  return entry;
}

/** Read locally supplied logs and return only timing and event metadata. */
export async function readSessionHistory(harness, path) {
  if (!['codex', 'claude', 'pi'].includes(harness)) throw new Error('Unknown session history format');
  const seen = new Set();
  const entries = [];
  const coverage_gaps = [];

  async function read(file, branch) {
    let malformed = 0;
    const lines = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
    try {
      for await (const line of lines) {
        if (!line.trim()) continue;
        let record;
        try { record = JSON.parse(line); }
        catch { malformed++; continue; }
        if (!record || typeof record !== 'object') { malformed++; continue; }
        const entry = summarize(harness, record);
        if (!entry) continue;
        const id = record.uuid;
        if (typeof id === 'string' && seen.has(id)) continue;
        if (typeof id === 'string') seen.add(id);
        entries.push({ branch, ...entry });
      }
    } catch (error) {
      if (branch === 'parent') throw error;
      coverage_gaps.push(`Could not read ${branch}`);
    }
    if (malformed) coverage_gaps.push(`${branch} contains ${malformed} unreadable records`);
  }

  await read(path, 'parent');
  if (harness === 'claude') {
    const childrenDir = join(dirname(path), basename(path, '.jsonl'), 'subagents');
    const children = await readdir(childrenDir, { withFileTypes: true }).catch(error => {
      if (error.code !== 'ENOENT') coverage_gaps.push('Could not list subagent records');
      return [];
    });
    for (const child of children.filter(entry => entry.isFile() && entry.name.endsWith('.jsonl')).sort((a, b) => a.name.localeCompare(b.name))) {
      await read(join(childrenDir, child.name), child.name);
    }
    if (entries.some(entry => entry.tools?.some(tool => ['Agent', 'Task'].includes(tool))) && children.length === 0) {
      coverage_gaps.push('Delegation appeared in the parent record but no subagent records were found');
    }
  } else {
    coverage_gaps.push('Subagent records must be supplied separately for this harness');
  }
  entries.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  return { harness, entries, coverage_gaps };
}
