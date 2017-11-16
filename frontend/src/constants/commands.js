import {
  ACTIVITY_CREATE,
  ACTIVITY_END,
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

/** 💁 For when the operand is an activity. */
export const ACTIVITY_COMMANDS = [
  { action: ACTIVITY_END, copy: 'end activity' },
];

export default COMMANDS;
