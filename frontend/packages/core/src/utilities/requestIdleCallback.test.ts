import { afterEach, describe, expect, it, vi } from 'vitest';

import { cancelScheduledIdleCallback, scheduleIdleCallback } from './requestIdleCallback';

describe('scheduleIdleCallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('uses the native requestIdleCallback when present', () => {
    const native = vi.fn(() => 17);
    const view = {
      requestIdleCallback: native,
      setTimeout: vi.fn(),
    } as unknown as Window;

    const handle = scheduleIdleCallback(() => {}, { timeout: 100 }, view);
    expect(handle).toBe(17);
    expect(native).toHaveBeenCalledWith(expect.any(Function), { timeout: 100 });
    expect(view.setTimeout).not.toHaveBeenCalled();
  });

  it('falls back to setTimeout when requestIdleCallback is missing', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const view = {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    } as unknown as Window;

    scheduleIdleCallback(callback, undefined, view);
    expect(callback).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(callback).toHaveBeenCalledTimes(1);
    const deadline = callback.mock.calls[0][0];
    expect(deadline.didTimeout).toBe(false);
    expect(typeof deadline.timeRemaining()).toBe('number');
  });

  it('cancels a setTimeout fallback handle', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const view = {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    } as unknown as Window;

    const handle = scheduleIdleCallback(callback, undefined, view);
    cancelScheduledIdleCallback(handle, view);
    vi.runAllTimers();
    expect(callback).not.toHaveBeenCalled();
  });
});
