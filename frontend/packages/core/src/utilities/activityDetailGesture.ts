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
  hoverNone?: boolean;
}): boolean {
  return (
    options.alreadyFocusedSameActivity
    || options.coarsePointer
    || options.narrowViewport
    || options.hoverNone === true
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

export function isHoverNone(
  matchMedia: ((query: string) => MediaQueryListLike) | undefined =
    typeof window !== 'undefined' ? window.matchMedia.bind(window) : undefined,
): boolean {
  if (typeof matchMedia !== 'function') return false;
  try {
    return matchMedia('(hover: none)').matches;
  } catch {
    return false;
  }
}

export function isNarrowViewport(
  matchMedia: ((query: string) => MediaQueryListLike) | undefined =
    typeof window !== 'undefined' ? window.matchMedia.bind(window) : undefined,
  innerWidth: number | undefined =
    typeof window !== 'undefined' ? window.innerWidth : undefined,
): boolean {
  if (typeof matchMedia === 'function') {
    try {
      if (matchMedia(`(max-width: ${MOBILE_LAYOUT_MAX_WIDTH_PX}px)`).matches) {
        return true;
      }
    } catch {
      // fall through to innerWidth
    }
  }
  return typeof innerWidth === 'number'
    && Number.isFinite(innerWidth)
    && innerWidth <= MOBILE_LAYOUT_MAX_WIDTH_PX;
}
