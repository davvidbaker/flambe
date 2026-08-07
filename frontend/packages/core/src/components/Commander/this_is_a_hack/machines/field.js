import { assign, createMachine } from 'xstate';
import * as Utilities from '../utilities';

const commitParameter = assign(({ context, event }) => ({
  parameters: {
    ...context.parameters,
    [event.parameter.key]: event.parameter.value,
  },
}));

const commandFullyLoaded = ({ context }) =>
  context.command
  && Utilities.commandFullyLoaded(context.command, context.parameters);

const commandHasParameters = ({ event }) =>
  Utilities.commandHasParameters(event.command);

const commandNotNull = ({ context }) => context.command !== null;

const setCommand = assign(({ event }) => ({ command: event.command }));

const fieldMachine = createMachine({
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
}).provide({
    actions: {
      commitParameter,
      setCommand,
    },
    guards: { commandFullyLoaded, commandHasParameters, commandNotNull },
});

export default fieldMachine;
