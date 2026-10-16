import type { ActorLaneLayout } from './actorFlames';
import { blockLayoutKey, coalesceActorLaneChrome, type ActorLaneChrome } from './actorFlames';
import type { ProcessedActivity, TraceBlock } from './processTrace';

export const NAVIGATION_SETTLE_MS = 180;
export const NAVIGATION_REFLOW_MS = 280;

/** Interpolate complete wash envelopes instead of regrouping fractional rows,
 * which would turn a contiguous wash into stripes while its rows are moving. */
export function interpolateNavigationChrome(
  from: ActorLaneLayout, to: ActorLaneLayout, blocks: TraceBlock[], progress: number,
): ActorLaneChrome[] {
  const before = coalesceActorLaneChrome(from, blocks);
  const after = coalesceActorLaneChrome(to, blocks);
  const t = 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3;
  const mix = (a: number, b: number) => a + (b - a) * t;
  return after.map(chrome => {
    const old = before.find(candidate => candidate.actorKey === chrome.actorKey
      && candidate.threadId === chrome.threadId
      && candidate.parentLaneRootId === chrome.parentLaneRootId
      && candidate.depth === chrome.depth);
    if (!old) return chrome;
    const washRects = chrome.washRects.map((rect, index) => {
      const previous = chrome.washRects.length === 1
        ? { rowStart: old.rowStart, rowEnd: old.rowEnd }
        : old.washRects[Math.min(index, old.washRects.length - 1)] ?? rect;
      return { ...rect, rowStart: mix(previous.rowStart, rect.rowStart), rowEnd: mix(previous.rowEnd, rect.rowEnd) };
    });
    return {
      ...chrome,
      rowStart: mix(old.rowStart, chrome.rowStart),
      rowEnd: mix(old.rowEnd, chrome.rowEnd),
      washRects,
      washRowRanges: washRects.map(({ rowStart, rowEnd }) => ({ rowStart, rowEnd })),
    };
  });
}

/** Preserve actor bands during navigation. New blocks reuse their actor's rows;
 * band growth can push neighboring bands down, but never creates detached rows. */
