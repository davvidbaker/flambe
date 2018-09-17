// @flow
import sortBy from 'lodash/fp/sortBy';
import map from 'lodash/fp/map';
import pipe from 'lodash/fp/pipe';
import tinycolor from 'tinycolor2';

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
  THREADS_COLLAPSE_ALL,
  THREADS_EXPAND_ALL,
  TODOS_TOGGLE,
  SETTINGS_SHOW,
  VIEW_CHANGE,
} from '../actions';
import {
  rankThreadsByAttention,
  sortThreadsByRank,
} from '../utilities/timelineChart';
import { colors } from '../styles';

const threadParam = {
  key: 'thread_id',
  placeholder: 'thread',
  selector: props =>
    console.log(
      'props',

      map(([_id, obj]) => obj)(
        sortThreadsByRank(
          props.settings.attentionDrivenThreadOrder
            ? rankThreadsByAttention(props.attentionShifts, props.threads)
            : props.threads,
        ),
      ),
    ) ||
    map(([_id, obj]) => obj)(
      sortThreadsByRank(
        props.settings.attentionDrivenThreadOrder
          ? rankThreadsByAttention(props.attentionShifts, props.threads)
          : props.threads,
      ),
    ),
  itemStringKey: 'name',
  itemReturnKey: 'id',
};

const categoryLabel = color => ({
  copy: ' ',
  background: color,
});

const categoryParam = {
  key: 'category_id',
  placeholder: 'category',
  selector: props => {
    const cats =
      props.user.categories
      |> map(cat => ({
        ...cat,
        label: categoryLabel(cat.color_background),
      }))
      |> sortBy(
        ({ color_background }) =>
          tinycolor(color_background)
            .spin(180)
            .toHsl().h,
      );
    return [{ name: 'none', id: null, label: categoryLabel(null) }, ...cats];
  },
  itemStringKey: 'name',
  itemReturnKey: 'id',
  label: item => categoryLabel(item.color),
};

const activityLabel = {
  copy: 'Activity',
  background: colors.flames.main,
};

const COMMANDS = [
  {
    action: ACTIVITY_CREATE,
    copy: 'start a new task/activity...',
    parameters: [
      {
        key: 'name',
        placeholder: 'gist/description of the activity',
      },
      threadParam,
      categoryParam,
    ],
  },
  {
    action: ACTIVITY_CREATE,
    copy: 'ask a question...',
    parameters: [
      {
        key: 'name',
        placeholder: 'what the fuck is happening?',
      },
      threadParam,
      categoryParam,
    ],
  },
  // {
  //   action: FIND,
  //   copy: 'find...',
  //   parameters: [
  //     {
  //       key: 'text',
  //       placeholder: 'find',
  //       selector: props => {
  //         console.log(props);
  //         const acts = Object.values(props.activities).map(({ name }) => ({
  //           name,
  //           value: null,
  //         }));
  //         return acts;
  //         return props.user;
  //       },
  //     },
  //   ],
  //   shortcut: '⌘ F',
  // },
  /** ⚠️ TODO make sure the thread name is unique */
  {
    action: THREAD_CREATE,
    copy: 'new thread...',
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
  {
    action: THREADS_COLLAPSE_ALL,
    copy: 'collapse all threads',
    shortcut: '⇧ {',
  },
  {
    action: THREADS_EXPAND_ALL,
    copy: 'expand all threads',
    shortcut: '⇧ }',
  },
  {
    action: ATTENTION_SHIFT,
    copy: 'shift attention to...',
    parameters: [threadParam],
  },
  {
    action: CATEGORY_MANAGER_SHOW,
    copy: 'manage categories',
  },
  {
    action: SETTINGS_SHOW,
    copy: 'open settings',
    shortcut: '⌘ ,',
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
          { name: 'multithread', value: 'multithread' },
        ],
        itemStringKey: 'name',
        itemReturnKey: 'value',
      },
      // ⚠️ need a way to make this conditional on choosing a single thread
      threadParam,
    ],
  },
];

const messageParam = { key: 'message', placeholder: 'why?' };
/** 💁 For when the operand is an activity. */
export const ACTIVITY_COMMANDS = [
  {
    action: ACTIVITY_END,
    copy: 'just end it',
    status: ['active', 'suspended'],
    label: activityLabel,
    shortcut: 'E',
  },
  {
    action: ACTIVITY_REJECT,
    copy: 'end by rejection...',
    parameters: [messageParam],
    status: ['active', 'suspended'],
    label: activityLabel,
    shortcut: 'J',
  },
  {
    action: ACTIVITY_RESOLVE,
    copy: 'end by resolution...',
    parameters: [{ key: 'message', placeholder: 'closing remarks?' }],
    status: ['active', 'suspended'],
    label: activityLabel,
    shortcut: 'V',
  },

  {
    action: ACTIVITY_RESUME,
    copy: 'resume...',
    parameters: [messageParam],
    status: ['suspended'],
    label: activityLabel,
  },
  {
    action: ACTIVITY_RESURRECT,
    copy: 'resurrect...',
    parameters: [messageParam],
    status: ['complete'],
    label: activityLabel,
  },
  {
    action: ACTIVITY_SUSPEND,
    copy: 'suspend...',
    parameters: [
      { key: 'message', placeholder: 'how bout a message?' },

      /* ⚠️ need to do a validation here that only accepts positive numbers */
      // also would be nice to be able to cast as a Number here, eg:
      // { key: 'weight', placeholder: 'give it a weight? 1+', castFunc: Number },

      // need a way to filter out parameters
      { key: 'weight', placeholder: "give it a weight? 1+     ...or don't" },
    ],
    status: ['active'],
    label: activityLabel,
    shortcut: 'S',
  },
  {
    action: ACTIVITY_DELETE,
    copy: 'delete',
    status: ['active', 'suspended', 'complete'],
    label: activityLabel,
  },
  {
    action: ACTIVITY_DETAILS_SHOW,
    copy: 'edit/view details',
    status: ['active', 'suspended', 'complete'],
    label: activityLabel,
    shortcut: 'Space',
  },
];

type Status = 'active' | 'suspended' | 'complete';
export function activityCommandsByStatus(status: Status): Command[] {
  return ACTIVITY_COMMANDS.filter(cmd => cmd.status.includes(status));
}

export default COMMANDS;
