export const SWYZZLE_IDLE_MS = 7_000;

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

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === 'undefined') return false;
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) {
    return TEXT_INPUT_TYPES.has(target.type);
  }
  return false;
}

type TimeoutHandle = ReturnType<typeof setTimeout>;

export class SwyzzleIdleGate {
  showing = false;
  private timer: TimeoutHandle | null = null;

  constructor(
    private readonly idleMs: number,
    private readonly onChange: (showing: boolean) => void,
    private readonly timeouts: {
      setTimeout: typeof setTimeout;
      clearTimeout: typeof clearTimeout;
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
