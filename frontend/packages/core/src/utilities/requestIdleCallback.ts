export type IdleDeadline = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

export type IdleCallback = (deadline: IdleDeadline) => void;

type IdleHandle = number;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleCallback, options?: { timeout?: number }) => IdleHandle;
  cancelIdleCallback?: (handle: IdleHandle) => void;
};

/**
 * Safari / Playwright WebKit historically omit `requestIdleCallback`.
 * Flambe schedules localStorage persistence from Redux and Timeline updates;
 * calling the missing global throws and leaves the post-login SPA blank.
 */
export function scheduleIdleCallback(
  callback: IdleCallback,
  options?: { timeout?: number },
  view: IdleWindow = window,
): IdleHandle {
  if (typeof view.requestIdleCallback === 'function') {
    return view.requestIdleCallback(callback, options);
  }

  const start = Date.now();
  return view.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
    });
  }, 1) as unknown as IdleHandle;
}

export function cancelScheduledIdleCallback(
  handle: IdleHandle,
  view: IdleWindow = window,
): void {
  if (typeof view.cancelIdleCallback === 'function') {
    view.cancelIdleCallback(handle);
    return;
  }
  view.clearTimeout(handle);
}
