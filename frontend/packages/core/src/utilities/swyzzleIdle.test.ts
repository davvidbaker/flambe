import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  SWYZZLE_IDLE_MS,
  SwyzzleIdleGate,
  isSwyzzleClearKey,
  rememberSwyzzleClearKey,
  takeSwyzzleClearKey,
} from './swyzzleIdle';

describe('isSwyzzleClearKey', () => {
  it('matches Space and Escape', () => {
    expect(isSwyzzleClearKey({ code: 'Space', key: ' ' })).toBe(true);
    expect(isSwyzzleClearKey({ code: 'Escape', key: 'Escape' })).toBe(true);
    expect(isSwyzzleClearKey({ code: 'KeyA', key: 'a' })).toBe(false);
  });
});

describe('rememberSwyzzleClearKey', () => {
  it('remembers Space while showing so keyup can be swallowed after hide', () => {
    const consumed = new Set<string>();
    expect(rememberSwyzzleClearKey({ code: 'Space', key: ' ' }, true, consumed)).toBe(true);
    expect(consumed.has('Space')).toBe(true);
    expect(takeSwyzzleClearKey({ code: 'Space' }, consumed)).toBe(true);
    expect(consumed.size).toBe(0);
  });

  it('does not steal Space when the overlay is already hidden', () => {
    const consumed = new Set<string>();
    expect(rememberSwyzzleClearKey({ code: 'Space', key: ' ' }, false, consumed)).toBe(false);
    expect(takeSwyzzleClearKey({ code: 'Space' }, consumed)).toBe(false);
  });
});

describe('SwyzzleIdleGate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('schedules even when setTimeout throws if used as a method', () => {
    const hostSetTimeout = function (this: unknown, handler: () => void, timeout?: number) {
      if (this !== globalThis) throw new TypeError('Illegal invocation');
      return globalThis.setTimeout(handler, timeout);
    } as typeof setTimeout;
    const hostClearTimeout = function (this: unknown, handle?: Parameters<typeof clearTimeout>[0]) {
      if (this !== globalThis) throw new TypeError('Illegal invocation');
      globalThis.clearTimeout(handle);
    } as typeof clearTimeout;

    const gate = new SwyzzleIdleGate(50, vi.fn(), {
      setTimeout: hostSetTimeout,
      clearTimeout: hostClearTimeout,
    });
    expect(() => gate.start()).not.toThrow();
    gate.stop();
  });

  it('shows after the idle interval and hides on wake', () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const gate = new SwyzzleIdleGate(SWYZZLE_IDLE_MS, onChange);
    gate.start();
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(SWYZZLE_IDLE_MS - 1);
    gate.notePointerMove();
    vi.advanceTimersByTime(SWYZZLE_IDLE_MS - 1);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledWith(true);

    gate.notePointerMove();
    expect(onChange).toHaveBeenCalledTimes(1);

    gate.noteWake();
    expect(onChange).toHaveBeenLastCalledWith(false);

    vi.advanceTimersByTime(SWYZZLE_IDLE_MS);
    expect(onChange).toHaveBeenLastCalledWith(true);
    gate.stop();
  });
});
