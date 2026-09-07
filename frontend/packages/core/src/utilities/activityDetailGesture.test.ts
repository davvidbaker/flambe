import { describe, expect, it } from 'vitest';

import {
  isCoarsePointer,
  isHoverNone,
  isNarrowViewport,
  shouldOpenActivityDetailsOnSelect,
} from './activityDetailGesture';

describe('shouldOpenActivityDetailsOnSelect', () => {
  it('opens on coarse pointer, narrow viewport, or hover-none without a prior focus', () => {
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
    expect(shouldOpenActivityDetailsOnSelect({
      alreadyFocusedSameActivity: false,
      coarsePointer: false,
      narrowViewport: false,
      hoverNone: true,
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
  it('reads coarse pointer, hover-none, and narrow viewport from matchMedia', () => {
    expect(isCoarsePointer(() => ({ matches: true }))).toBe(true);
    expect(isCoarsePointer(() => ({ matches: false }))).toBe(false);
    expect(isHoverNone(() => ({ matches: true }))).toBe(true);
    expect(isNarrowViewport(() => ({ matches: true }))).toBe(true);
    expect(isNarrowViewport(() => ({ matches: false }))).toBe(false);
  });

  it('falls back to innerWidth when matchMedia does not match', () => {
    expect(isNarrowViewport(() => ({ matches: false }), 390)).toBe(true);
    expect(isNarrowViewport(() => ({ matches: false }), 1024)).toBe(false);
  });

  it('returns false when matchMedia is unavailable or throws', () => {
    expect(isCoarsePointer(undefined)).toBe(false);
    expect(isHoverNone(undefined)).toBe(false);
    expect(isNarrowViewport(undefined, undefined)).toBe(false);
    expect(isCoarsePointer(() => {
      throw new Error('unsupported');
    })).toBe(false);
  });
});
