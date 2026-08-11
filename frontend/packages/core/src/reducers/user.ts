import type { Category } from '../types/Category';
import type { EntityId } from '../types/ids';
import type { Todo } from '../types/Todo';
import type { Trace } from '../types/Trace';
import {
  ATTENTION_SHIFT, CATEGORY_CREATE, CATEGORY_UPDATE, MANTRA_CREATE,
  TODO_BEGIN, TODO_CREATE, TRACE_DELETE, TRACE_CREATE, USER_FETCH,
  SEARCH_TERMS_EVENT, TABS_EVENT,
} from '../actions';

interface TimedRecord { timestamp: number }
export interface AttentionShift extends TimedRecord { thread_id: EntityId }
export interface Mantra extends TimedRecord { name: string }
export interface SearchTerm extends TimedRecord { term: string }
export interface TabCount extends TimedRecord { count: number; window_count: number }

export interface UserState {
  id: EntityId;
  name: string;
  username: string;
  traces: Trace[];
  categories: Category[];
  todos: Todo[];
  mantras: Mantra[];
  attentionShifts: AttentionShift[];
  searchTerms: SearchTerm[];
  tabs: TabCount[];
  [key: string]: unknown;
}

const defaultState: UserState = {
  name: 'david', username: 'david', id: '1', traces: [], categories: [], todos: [],
  mantras: [], attentionShifts: [], searchTerms: [], tabs: [],
};

type IncomingTimedRecord<T extends TimedRecord> = Omit<T, 'timestamp'> & { timestamp: number | string };
type UserAction = {
  type: string; name?: string; description?: string | null; color_background?: string;
  color_text?: string; id?: EntityId; todo_id?: EntityId; thread_id?: EntityId;
  timestamp?: number; term?: string; tabs_count?: number; window_count?: number;
  updates?: Partial<Category>; data?: Record<string, any>;
};

export const getUser = (state: { user: UserState }): UserState => state.user;

function normalizeTimestamp<T extends TimedRecord>(record: IncomingTimedRecord<T>): T {
  return { ...record, timestamp: new Date(record.timestamp).getTime() } as T;
}

function sortByTime<T extends TimedRecord>(records: Array<IncomingTimedRecord<T>> = []): T[] {
  return records.map(normalizeTimestamp).sort((left, right) => left.timestamp - right.timestamp);
}

function user(state: UserState = defaultState, action: UserAction): UserState {
  switch (action.type) {
    case CATEGORY_CREATE:
      return { ...state, categories: [...state.categories, { name: action.name ?? '', id: 'optimisticCategory', color_background: action.color_background ?? '', color_text: action.color_text ?? '#000000' }] };
    case MANTRA_CREATE:
      return { ...state, mantras: [...state.mantras, { name: action.name ?? '', timestamp: Date.now() }] };
    case `${CATEGORY_CREATE}_SUCCEEDED`:
      return { ...state, categories: state.categories.map(category => category.id === 'optimisticCategory' ? { ...category, id: action.data?.id } : category) };
    case CATEGORY_UPDATE:
      return { ...state, categories: state.categories.map(category => category.id === action.id ? { ...category, ...action.updates } : category) };
    case ATTENTION_SHIFT: {
      const previous = state.attentionShifts[state.attentionShifts.length - 1];
      if (action.thread_id === undefined || action.thread_id === previous?.thread_id) return state;
      return { ...state, attentionShifts: [...state.attentionShifts, { timestamp: action.timestamp ?? Date.now(), thread_id: action.thread_id }] };
    }
    case TODO_CREATE:
      return { ...state, todos: [...state.todos, { name: action.name ?? '', description: action.description ?? null, id: 'optimisticTodo' }] };
    case `${TODO_CREATE}_SUCCEEDED`:
      return { ...state, todos: state.todos.map(todo => todo.id === 'optimisticTodo' ? { ...todo, id: action.data?.id } : todo) };
    case TODO_BEGIN:
      return { ...state, todos: state.todos.filter(todo => todo.id !== action.todo_id) };
    case TRACE_DELETE:
      return { ...state, traces: state.traces.filter(trace => trace.id !== action.id) };
    case TRACE_CREATE:
      return { ...state, traces: [...state.traces, { name: action.name ?? '', id: -1 }] };
    case `${TRACE_CREATE}_SUCCEEDED`:
      return { ...state, traces: state.traces.map(trace => trace.name === action.data?.name ? { ...trace, id: action.data?.id } : trace) };
    case `${USER_FETCH}_SUCCEEDED`: {
      const data = action.data ?? {};
      return {
        ...defaultState,
        ...data,
        attentionShifts: (data.attentionShifts ?? []).map((record: IncomingTimedRecord<AttentionShift>) => normalizeTimestamp(record)),
        mantras: sortByTime<Mantra>(data.mantras),
        searchTerms: sortByTime<SearchTerm>(data.searchTerms),
        tabs: sortByTime<TabCount>(data.tabs),
      } as UserState;
    }
    case `${USER_FETCH}_FAILED`:
      return state;
    case SEARCH_TERMS_EVENT:
      return { ...state, searchTerms: [...state.searchTerms, { term: action.term ?? '', timestamp: action.timestamp ?? Date.now() }] };
    case TABS_EVENT:
      return { ...state, tabs: [...state.tabs, { count: action.tabs_count ?? 0, timestamp: action.timestamp ?? Date.now(), window_count: action.window_count ?? 0 }] };
    default:
      return state;
  }
}

export default user;
