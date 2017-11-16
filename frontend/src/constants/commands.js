import {
  ACTIVITY_CREATE,
  ACTIVITY_END,
  ACTIVITY_REJECT,
  ACTIVITY_RESOLVE,
  THREAD_CREATE,
  TODOS_TOGGLE,
} from 'actions';

const threadParam = {
  key: 'thread_id',
  placeholder: 'thread',
  selector: props => props.threads,
  itemStringKey: 'name',
  itemReturnKey: 'id',
};

const COMMANDS = [
  {
    action: ACTIVITY_CREATE,
    copy: 'start a new task/activity',
    parameters: [
      {
        key: 'name',
        placeholder: 'gist description of the activity',
      },
      threadParam,
    ],
  },
  {
    action: ACTIVITY_CREATE,
    copy: 'ask a question',
    parameters: [
      {
        key: 'name',
        placeholder: 'what the fuck is happening?',
      },
      threadParam,
    ],
  },
  /** ⚠️ TODO make sure the thread name is unique */
  {
    action: THREAD_CREATE,
    copy: 'new thread',
    parameters: [
      {
        key: 'name',
        placeholder: 'thread name',
      },
    ],
  },
  {
    action: TODOS_TOGGLE,
    copy: 'toggle todo list',
  },
];

const messageParam = { key: 'message', placeholder: 'why?' };
/** 💁 For when the operand is an activity. */
export const ACTIVITY_COMMANDS = [
  { action: ACTIVITY_END, copy: 'end activity' },
  {
    action: ACTIVITY_REJECT,
    copy: 'end activity by rejection',
    parameters: [messageParam],
  },
  {
    action: ACTIVITY_RESOLVE,
    copy: 'end activity by resolution',
    parameters: [messageParam],
  },
];

export default COMMANDS;
