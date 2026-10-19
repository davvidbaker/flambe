import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Timeline from './Timeline';
import { App } from '../pages/Trace';

beforeEach(() => {
  vi.stubGlobal('window', { localStorage: { getItem: () => null }, setTimeout: vi.fn(), matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('document', { activeElement: null });
});
afterEach(() => vi.unstubAllGlobals());
const key = (overrides = {}) => ({ key: 'z', code: 'KeyZ', metaKey: false,
  ctrlKey: false, altKey: false, shiftKey: false, preventDefault: vi.fn(), target: null,
  ...overrides } as unknown as KeyboardEvent);
function timeline() {
  const instance = new Timeline({ addCommand: vi.fn(), minTime: 0, maxTime: 1000 } as never);
  instance.setState = ((updates: object) => { instance.state = { ...instance.state, ...updates }; }) as never;
  instance.zoomTo = vi.fn();
  instance.scheduleZoomChordTimeout = vi.fn();
  return instance;
}

describe('undo/redo and zoom keyboard separation', () => {
  it.each([{ metaKey: true }, { ctrlKey: true }, { metaKey: true, shiftKey: true, key: 'Z' },
    { ctrlKey: true, shiftKey: true, key: 'Z' }])('never starts zoom after %o even if modifiers are released first', modifiers => {
    const instance = timeline();
    instance.onTimelineKeyDown(key(modifiers));
    instance.onTimelineKeyUp(key({ key: 'Meta', code: 'MetaLeft' }));
    instance.onTimelineKeyUp(key());
    expect(instance.state.composingZoomChord).toBe(false);
    expect(instance.zoomTo).not.toHaveBeenCalled();
    expect(instance.scheduleZoomChordTimeout).not.toHaveBeenCalled();
  });
  it('cancels an already composing zoom chord when undo or redo starts', () => {
    const instance = timeline();
    instance.onTimelineKeyUp(key());
    expect(instance.state.composingZoomChord).toBe(true);
    instance.onTimelineKeyDown(key({ metaKey: true, shiftKey: true, key: 'Z' }));
    instance.onTimelineKeyUp(key());
    instance.onTimelineKeyUp(key({ key: 'd', code: 'KeyD' }));
    expect(instance.state.composingZoomChord).toBe(false);
    expect(instance.zoomTo).not.toHaveBeenCalled();
  });
  it('still supports plain Z then D and plain N', () => {
    const instance = timeline();
    instance.onTimelineKeyDown(key());
    instance.onTimelineKeyUp(key());
    expect(instance.state.composingZoomChord).toBe(true);
    instance.onTimelineKeyUp(key({ key: 'd', code: 'KeyD' }));
    expect(instance.zoomTo).toHaveBeenCalledWith('day');
    instance.state.composingZoomChord = false;
    instance.onTimelineKeyUp(key({ key: 'n', code: 'KeyN' }));
    expect(instance.zoomTo).toHaveBeenCalledWith('now');
  });
  it.each([
    [{ metaKey: true }, 'undo'], [{ ctrlKey: true }, 'undo'],
    [{ metaKey: true, shiftKey: true, key: 'Z' }, 'redo'],
    [{ ctrlKey: true, shiftKey: true, key: 'Z' }, 'redo'],
  ])('routes %o to %s', (modifiers, direction) => {
    const props = { fetchUser: vi.fn(), routeParams: {}, user: { id: 1 },
      undoLastCommand: vi.fn(), redoLastCommand: vi.fn() };
    const app = new App(props as never);
    const handler = app.render().props.eventListeners.find(([type]: [string]) => type === 'keydown')[1];
    const event = key(modifiers);
    handler(event);
    expect(props.undoLastCommand).toHaveBeenCalledTimes(direction === 'undo' ? 1 : 0);
    expect(props.redoLastCommand).toHaveBeenCalledTimes(direction === 'redo' ? 1 : 0);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
  it('leaves native text-field undo/redo alone', () => {
    const props = { fetchUser: vi.fn(), routeParams: {}, user: { id: 1 },
      undoLastCommand: vi.fn(), redoLastCommand: vi.fn() };
    const app = new App(props as never);
    const handler = app.render().props.eventListeners.find(([type]: [string]) => type === 'keydown')[1];
    const event = key({ metaKey: true, shiftKey: true, target: { tagName: 'INPUT', type: 'text' } });
    handler(event);
    expect(props.redoLastCommand).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
