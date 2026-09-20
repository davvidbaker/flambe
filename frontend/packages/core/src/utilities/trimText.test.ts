import { describe, expect, it } from 'vitest';

import trimTextMiddle, { trimTextEnd } from './trimText';

function measureContext(charWidth = 8): CanvasRenderingContext2D {
  return {
    measureText: (text: string) => ({ width: text.length * charWidth }),
  } as CanvasRenderingContext2D;
}

describe('trimTextEnd', () => {
  it('keeps a name that already fits', () => {
    expect(trimTextEnd(measureContext(), 'Site control', 200)).toBe('Site control');
  });

  it('keeps the start of a long name instead of punching a hole in the middle', () => {
    const text = trimTextEnd(
      measureContext(),
      'OPSB letter of notification for the rebuild',
      18 * 8,
    );
    expect(text.startsWith('OPSB letter')).toBe(true);
    expect(text.endsWith('\u2026')).toBe(true);
    expect(text).not.toMatch(/….*rebuild/);
  });
});

describe('trimTextMiddle', () => {
  it('still keeps both ends for callers that want that', () => {
    const text = trimTextMiddle(measureContext(), 'abcdefghijklmnop', 9 * 8);
    expect(text).toContain('\u2026');
    expect(text.startsWith('a')).toBe(true);
    expect(text.endsWith('p')).toBe(true);
  });
});
