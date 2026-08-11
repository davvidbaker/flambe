import * as React from 'react';
import styled from 'styled-components';

import fieldMachine from '../machines/field';
import useMachine from '../machines/use-machine';
import FuzzyAutocomplete from './FuzzyAutocomplete';
import SimplePrompt from './SimplePrompt';
import * as Utilities from '../utilities';
import type { Command, CommandParameter } from '../../../../constants/commands';
import type { FieldInput } from '../machines/field';
import type { FuzzyAutocompleteItem } from './FuzzyAutocomplete';

type Selector = NonNullable<CommandParameter['selector']>;
export type GetItems = (selector: Selector) => FuzzyAutocompleteItem[];
type ParameterCommit = { key: string; value: unknown };

const CommandName = styled.span`
  padding: 5px;
  font-size: 0.75em;
  font-weight: bold;
`;

const ParameterList = styled.ul`
  list-style: none;
  font-size: 0.75em;
  padding: 5px 10px;
  margin: 0;
  li + li { margin-top: 3px; }
`;

const ParameterItem = styled.li` position: relative; `;
const ParameterEditor = styled.div`
  display: inline-block;
  position: absolute;
  top: -5px;
  transform: translateX(-2px);
  z-index: 10000;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05),
    0 2px 4px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.1);
`;
const ParameterValue = styled.span` &:hover { background: #ccf1ff; } `;

const CommandSelect = ({ command, availableCommands, onChange, editing }: {
  availableCommands: Command[];
  command: Command | null;
  editing: boolean;
  onChange: (command: Command) => unknown;
}) => {
  return editing ? (
    <FuzzyAutocomplete
      items={availableCommands}
      onChange={onChange}
      itemStringKey="copy"
    />
  ) : (
    <CommandName>
      {command && command.copy}
    </CommandName>
  );
};

const ParameterEntry = ({
  parameter,
  onSubmit,
  getItems,
  initialInputValue = '',
  onBlur = () => {},
}: {
  getItems: GetItems;
  initialInputValue?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onSubmit: (parameter: ParameterCommit) => unknown;
  parameter: CommandParameter | null;
}) =>
  parameter ? (
    parameter.selector ? (
      <FuzzyAutocomplete
        items={getItems(parameter.selector)}
        itemStringKey={parameter.itemStringKey ?? 'name'}
        onChange={item =>
          onSubmit({ key: parameter.key, value: item[parameter.itemReturnKey ?? 'value'] })
        }
        placeholder={parameter.placeholder}
        initialInputValue={initialInputValue}
        onBlur={onBlur}
      />
    ) : (
      <SimplePrompt
        onSubmit={value => onSubmit({ key: parameter.key, value })}
        onBlur={onBlur}
        placeholder={parameter.placeholder}
        initialInputValue={initialInputValue}
      />
    )
  ) : null;

const CommittedParameters = ({
  parameters,
  command,
  getItems,
  commitParameter,
}: {
  command: Command;
  commitParameter: (parameter: ParameterCommit) => unknown;
  getItems: GetItems;
  parameters: Record<string, unknown>;
}) => {
  const [editingParameter, setEditingParameter] = React.useState<CommandParameter | null>(null);

  return (
    <ParameterList>
      {Object.entries(parameters).map(([key, value]) => {
        const parameter = Utilities.parameterGivenKey(command, key);
        if (!parameter) return null;

        return (
          <ParameterItem key={key} onClick={() => setEditingParameter(parameter)}>
            <span>{parameter.placeholder}</span>:{' '}
            {editingParameter && editingParameter.key === key ? (
              <ParameterEditor>
                <ParameterEntry
                  onSubmit={p => {
                    setEditingParameter(null);
                    commitParameter(p);
                  }}
                  getItems={getItems}
                  parameter={parameter}
                  initialInputValue={String(Utilities.parameterDisplayValue(
                    value,
                    parameter,
                    getItems,
                  ))}
                  onBlur={() => {
                    setEditingParameter(null);
                  }}
                />
              </ParameterEditor>
            ) : (
              <ParameterValue>
                {String(Utilities.parameterDisplayValue(value, parameter, getItems))}
              </ParameterValue>
            )}
          </ParameterItem>
        );
      })}
    </ParameterList>
  );
};

const Parameters = ({ command, parameters, commitParameter, getItems }: {
  command: Command | null;
  commitParameter: (parameter: ParameterCommit) => unknown;
  getItems: GetItems;
  parameters: Record<string, unknown>;
}) => {
  return (
    <div>
      {command && Object.keys(parameters).length > 0 && (
        <CommittedParameters
          parameters={parameters}
          command={command}
          getItems={getItems}
          commitParameter={commitParameter}
        />
      )}
      {command && (
        <ParameterEntry
          key={Utilities.currentParameter(command, parameters)?.key || 'complete'}
          onSubmit={commitParameter}
          getItems={getItems}
          parameter={Utilities.currentParameter(command, parameters)}
        />
      )}
    </div>
  );
};

function Field({
  availableCommands,
  getItems,
  field = {
    command: null,
    parameters: {},
  },
  onFullyLoaded,
}: {
  availableCommands: Command[];
  field?: FieldInput;
  getItems: GetItems;
  onFullyLoaded: (command: { action: Command['action'] } & Record<string, unknown>) => unknown;
}) {
  const [state, send] = useMachine(
    fieldMachine.provide(
      {
        actions: {
          submitCommand: ({ context }) => {
            if (context.command) {
              onFullyLoaded({ action: context.command.action, ...context.parameters });
            }
          },
        },
      },
    ),
    {
      input: field,
      /* 💁  set to true to help debugging */
      log: true,
    },
  );

  // eslint-disable-next-line no-unused-vars
  const { command, parameters } = state.context;

  return (
    <div>
      <CommandSelect
        command={command}
        availableCommands={availableCommands}
        onChange={command => send({ type: 'COMMAND_SELECT', command })}
        // is this coupling to the state machine state bad?
        editing={state.value === 'command'}
      />
      <Parameters
        parameters={parameters}
        command={command}
        getItems={getItems}
        commitParameter={parameter =>
          send({ type: 'PARAMETER_COMMIT', parameter })
        }
      />
    </div>
  );
}

export default Field;
