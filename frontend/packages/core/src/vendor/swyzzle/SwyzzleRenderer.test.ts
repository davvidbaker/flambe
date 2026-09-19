import { describe, expect, it } from 'vitest';

import { SWYZZLE_EFFECTS, SwyzzleRenderer } from './SwyzzleRenderer';

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
});
