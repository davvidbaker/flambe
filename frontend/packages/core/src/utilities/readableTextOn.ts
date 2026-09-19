import tinycolor from 'tinycolor2';

const BLACK = '#000000';
const WHITE = '#ffffff';

/**
 * Pick a label color that stays readable on `background`.
 * Prefer `preferred` when it already meets WCAG AA; otherwise black or white.
 */
export function readableTextOn(
  background: string,
  preferred?: string | null,
): string {
  if (
    preferred
    && tinycolor.isReadable(preferred, background, { level: 'AA', size: 'small' })
  ) {
    return preferred;
  }
  const picked = tinycolor.mostReadable(background, [BLACK, WHITE]);
  return picked ? picked.toHexString() : BLACK;
}
