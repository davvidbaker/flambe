/* ⚠️ todo strip warnings in production build */
import type { Command, CommandParameter } from '../../../constants/commands';

type Parameters = Record<string, unknown>;
type Selector = NonNullable<CommandParameter['selector']>;

function warning(fn: () => void): void {
  fn();
}
function warn(...args: unknown[]): void {
  console.warn('😲', ...args);
}

function parameterDefined(parameters: Parameters, parameter: CommandParameter): boolean {
  return typeof parameters[parameter.key] !== 'undefined';
}

export function commandHasParameters(command: Command): boolean {
  return Boolean(command.parameters && command.parameters.length > 0);
}

export function commandFullyLoaded(command: Command, parameters: Parameters): boolean {
  for (const parameter of command.parameters ?? []) {
    if (parameterDefined(parameters, parameter)) continue;
    else return false;
  }

  return true;
}

export function currentParameter(command: Command, parameters: Parameters): CommandParameter | null {
  for (const parameter of command.parameters ?? []) {
    if (parameterDefined(parameters, parameter)) continue;
    else return parameter;
  }
  return null;
}

export function parameterGivenKey(command: Command, givenKey: string): CommandParameter | undefined {
  const parameter = command.parameters?.find(({ key }) => key === givenKey);

  warning(() => {
    if (!parameter) {
      warn(`parameter with key ${givenKey} not found on command:`, command);
    }
  });

  return parameter;
}

export function parameterDisplayValue(
  value: unknown,
  parameter: CommandParameter,
  getItems: (selector: Selector) => unknown[],
): unknown {
  if (!parameter.selector || !parameter.itemReturnKey || !parameter.itemStringKey) return value;
  const item = getItems(parameter.selector).find(candidate =>
    typeof candidate === 'object' && candidate !== null &&
    (candidate as Record<string, unknown>)[parameter.itemReturnKey!] === value,
  ) as Record<string, unknown> | undefined;
  return item?.[parameter.itemStringKey] ?? value;
}
