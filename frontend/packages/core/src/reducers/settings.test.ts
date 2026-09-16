import { describe, expect, it } from 'vitest';

import { SETTING_TOGGLE, USER_FETCH } from '../actions';
import settings from './settings';

describe('settings', () => {
  it('hydrates right-align from the user payload', () => {
    const next = settings(undefined, {
      type: `${USER_FETCH}_SUCCEEDED`,
      data: { settings: { rightAlignTimelineText: true } },
    });
    expect(next.rightAlignTimelineText).toBe(true);
  });

  it('leaves right-align unchanged when the user has no stored value', () => {
    const enabled = settings(undefined, { type: SETTING_TOGGLE, setting: 'rightAlignTimelineText' });
    const next = settings(enabled, {
      type: `${USER_FETCH}_SUCCEEDED`,
      data: { settings: {} },
    });
    expect(next.rightAlignTimelineText).toBe(true);
  });
});
