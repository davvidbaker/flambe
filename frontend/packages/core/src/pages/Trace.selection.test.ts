import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './Trace';
import { ACTIVITIES_BULK_DELETE, ACTIVITIES_BULK_MOVE } from '../reducers/activitySelection';

beforeEach(() => {
  vi.stubGlobal('window', { innerWidth: 1280, matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('document', { activeElement: null });
});
afterEach(() => vi.unstubAllGlobals());

const createApp = () => new App({
  fetchUser: vi.fn(), routeParams: {}, user: { id: 1 },
  activities: { 1: { id: 1 }, 2: { id: 2 } }, activitySelection: ['1', '2'],
} as never);
const bulkActions = [ACTIVITIES_BULK_MOVE, ACTIVITIES_BULK_DELETE];

describe('selection command palette', () => {
  it('offers bulk actions for the selected set and suppresses single-activity commands', () => {
    const commands = createApp().getCommands({ type: 'activity', activity_id: 1, activityStatus: 'active' });
    expect(commands.slice(0, 2).map(command => command.action)).toEqual(bulkActions);
    expect(commands.some(command => command.copy === 'just end it')).toBe(false);
  });

  it('does not offer bulk actions on mobile or for missing activities', () => {
    const app = createApp();
    window.innerWidth = 390;
    expect(app.getCommands(null).some(command => bulkActions.includes(command.action as string))).toBe(false);
    window.innerWidth = 1280;
    delete app.props.activities['2'];
    expect(app.getCommands(null).some(command => bulkActions.includes(command.action as string))).toBe(false);
  });

  it('opens the palette with the uppercase key produced by Cmd+Shift+P', () => {
    const app = createApp();
    app.showCommander = vi.fn();
    const handler = app.render().props.eventListeners.find(([type]: [string]) => type === 'keydown')[1];
    handler({ key: 'P', metaKey: true, shiftKey: true, preventDefault: vi.fn(), target: null });
    expect(app.showCommander).toHaveBeenCalledOnce();
  });
});

describe('activity lifecycle shortcuts', () => {
  const setup = (status = 'active') => {
    const app = new App({
      routeParams: {}, fetchUser: vi.fn(), user: { id: 1 },
      operand: { type: 'activity', activity_id: 1, thread_id: 9, activityStatus: 'complete' },
      activities: { 1: { id: 1, thread_id: 9, status } },
      activitySelection: [], blocks: [], threadLevels: {},
      keyUp: vi.fn(), runCommand: vi.fn(),
    } as never);
    app.hideCommander = vi.fn();
    app.setCommanderCommand = vi.fn();
    const keyup = app.render().props.eventListeners.find(([type]: [string]) => type === 'keyup')[1];
    return { app, press: (key: string) => keyup({ key, target: null, preventDefault: vi.fn() }) };
  };

  it.each(['active', 'suspended'])('ends %s activities without depending on chart geometry or stale operand status', status => {
    const { app, press } = setup(status);
    press('e');
    expect(app.props.runCommand).toHaveBeenCalledWith(app.props.operand, expect.objectContaining({ shortcut: 'E' }));
  });

  it('opens closing remarks for resolution', () => {
    const { app, press } = setup();
    press('v');
    expect(app.setCommanderCommand).toHaveBeenCalledWith(expect.objectContaining({ shortcut: 'V' }));
    expect(app.props.runCommand).not.toHaveBeenCalled();
  });

  it.each(['Delete', 'Backspace'])('requires palette confirmation for %s', key => {
    const { app, press } = setup();
    press(key);
    expect(app.setCommanderCommand).toHaveBeenCalledWith(expect.objectContaining({
      shortcut: 'Delete', parameters: [expect.objectContaining({ key: 'confirm_delete' })],
    }));
    expect(app.props.runCommand).not.toHaveBeenCalled();
  });

  it('does not end completed activities', () => {
    const { app, press } = setup('complete');
    press('e');
    expect(app.props.runCommand).not.toHaveBeenCalled();
  });
});
