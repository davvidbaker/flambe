import { describe, expect, it } from 'vitest';

import {
  isCoarsePointer,
  isNarrowViewport,
  shouldOpenActivityDetailsOnSelect,
} from './activityDetailGesture';

describe('shouldOpenActivityDetailsOnSelect', () => {
  it('opens on coarse pointer or narrow viewport without a prior focus', () => {
    expect(shouldOpenActivityDetailsOnSelect({
      alreadyFocusedSameActivity: false,
      coarsePointer: true,
      narrowViewport: false,
    })).toBe(true);
    expect(shouldOpenActivityDetailsOnSelect({
      alreadyFocusedSameActivity: false,
      coarsePointer: false,
      narrowViewport: true,
    })).toBe(true);
  });

  it('opens on desktop when the same activity is already focused', () => {
    expect(shouldOpenActivityDetailsOnSelect({
      alreadyFocusedSameActivity: true,
      coarsePointer: false,
      narrowViewport: false,
    })).toBe(true);
  });

  it('does not open on a fresh desktop select', () => {
    expect(shouldOpenActivityDetailsOnSelect({
      alreadyFocusedSameActivity: false,
      coarsePointer: false,
      narrowViewport: false,
    })).toBe(false);
  });
});

describe('viewport / pointer helpers', () => {
  it('reads coarse pointer and narrow viewport from matchMedia', () => {
    expect(isCoarsePointer(() => ({ matches: true }))).toBe(true);
    expect(isCoarsePointer(() => ({ matches: false }))).toBe(false);
    expect(isNarrowViewport(() => ({ matches: true }))).toBe(true);
    expect(isNarrowViewport(() => ({ matches: false }))).toBe(false);
  });

  it('returns false when matchMedia is unavailable or throws', () => {
    expect(isCoarsePointer(undefined)).toBe(false);
    expect(isNarrowViewport(undefined)).toBe(false);
    expect(isCoarsePointer(() => {
      throw new Error('unsupported');
    })).toBe(false);
  });
});
