import {
  ACTIVITY_CREATE,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_SUSPEND,
  ACTIVITY_REJECT,
  ACTIVITY_RESOLVE,
  ACTIVITY_RESUME,
  THREAD_CREATE,
  TODOS_TOGGLE,
} from 'actions';

import { colors } from 'styles';

const threadParam = {
  key: 'thread_id',
  placeholder: 'thread',
  selector: props => props.threads,
  itemStringKey: 'name',
  itemReturnKey: 'id',
};

const activityLabel = {
  copy: 'Activity',
  background: colors.flames.main,
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
  {
    action: ACTIVITY_END,
    copy: 'Just fucking end it.',
    status: ['active'],
    label: activityLabel,
    shortcut: 'E',
  },
  {
    action: ACTIVITY_REJECT,
    copy: 'End by Rejection',
    parameters: [messageParam],
    status: ['active'],
    label: activityLabel,
    shortcut: 'J',
  },
  {
    action: ACTIVITY_RESOLVE,
    copy: 'End by Resolution',
    parameters: [messageParam],
    status: ['active'],
    label: activityLabel,
    shortcut: 'V',
  },
  {
    action: ACTIVITY_RESUME,
    copy: 'Resume',
    parameters: [messageParam],
    status: ['suspended'],
    label: activityLabel,
  },
  {
    action: ACTIVITY_SUSPEND,
    copy: 'Suspend',
    parameters: [messageParam],
    status: ['active'],
    label: activityLabel,
  },
  {
    action: ACTIVITY_DELETE,
    copy: 'Delete',
    status: ['active', 'suspended', 'complete'],
    label: activityLabel,
  },
];

export default COMMANDS;
