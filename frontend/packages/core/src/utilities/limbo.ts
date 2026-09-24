import type { ProcessedActivity } from './processTrace';

export interface LimboItem {
  activity: ProcessedActivity;
  weighted: boolean;
}

/** Limbo is an untimed unstarted activity, or one that is currently suspended. */
export function limboItems(activities: Record<string, ProcessedActivity>): LimboItem[] {
  return Object.values(activities)
    .filter(activity =>
      activity.status === 'suspended'
      || (activity.status === 'unstarted' && activity.scheduled_start == null && activity.scheduled_end == null))
    .map(activity => ({
      activity,
      weighted: typeof activity.weight === 'number' && Number.isFinite(activity.weight),
    }))
    .sort((left, right) => String(left.activity.name).localeCompare(String(right.activity.name)));
}

export interface HexPlacement {
  id: string;
  radius: number;
  x: number;
  y: number;
}

/**
 * Static honeycomb. Size comes from weight. No simulation, so a hover cannot
 * restart a per-hex charge loop.
 */
export function hexPlacements(items: LimboItem[], originX = 0, originY = 0): HexPlacement[] {
  const weighted = items.filter(item => item.weighted);
  if (weighted.length === 0) return [];

  const maxWeight = Math.max(...weighted.map(item => item.activity.weight ?? 1));
  const radii = weighted.map(item => 14 + 22 * Math.sqrt((item.activity.weight ?? 1) / maxWeight));
  const gap = Math.max(...radii) * 2.15;

  return weighted.map((item, index) => {
    const { q, r } = spiral(index);
    return {
      id: String(item.activity.id),
      radius: radii[index],
      x: originX + gap * (q + r / 2),
      y: originY + gap * (r * Math.sqrt(3) / 2),
    };
  });
}

function spiral(index: number): { q: number; r: number } {
  if (index === 0) return { q: 0, r: 0 };
  let q = 0;
  let r = 0;
  let step = 1;
  const directions = [
    [1, 0],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [0, -1],
    [1, -1],
  ] as const;
  let placed = 0;
  while (placed < index) {
    for (const [dq, dr] of directions) {
      for (let i = 0; i < step && placed < index; i += 1) {
        q += dq;
        r += dr;
        placed += 1;
      }
    }
    step += 1;
  }
  return { q, r };
}
