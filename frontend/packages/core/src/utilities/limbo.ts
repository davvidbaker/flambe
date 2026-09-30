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

/** x and y are the hex centre; radius is centre to vertex of a pointy-top hex. */
export interface HexPlacement {
  id: string;
  radius: number;
  x: number;
  y: number;
}

export const MIN_HEX_RADIUS = 30;
export const MAX_HEX_RADIUS = 56;
const HEX_SPACING = 4;

export function hexHalfWidth(radius: number): number {
  return radius * Math.sqrt(3) / 2;
}

/**
 * Static honeycomb, heaviest in the middle. Size comes from weight. No
 * simulation, so a hover cannot restart a per-hex charge loop.
 */
export function hexPlacements(items: LimboItem[], originX = 0, originY = 0): HexPlacement[] {
  const weighted = items
    .filter(item => item.weighted)
    .sort((left, right) => (right.activity.weight ?? 0) - (left.activity.weight ?? 0));
  if (weighted.length === 0) return [];

  const maxWeight = Math.max(...weighted.map(item => item.activity.weight ?? 1));
  const radii = weighted.map(item =>
    MIN_HEX_RADIUS
    + (MAX_HEX_RADIUS - MIN_HEX_RADIUS) * Math.sqrt(Math.max(0, item.activity.weight ?? 1) / (maxWeight || 1)));
  const gap = 2 * hexHalfWidth(Math.max(...radii)) + HEX_SPACING;

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

const DIRECTIONS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
] as const;

/** Axial cell for the index-th hex, walking ring by ring outward from the centre. */
function spiral(index: number): { q: number; r: number } {
  if (index === 0) return { q: 0, r: 0 };
  let ring = 1;
  let offset = index - 1;
  while (offset >= 6 * ring) {
    offset -= 6 * ring;
    ring += 1;
  }
  let q = DIRECTIONS[4][0] * ring;
  let r = DIRECTIONS[4][1] * ring;
  const side = Math.floor(offset / ring);
  for (let s = 0; s < side; s += 1) {
    q += DIRECTIONS[s][0] * ring;
    r += DIRECTIONS[s][1] * ring;
  }
  const steps = offset % ring;
  q += DIRECTIONS[side][0] * steps;
  r += DIRECTIONS[side][1] * steps;
  return { q, r };
}
