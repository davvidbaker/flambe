import {
  CATEGORY_CREATE,
  CATEGORY_UPDATE,
  USER_FETCH,
  TRACE_DELETE,
  TRACE_CREATE,
} from 'actions';

export const getUser = state => state.user;

// ⚠️ TODO change
function user(
  state = { name: 'david', id: '1', traces: [], categories: [] },
  action,
) {
  switch (action.type) {
    // 😃 optimism!
    case CATEGORY_CREATE:
      return {
        ...state,
        categories: [
          ...state.categories,
          { name: action.name, id: 'optimisticCategory', color: action.color },
        ],
      };

    /** ⚠️ need to make sure the user doesn't do anything before this tho...
     */
    case `${CATEGORY_CREATE}_SUCCEEDED`:
      return {
        ...state,
        categories: state.categories.map(
          cat =>
            (cat.id === 'optimisticCategory'
              ? { ...cat, id: action.data.id }
              : cat),
        ),
      };
    /** ⚠️ TODO handle category failure */

    case CATEGORY_UPDATE:
      return {
        ...state,
        categories: state.categories.map(
          cat => (cat.id === action.id ? { ...cat, ...action.updates } : cat),
        ),
      };

    case TRACE_DELETE:
      return {
        ...state,
        traces: state.traces.filter(trace => trace.id !== action.id),
      };
    /** 💁 optimistic update... */
    case TRACE_CREATE:
      return {
        ...state,
        traces: [...state.traces, { name: action.name, id: -1 }],
      };
    /** ...then update id when received 
     * 
     * ⚠️ need to make sure the user doesn't do anything before this tho...
     */
    case `${TRACE_CREATE}_SUCCEEDED`:
      return {
        ...state,
        traces: state.traces.map(
          trace =>
            (trace.name === action.data.name
              ? { ...trace, id: action.data.id }
              : trace),
        ),
      };
    /** ⚠️ TODO handle TRACE_CREATE_FAILED */

    case `${USER_FETCH}_SUCCEEDED`:
      return action.data;

    case `${USER_FETCH}_FAILED`:
      return state;

    default:
      return state;
  }
}

export default user;
