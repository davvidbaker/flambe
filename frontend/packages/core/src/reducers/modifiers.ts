import { KEY_DOWN, KEY_UP } from '../actions';

export interface ModifiersState { shift: boolean; [key: string]: boolean }
type ModifierAction = { type: string; key?: string };
const initialState: ModifiersState = { shift: false };

export const getModifiers = (state: { modifiers: ModifiersState }): ModifiersState => state.modifiers;

function modifiers(state: ModifiersState = initialState, action: ModifierAction): ModifiersState {
  if ((action.type === KEY_DOWN || action.type === KEY_UP) && action.key) {
    return { ...state, [action.key.toLowerCase()]: action.type === KEY_DOWN };
  }
  return state;
}

export default modifiers;
