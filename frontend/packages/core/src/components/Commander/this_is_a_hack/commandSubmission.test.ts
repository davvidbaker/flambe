import { describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import fieldMachine from './machines/field';
import { commandWithParameters } from './utilities';
import { bulkActivityCommands } from '../../../constants/commands';

describe('palette command submission', () => {
  it('retains selected activity IDs after choosing the destination thread', () => {
    const submit = vi.fn();
    const actor = createActor(fieldMachine.provide({ actions: {
      submitCommand: ({ context }) => {
        if (context.command) submit(commandWithParameters(context.command, context.parameters));
      },
    } }), { input: {} });
    actor.start();
    actor.send({ type: 'COMMAND_SELECT', command: bulkActivityCommands(['1', '2'])[0] });
    expect(submit).not.toHaveBeenCalled();
    actor.send({ type: 'PARAMETER_COMMIT', parameter: { key: 'thread_id', value: 7 } });
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ACTIVITIES_BULK_MOVE', activity_ids: ['1', '2'], thread_id: 7,
    }));
    actor.stop();
  });

  it('retains selected IDs for a delete command with no input parameters', () => {
    const submit = vi.fn();
    const actor = createActor(fieldMachine.provide({ actions: {
      submitCommand: ({ context }) => {
        if (context.command) submit(commandWithParameters(context.command, context.parameters));
      },
    } }), { input: {} });
    actor.start();
    actor.send({ type: 'COMMAND_SELECT', command: bulkActivityCommands(['1', '2'])[1] });
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({
      action: 'ACTIVITIES_BULK_DELETE', activity_ids: ['1', '2'],
    }));
    actor.stop();
  });
});
