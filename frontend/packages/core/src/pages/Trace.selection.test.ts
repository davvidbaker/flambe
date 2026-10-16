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
