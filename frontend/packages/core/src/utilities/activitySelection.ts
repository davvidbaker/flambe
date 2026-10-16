import type { EntityId } from '../types/ids';
import { isCoarsePointer, isHoverNone, isNarrowViewport } from './activityDetailGesture';

export const supportsActivitySelection = () => {
  if (typeof window === 'undefined') return false;
  const matchMedia = typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined;
  return !isCoarsePointer(matchMedia) && !isHoverNone(matchMedia)
    && !isNarrowViewport(matchMedia, window.innerWidth);
};

export interface SelectionRect { x: number; y: number; width: number; height: number }
export function activitiesInRectangle(
  rectangle: SelectionRect,
  blocks: Array<SelectionRect & { activityId: EntityId }>,
): string[] {
  return [...new Set(blocks.filter(block =>
    block.width > 0 && block.height > 0
    && block.x < rectangle.x + rectangle.width
    && block.x + block.width > rectangle.x
    && block.y < rectangle.y + rectangle.height
    && block.y + block.height > rectangle.y,
  ).map(block => String(block.activityId)))];
}
