/** Matches the SPA’s existing phone layout breakpoint (`max-width: 640px`). */
export const MOBILE_LAYOUT_MAX_WIDTH_PX = 640;

export type MediaQueryListLike = { matches: boolean };

/**
 * Whether selecting a flame-chart block should also open activity details.
 * Phone / coarse-pointer: first tap opens (Space / Commander are unavailable).
 * Desktop: second select of the already-focused activity opens details.
 */
export function shouldOpenActivityDetailsOnSelect(options: {
  alreadyFocusedSameActivity: boolean;
  coarsePointer: boolean;
  narrowViewport: boolean;
}): boolean {
  return (
    options.alreadyFocusedSameActivity
    || options.coarsePointer
    || options.narrowViewport
  );
}

export function isCoarsePointer(
  matchMedia: ((query: string) => MediaQueryListLike) | undefined =
    typeof window !== 'undefined' ? window.matchMedia.bind(window) : undefined,
): boolean {
  if (typeof matchMedia !== 'function') return false;
  try {
    return matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

export function isNarrowViewport(
  matchMedia: ((query: string) => MediaQueryListLike) | undefined =
    typeof window !== 'undefined' ? window.matchMedia.bind(window) : undefined,
): boolean {
  if (typeof matchMedia !== 'function') return false;
  try {
    return matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH_PX}px)`).matches;
  } catch {
    return false;
  }
}
