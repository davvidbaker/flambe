import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SWYZZLE_EFFECT,
  resolveSwyzzleEffect,
  SWYZZLE_EFFECTS,
  SwyzzleRenderer,
} from './SwyzzleRenderer';

describe('SwyzzleRenderer', () => {
  it('publishes the preserved desktop effects', () => {
    expect(SwyzzleRenderer.effects).toEqual([
      'basic',
      'swyzzle',
      'fluid',
      'og',
      'blendmelt',
      'rgb',
      'subtle',
      'gameOfStrife',
    ]);
    expect(SWYZZLE_EFFECTS).toEqual(SwyzzleRenderer.effects);
  });

  it('resolves unknown effect names to the default shader', () => {
    expect(resolveSwyzzleEffect('fluid')).toBe('fluid');
    expect(resolveSwyzzleEffect('gameOfStrife')).toBe('gameOfStrife');
    expect(resolveSwyzzleEffect('not-a-shader')).toBe(DEFAULT_SWYZZLE_EFFECT);
    expect(resolveSwyzzleEffect(undefined)).toBe(DEFAULT_SWYZZLE_EFFECT);
  });
});