export function retainNavigationRows(
  target: ActorLaneLayout,
  previous: ActorLaneLayout,
  blocks: TraceBlock[],
  activities: Record<string, ProcessedActivity>,
  history: TraceBlock[] = blocks,
): ActorLaneLayout {
  const flames = new Map(target.flames.map(flame => [String(flame.rootActivityId), flame]));
  const owner = (block: TraceBlock): string => {
    let root = target.rootIdByActivity[String(block.activity_id)];
    const seen = new Set<string>();
    while (root != null && !seen.has(String(root))) {
      seen.add(String(root));
      const parent = flames.get(String(root))?.parentActivityId;
      const parentRoot = parent == null ? null : target.rootIdByActivity[String(parent)];
      if (parentRoot == null) break;
      root = parentRoot;
    }
    return `${activities[String(block.activity_id)]?.thread_id}|${root == null ? 'human' : flames.get(String(root))?.actorKey}`;
  };
  const visible = new Set(blocks.map(blockLayoutKey));
  const groups = new Map<string, TraceBlock[]>();
  for (const block of history) {
    if (!visible.has(blockLayoutKey(block)) && previous.rowByBlock[blockLayoutKey(block)] === undefined) continue;
    const key = owner(block);
    groups.set(key, [...(groups.get(key) ?? []), block]);
  }
  const rowByBlock: Record<string, number> = {};
  const rowByActivity: Record<string, number> = {};
  const maxRowsByThread = { ...previous.maxRowsByThread };
  const bands: { thread: string; base: number; height: number; start: number; end: number }[] = [];
  const previousBase = (group: TraceBlock[]) => Math.min(...group.map(block => previous.rowByBlock[blockLayoutKey(block)] ?? Infinity));
  const ordered = [...groups.values()].sort((a, b) => Number(owner(b[0]!).endsWith('|human')) - Number(owner(a[0]!).endsWith('|human'))
    || previousBase(a) - previousBase(b)
    || Math.min(...a.map(block => block.startTime)) - Math.min(...b.map(block => block.startTime)));
  for (const group of ordered) {
    const thread = String(activities[String(group[0]!.activity_id)]?.thread_id);
    const known = group.filter(block => previous.rowByBlock[blockLayoutKey(block)] !== undefined);
    const oldBase = known.length ? previousBase(known) : undefined;
    const targetBase = Math.min(...group.map(block => target.rowByBlock[blockLayoutKey(block)] ?? Infinity));
    const local = new Map<string, number>(known.map(block => [blockLayoutKey(block), previous.rowByBlock[blockLayoutKey(block)]! - oldBase!]));
    const overlaps = (a: TraceBlock, b: TraceBlock) => a.startTime < (b.endTime ?? Infinity) && b.startTime < (a.endTime ?? Infinity);
    for (const block of group.slice().sort((a, b) =>
      (target.rowByBlock[blockLayoutKey(a)] ?? 0) - (target.rowByBlock[blockLayoutKey(b)] ?? 0))) {
      const key = blockLayoutKey(block);
      if (local.has(key)) continue;
      let row = Math.max(0, (target.rowByBlock[key] ?? targetBase) - targetBase);
      const parentId = activities[String(block.activity_id)]?.parent_id;
      const parent = group.find(candidate => candidate.activity_id === parentId
        && candidate.startTime <= block.startTime && (candidate.endTime ?? Infinity) >= block.startTime);
      if (parent && local.has(blockLayoutKey(parent))) row = Math.max(row, local.get(blockLayoutKey(parent))! + 1);
      // Revealing an ancestor must grow the band above its known descendants.
      const childRows = group.filter(other => activities[String(other.activity_id)]?.parent_id === block.activity_id)
        .map(other => local.get(blockLayoutKey(other))).filter((value): value is number => value !== undefined);
      const firstChild = Math.min(...childRows);
      if (firstChild <= row) {
        for (const [childKey, childRow] of local) {
          if (childRow >= firstChild) local.set(childKey, childRow + row - firstChild + 1);
        }
      }
      // Delegated children retain exclusive wash rows, even across idle gaps.
      while (group.some(other => local.get(blockLayoutKey(other)) === row
        && (activities[String(other.activity_id)]?.agent_id !== activities[String(block.activity_id)]?.agent_id
          || overlaps(other, block)))) row += 1;
      local.set(key, row);
    }
    const height = Math.max(...local.values()) + 1;
    const start = Math.min(...group.map(block => block.startTime));
    const end = Math.max(...group.map(block => block.endTime ?? Infinity));
    let base = oldBase ?? (owner(group[0]!).endsWith('|human') ? 0 : maxRowsByThread[thread] ?? 0);
    for (;;) {
      const collision = bands.find(band => band.thread === thread
        && start < band.end && band.start < end
        && base < band.base + band.height && band.base < base + height);
      if (!collision) break;
      base = collision.base + collision.height;
    }
    bands.push({ thread, base, height, start, end });
    maxRowsByThread[thread] = Math.max(maxRowsByThread[thread] ?? 0, base + height);
    for (const block of group) {
      rowByBlock[blockLayoutKey(block)] = base + local.get(blockLayoutKey(block))!;
      rowByActivity[String(block.activity_id)] = rowByBlock[blockLayoutKey(block)]!;
    }
  }
  const lanes = target.lanes.map(lane => {
    const rows = history.filter(block =>
      String(target.rootIdByActivity[String(block.activity_id)]) === String(lane.rootActivityId))
      .map(block => rowByBlock[blockLayoutKey(block)]).filter((row): row is number => row !== undefined);
    return rows.length ? { ...lane, rowStart: Math.min(...rows), rowEnd: Math.max(...rows) } : lane;
  });
  return { ...target, rowByBlock, rowByActivity, maxRowsByThread, lanes };
}

/** Interpolate the shared layout so bars, forks, chrome and thread offsets agree. */
export function interpolateNavigationLayout(
  from: ActorLaneLayout, to: ActorLaneLayout, progress: number,
): ActorLaneLayout {
  if (progress >= 1) return to;
  const t = 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3;
  const mix = (a: number | undefined, b: number) => (a ?? b) + (b - (a ?? b)) * t;
  const rows = (a: Record<string, number>, b: Record<string, number>) =>
    Object.fromEntries(Object.entries(b).map(([key, value]) => [key, mix(a[key], value)]));
  return {
    ...to,
    rowByBlock: rows(from.rowByBlock, to.rowByBlock),
    rowByActivity: rows(from.rowByActivity, to.rowByActivity),
    maxRowsByThread: rows(from.maxRowsByThread, {
      ...Object.fromEntries(Object.keys(from.maxRowsByThread).map(key => [key, 0])),
      ...to.maxRowsByThread,
    }),
    lanes: to.lanes.map(lane => {
      const old = from.lanes.find(candidate => candidate.rootActivityId === lane.rootActivityId);
      return { ...lane, rowStart: mix(old?.rowStart, lane.rowStart), rowEnd: mix(old?.rowEnd, lane.rowEnd) };
    }),
  };
}
