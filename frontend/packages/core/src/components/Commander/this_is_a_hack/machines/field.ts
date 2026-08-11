import { assign, createMachine } from 'xstate';
import * as Utilities from '../utilities';
import type { Command } from '../../../../constants/commands';

export interface FieldContext {
  command: Command | null;
  parameters: Record<string, unknown>;
}

export interface FieldInput {
  command?: Command | null;
  parameters?: Record<string, unknown>;
}

export type FieldEvent =
  | { type: 'COMMAND_SELECT'; command: Command }
  | { type: 'PARAMETER_COMMIT'; parameter: { key: string; value: unknown } };

const fieldMachine = createMachine({
    types: {} as { context: FieldContext; events: FieldEvent; input: FieldInput },
    id: 'field',
    initial: 'initial',
    context: ({ input }) => ({
      command: null,
      parameters: {},
      ...input,
    }),
    states: {
      initial: {
        always: [
            {
              target: 'fully_loaded',
              guard: 'commandFullyLoaded',
            },
            {
              target: 'parameters',
              guard: 'commandNotNull',
            },
            {
              target: 'command',
            },
          ],
      },
      command: {
        on: {
          COMMAND_SELECT: [
            {
              target: 'parameters',
              guard: 'commandHasParameters',
              actions: 'setCommand',
            },
            {
              target: 'fully_loaded',
              actions: 'setCommand',
            },
          ],
        },
      },
      parameters: {
        on: {
          PARAMETER_COMMIT: [
            {
              target: 'parameter_committed',
              actions: 'commitParameter',
            },
          ],
        },
      },
      parameter_committed: {
        always: [
            {
              target: 'fully_loaded',
              guard: 'commandFullyLoaded',
            },
            { target: 'parameters' },
          ],
      },
      fully_loaded: {
        entry: 'submitCommand',
      },
    },
}, {
    actions: {
      commitParameter: assign(({ context, event }) => ({
        parameters: event.type === 'PARAMETER_COMMIT'
          ? { ...context.parameters, [event.parameter.key]: event.parameter.value }
          : context.parameters,
      })),
      setCommand: assign(({ context, event }) => ({
        command: event.type === 'COMMAND_SELECT' ? event.command : context.command,
      })),
    },
    guards: {
      commandFullyLoaded: ({ context }) => Boolean(
        context.command && Utilities.commandFullyLoaded(context.command, context.parameters),
      ),
      commandHasParameters: ({ event }) =>
        event.type === 'COMMAND_SELECT' && Utilities.commandHasParameters(event.command),
      commandNotNull: ({ context }) => context.command !== null,
    },
});

export default fieldMachine;
