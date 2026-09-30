export const SWYZZLE_IDLE_SECONDS_DEFAULT = 7;
export const SWYZZLE_IDLE_SECONDS_MIN = 1;
export const SWYZZLE_IDLE_SECONDS_MAX = 60;
export const SWYZZLE_IDLE_MS = SWYZZLE_IDLE_SECONDS_DEFAULT * 1000;

export function clampSwyzzleIdleSeconds(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return SWYZZLE_IDLE_SECONDS_DEFAULT;
  return Math.min(
    SWYZZLE_IDLE_SECONDS_MAX,
    Math.max(SWYZZLE_IDLE_SECONDS_MIN, Math.round(parsed)),
  );
}

export function swyzzleIdleMs(seconds: unknown): number {
  return clampSwyzzleIdleSeconds(seconds) * 1000;
}

export function isSwyzzleClearKey(event: Pick<KeyboardEvent, 'code' | 'key'>): boolean {
  return event.code === 'Space' || event.key === ' ' || event.key === 'Escape';
}

/**
 * Remember Space/Escape on keydown so the matching keyup can be swallowed
 * after the overlay hides. Otherwise Trace still opens activity details on Space.
 */
export function rememberSwyzzleClearKey(
  event: Pick<KeyboardEvent, 'code' | 'key'>,
  showing: boolean,
  consumed: Set<string>,
): boolean {
  if (!showing || !isSwyzzleClearKey(event)) return false;
  consumed.add(event.code);
  return true;
}

export function takeSwyzzleClearKey(
  event: Pick<KeyboardEvent, 'code'>,
  consumed: Set<string>,
): boolean {
  if (!consumed.has(event.code)) return false;
  consumed.delete(event.code);
  return true;
}

const TEXT_INPUT_TYPES = new Set([
  'text',
  'password',
  'search',
  'email',
  'url',
  'tel',
  'number',
  '',
]);

function tagNameOf(target: object): string {
  if (!('tagName' in target)) return '';
  return String((target as { tagName?: string }).tagName ?? '').toUpperCase();
}

/** True when keyboard shortcuts must not steal keystrokes from a text field. */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (target == null || typeof target !== 'object') return false;

  if (typeof HTMLTextAreaElement !== 'undefined' && target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (typeof HTMLSelectElement !== 'undefined' && target instanceof HTMLSelectElement) {
    return true;
  }
  if (typeof HTMLInputElement !== 'undefined' && target instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has(target.type);
  }

  const tag = tagNameOf(target);
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const type = 'type' in target
      ? String((target as { type?: string }).type ?? 'text')
      : 'text';
    return TEXT_INPUT_TYPES.has(type);
  }

  if ('isContentEditable' in target && Boolean((target as HTMLElement).isContentEditable)) {
    return true;
  }

  if (typeof Element !== 'undefined' && target instanceof Element) {
    return Boolean(
      target.closest(
        'input:not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]):not([type="reset"]):not([type="file"]), textarea, select, [contenteditable="true"]',
      ),
    );
  }

  return false;
}

/** Prefer this for document-level shortcut handlers: target or focus may disagree. */
export function isShortcutBlockedByTextEntry(
  event: Pick<KeyboardEvent, 'target'>,
  activeElement: EventTarget | null = typeof document === 'undefined'
    ? null
    : document.activeElement,
): boolean {
  return isTextEntryTarget(event.target) || isTextEntryTarget(activeElement);
}

type TimeoutHandle = ReturnType<typeof setTimeout>;

export class SwyzzleIdleGate {
  showing = false;
  private timer: TimeoutHandle | null = null;

  constructor(
    private readonly idleMs: number,
    private readonly onChange: (showing: boolean) => void,
    private readonly timeouts: {
      setTimeout: (handler: () => void, timeout?: number) => TimeoutHandle;
      clearTimeout: (handle: TimeoutHandle) => void;
    } = {
      // Call through globalThis so browser host setTimeout is not invoked as a method.
      setTimeout: (handler, timeout) => globalThis.setTimeout(handler, timeout),
      clearTimeout: handle => globalThis.clearTimeout(handle),
    },
  ) {}

  start(): void {
    this.schedule();
  }

  stop(): void {
    this.clearTimer();
    this.setShowing(false);
  }

  /** Pointer motion while waiting restarts the timer; while showing it stirs the melt. */
  notePointerMove(): void {
    if (this.showing) return;
    this.schedule();
  }

  /** Any other user activity hides the overlay and starts a new idle wait. */
  noteWake(): void {
    this.setShowing(false);
    this.schedule();
  }

  private schedule(): void {
    this.clearTimer();
    this.timer = this.timeouts.setTimeout.call(globalThis, () => {
      this.timer = null;
      this.setShowing(true);
    }, this.idleMs);
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    this.timeouts.clearTimeout.call(globalThis, this.timer);
    this.timer = null;
  }

  private setShowing(next: boolean): void {
    if (this.showing === next) return;
    this.showing = next;
    this.onChange(next);
  }
}
