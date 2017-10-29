import { USER_FETCH, TRACE_DELETE, TRACE_CREATE } from 'actions';

export const getUser = state => state.user;

// ⚠️ TODO change
function user(state = { name: 'david', id: '1', traces: [] }, action) {
  switch (action.type) {
    case `${USER_FETCH}_SUCCEEDED`:
      return action.data;

    case `${USER_FETCH}_FAILED`:
      return state;

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
              : trace)
        ),
      };
    /** ⚠️ TODO handle TRACE_CREATE_FAILED */


    default:
      return state;
  }
}

export default user;
