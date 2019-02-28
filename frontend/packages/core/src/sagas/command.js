import {
  ACTIVITY_CREATE_B,
  ACTIVITY_CREATE_Q,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_REJECT,
  ACTIVITY_RESOLVE,
  ACTIVITY_RESUME,
  ACTIVITY_RESURRECT,
  ACTIVITY_SUSPEND,
  ACTIVITY_DETAILS_SHOW,
  ATTENTION_SHIFT,
  CATEGORY_MANAGER_SHOW,
  COMMAND_RUN,
  SETTINGS_SHOW,
  THREAD_CREATE,
  THREADS_COLLAPSE_ALL,
  THREADS_EXPAND_ALL,
  TODOS_TOGGLE,
  VIEW_CHANGE,
  changeView,
  collapseAllThreads,
  createActivityB,
  createActivityQ,
  createThread,
  deleteActivity,
  expandAllThreads,
  endActivity,
  processTimelineTrace,
  resumeActivity,
  resurrectActivity,
  shiftAttention,
  showActivityDetails,
  showCategoryManager,
  showSettings,
  suspendActivity,
  toggleTodos,
} from '../actions';
// I shouldn't need to do this all over the place like I am 🤷‍♂️
import regeneratorRuntime from "regenerator-runtime";
import { getTimeline } from '../reducers/timeline';

import { put, takeEvery, select } from 'redux-saga/effects';

function* handleCommand({ operand, command }) {
  let timeline = yield select(getTimeline);

  console.log(`🔥  command`, command);

  if (typeof command.action === 'function') {
    /* 💁 This may look funny, but is correct, because the command has been loaded up with arguments now */
    command.action(command);
  } else {
    /* 💁 command may supply activity id and thread id, otherwise fall back to operand */
    const activity_id = command.activity_id || operand.activity_id;
    const thread_id = command.thread_id || operand.thread_id;

    switch (command.action) {
      case ACTIVITY_CREATE_B:
        yield put(
          createActivityB({
            name: command.name,
            timestamp: Date.now(),
            description: '',
            thread_id,
            phase: 'B',
            category_id: command.category_id,
          }),
        );
        yield put(shiftAttention(thread_id, Date.now()));
        break;

      case ACTIVITY_CREATE_Q:
        yield put(
          createActivityQ({
            name: command.name,
            timestamp: Date.now(),
            description: '',
            thread_id,
            phase: 'Q',
            category_id: command.category_id,
          }),
        );
        yield put(shiftAttention(thread_id, Date.now()));
        break;

      case ACTIVITY_RESUME:
        yield put(
          resumeActivity({
            id: activity_id,
            timestamp: Date.now(),
            message: command.message,
            thread_id,
          }),
        );
        yield put(shiftAttention(thread_id, Date.now()));
        break;

      case ACTIVITY_RESURRECT:
        yield put(
          resurrectActivity({
            id: activity_id,
            timestamp: Date.now(),
            message: command.message,
            thread_id,
          }),
        );
        yield put(shiftAttention(thread_id, Date.now()));
        break;

      case ACTIVITY_END:
      case ACTIVITY_REJECT:
      case ACTIVITY_RESOLVE:
        const message = command.message ? command.message : '';
        const eventFlavor = command.action.includes('REJECT')
          ? 'J'
          : command.action.includes('RESOLVE')
            ? 'V'
            : 'E';
        yield put(
          endActivity({
            id: activity_id,
            timestamp: Date.now(),
            message,
            thread_id,
            eventFlavor,
          }),
        );
        break;

      case ACTIVITY_DELETE:
        console.log(`🔥activity_id, thread_id`, activity_id, thread_id);
        yield put(deleteActivity(activity_id, thread_id));
        break;
      /** 💁 if this isn't obvious, suspension can only happen on the most recent block of an activity (for activities that may have been suspended and resumed already) */
      case ACTIVITY_SUSPEND:
        yield put(
          suspendActivity({
            id: activity_id,
            timestamp: Date.now(),
            message: command.message ? command.message : '',
            thread_id,
            weight: command.weight ? Number(command.weight) : null,
          }),
        );

        timeline = yield select(getTimeline);

        /* ⚠️ Ideally we'd only process the tail of the trace */
        yield put(
          processTimelineTrace(
            timeline.events,
            Object.values(timeline.threads),
          ),
        );
        break;

      case ATTENTION_SHIFT:
        console.log('command', command);
        yield put(shiftAttention(thread_id, Date.now()));
        break;

      case ACTIVITY_DETAILS_SHOW:
        yield put(showActivityDetails());
        break;

      case CATEGORY_MANAGER_SHOW:
        yield put(showCategoryManager());
        break;

      case SETTINGS_SHOW:
        yield put(showSettings());
        break;

      case THREAD_CREATE:
        const rank = timeline.threads.length;
        console.log('timeline, rank', timeline, rank);
        yield put(createThread(command.name, rank));
        break;

      case THREADS_COLLAPSE_ALL:
        yield put(collapseAllThreads());
        break;

      case THREADS_EXPAND_ALL:
        yield put(expandAllThreads());
        break;

      case TODOS_TOGGLE:
        const todosVisible = yield select(state => state.todosVisible);
        yield put(toggleTodos(!todosVisible));
        break;

      case VIEW_CHANGE:
        yield put(changeView(command.view, thread_id));
        break;

      default:
        break;
    }
  }
}

function* commandSaga() {
  yield takeEvery(COMMAND_RUN, handleCommand);
}

export default commandSaga;
