import { describe, expect, it } from 'vitest';
import { shade } from 'polished';
import tinycolor from 'tinycolor2';

import { readableTextOn } from './readableTextOn';

describe('readableTextOn', () => {
  it('keeps a preferred color that already contrasts', () => {
    expect(readableTextOn('#efc360', '#000000')).toBe('#000000');
    expect(readableTextOn('#8b6125', '#ffffff')).toBe('#ffffff');
  });

  it('rejects white on the light purple used in examples', () => {
    expect(
      tinycolor.isReadable('#ffffff', '#a78bfa', { level: 'AA', size: 'small' }),
    ).toBe(false);
    expect(readableTextOn('#a78bfa', '#ffffff')).toBe('#000000');
  });

  it('switches to white after darkerAsWeGoDown shade makes black fail', () => {
    const nested = shade(0.7, '#efc360');
    expect(
      tinycolor.isReadable('#000000', nested, { level: 'AA', size: 'small' }),
    ).toBe(false);
    expect(readableTextOn(nested, '#000000')).toBe('#ffffff');
  });
});
