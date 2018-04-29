import {
  ACTIVITY_CREATE,
  ACTIVITY_DELETE,
  ACTIVITY_END,
  ACTIVITY_SUSPEND,
  ACTIVITY_REJECT,
  ACTIVITY_RESOLVE,
  ACTIVITY_RESUME,
  ACTIVITY_RESURRECT,
  ACTIVITY_DETAILS_SHOW,
  ATTENTION_SHIFT,
  CATEGORY_MANAGER_SHOW,
  THREAD_CREATE,
  THREADS_COLLAPSE,
  THREADS_EXPAND,
  TODOS_TOGGLE,
  SETTINGS_SHOW,
  VIEW_CHANGE
} from 'actions';

import { colors } from 'styles';

const threadParam = {
  key: 'thread_id',
  placeholder: 'thread',
  selector: props => props.threads,
  itemStringKey: 'name',
  itemReturnKey: 'id'
};

const categoryLabel = color => ({
  copy: ' ',
  background: color
});

const categoryParam = {
  key: 'category_id',
  placeholder: 'category',
  selector: props => {
    const cats = props.user.categories.map(cat => ({
      ...cat,
      label: categoryLabel(cat.color_background)
    }));
    return [{ name: 'none', id: null, label: categoryLabel(null) }, ...cats];
  },
  itemStringKey: 'name',
  itemReturnKey: 'id',
  label: item => categoryLabel(item.color)
};

const activityLabel = {
  copy: 'Activity',
  background: colors.flames.main
};

const COMMANDS = [
  {
    action: ACTIVITY_CREATE,
    copy: 'start a new task/activity...',
    parameters: [
      {
        key: 'name',
        placeholder: 'gist/description of the activity'
      },
      threadParam,
      categoryParam
    ]
  },
  {
    action: ACTIVITY_CREATE,
    copy: 'ask a question...',
    parameters: [
      {
        key: 'name',
        placeholder: 'what the fuck is happening?'
      },
      threadParam,
      categoryParam
    ]
  },
  /** ⚠️ TODO make sure the thread name is unique */
  {
    action: THREAD_CREATE,
    copy: 'new thread...',
    parameters: [
      {
        key: 'name',
        placeholder: 'thread name'
      }
    ]
  },
  {
    action: TODOS_TOGGLE,
    copy: 'toggle todo list'
  },
  {
    action: THREADS_COLLAPSE,
    copy: 'collapse all threads',
    shortcut: '⇧ {'
  },
  {
    action: THREADS_EXPAND,
    copy: 'expand all threads',
    shortcut: '⇧ }'
  },
  {
    action: ATTENTION_SHIFT,
    copy: 'shift attention to...',
    parameters: [threadParam]
  },
  {
    action: CATEGORY_MANAGER_SHOW,
    copy: 'manage categories'
  },
  {
    action: SETTINGS_SHOW,
    copy: 'open settings',
    shortcut: '⌘ ,'
  },
  {
    action: VIEW_CHANGE,
    copy: 'change view...',
    parameters: [
      {
        key: 'view',
        placeholder: 'select a view',
        /* ⚠️ kinda hacky */
        selector: () => [
          { name: 'single thread', value: 'singlethread' },
          { name: 'multithread', value: 'multithread' }
        ],
        itemStringKey: 'name',
        itemReturnKey: 'value'
      },
      // ⚠️ need a way to make this conditional on choosing a single thread
      threadParam
    ]
  }
];

const messageParam = { key: 'message', placeholder: 'why?' };
/** 💁 For when the operand is an activity. */
export const ACTIVITY_COMMANDS = [
  {
    action: ACTIVITY_END,
    copy: 'just end it',
    status: ['active'],
    label: activityLabel,
    shortcut: 'E'
  },
  {
    action: ACTIVITY_REJECT,
    copy: 'end by rejection...',
    parameters: [messageParam],
    status: ['active'],
    label: activityLabel,
    shortcut: 'J'
  },
  {
    action: ACTIVITY_RESOLVE,
    copy: 'end by resolution...',
    parameters: [messageParam],
    status: ['active'],
    label: activityLabel,
    shortcut: 'V'
  },

  {
    action: ACTIVITY_RESUME,
    copy: 'resume...',
    parameters: [messageParam],
    status: ['suspended'],
    label: activityLabel
  },
  {
    action: ACTIVITY_RESURRECT,
    copy: 'resurrect...',
    parameters: [messageParam],
    status: ['complete'],
    label: activityLabel
  },
  {
    action: ACTIVITY_SUSPEND,
    copy: 'suspend...',
    parameters: [messageParam],
    status: ['active'],
    label: activityLabel
  },
  {
    action: ACTIVITY_DELETE,
    copy: 'delete',
    status: ['active', 'suspended', 'complete'],
    label: activityLabel
  },
  {
    action: ACTIVITY_DETAILS_SHOW,
    copy: 'edit/view details',
    status: ['active', 'suspended', 'complete'],
    label: activityLabel,
    shortcut: 'Space'
  }
];

export default COMMANDS;
