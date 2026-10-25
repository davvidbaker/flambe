import { describe, expect, it, vi } from 'vitest';

import { ACTIVITY_COMMANDS } from '../constants/commands';
import { App } from './Trace';

describe('Trace keyboard shortcuts', () => {
  const createApp = () => new App({
    fetchUser: vi.fn(),
    routeParams: {},
    user: { id: 1 },
  } as never);

  it('runs commands without parameters immediately', () => {
    const app = createApp();
    app.submitCommand = vi.fn();
    app.setCommanderCommand = vi.fn();
    const end = ACTIVITY_COMMANDS.find(command => command.shortcut === 'E');

    app.runShortcutCommand(end);

    expect(app.submitCommand).toHaveBeenCalledWith(end);
    expect(app.setCommanderCommand).not.toHaveBeenCalled();
  });

  it('opens the command input when the shortcut needs parameters', () => {
    const app = createApp();
    app.submitCommand = vi.fn();
    app.setCommanderCommand = vi.fn();
    const resolve = ACTIVITY_COMMANDS.find(command => command.shortcut === 'V');

    app.runShortcutCommand(resolve);

    expect(app.setCommanderCommand).toHaveBeenCalledWith(resolve);
    expect(app.submitCommand).not.toHaveBeenCalled();
  });
});

