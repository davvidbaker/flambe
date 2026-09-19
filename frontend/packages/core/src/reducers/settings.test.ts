import { describe, expect, it } from 'vitest';

import { SETTING_SET, SETTING_TOGGLE, USER_FETCH } from '../actions';
import { createChartStore } from '../storybook/createChartStore';
import { createAppChartFixture } from '../storybook/fixtureTrace';
import settings, { isUserSettingKey } from './settings';

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

  it('defaults Swyzzle off and toggles it as a session setting', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    expect(initial.swyzzle).toBe(false);

    const enabled = settings(initial, { type: SETTING_TOGGLE, setting: 'swyzzle' });
    expect(enabled.swyzzle).toBe(true);

    const afterUserFetch = settings(enabled, {
      type: `${USER_FETCH}_SUCCEEDED`,
      data: { settings: {} },
    });
    expect(afterUserFetch.swyzzle).toBe(true);
  });

  it('defaults the Swyzzle shader to swyzzle and keeps it session-only', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    expect(initial.swyzzleEffect).toBe('swyzzle');

    const fluid = settings(initial, {
      type: SETTING_SET,
      setting: 'swyzzleEffect',
      value: 'fluid',
    });
    expect(fluid.swyzzleEffect).toBe('fluid');

    const afterUserFetch = settings(fluid, {
      type: `${USER_FETCH}_SUCCEEDED`,
      data: { settings: {} },
    });
    expect(afterUserFetch.swyzzleEffect).toBe('fluid');
  });

  it('falls back to swyzzle when the shader name is unknown', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    const next = settings(initial, {
      type: SETTING_SET,
      setting: 'swyzzleEffect',
      value: 'not-a-shader',
    });
    expect(next.swyzzleEffect).toBe('swyzzle');
  });

  it('does not toggle the shader name', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    const next = settings(initial, { type: SETTING_TOGGLE, setting: 'swyzzleEffect' });
    expect(next.swyzzleEffect).toBe('swyzzle');
    expect(next).toBe(initial);
  });

  it('still sets boolean developer settings through SETTING_SET', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    const next = settings(initial, { type: SETTING_SET, setting: 'swyzzle', value: true });
    expect(next.swyzzle).toBe(true);
    expect(next.swyzzleEffect).toBe('swyzzle');
  });

  it('defaults Swyzzle idle seconds to 7 and keeps it session-only', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    expect(initial.swyzzleIdleSeconds).toBe(7);
    expect(isUserSettingKey('swyzzleIdleSeconds')).toBe(false);

    const next = settings(initial, {
      type: SETTING_SET,
      setting: 'swyzzleIdleSeconds',
      value: 12,
    });
    expect(next.swyzzleIdleSeconds).toBe(12);

    const afterUserFetch = settings(next, {
      type: `${USER_FETCH}_SUCCEEDED`,
      data: { settings: {} },
    });
    expect(afterUserFetch.swyzzleIdleSeconds).toBe(12);
  });

  it('clamps Swyzzle idle seconds to 1–60', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    expect(
      settings(initial, { type: SETTING_SET, setting: 'swyzzleIdleSeconds', value: 0 })
        .swyzzleIdleSeconds,
    ).toBe(1);
    expect(
      settings(initial, { type: SETTING_SET, setting: 'swyzzleIdleSeconds', value: 90 })
        .swyzzleIdleSeconds,
    ).toBe(60);
    expect(
      settings(initial, { type: SETTING_SET, setting: 'swyzzleIdleSeconds', value: 7.6 })
        .swyzzleIdleSeconds,
    ).toBe(8);
    expect(
      settings(initial, {
        type: SETTING_SET,
        setting: 'swyzzleIdleSeconds',
        value: '15',
      }).swyzzleIdleSeconds,
    ).toBe(15);
  });

  it('does not toggle idle seconds', () => {
    const initial = settings(undefined, { type: '@@INIT' });
    const next = settings(initial, { type: SETTING_TOGGLE, setting: 'swyzzleIdleSeconds' });
    expect(next.swyzzleIdleSeconds).toBe(7);
    expect(next).toBe(initial);
  });
});

describe('createChartStore swyzzle extras', () => {
  it('applies a selected Swyzzle shader from story extras', () => {
    const fixture = createAppChartFixture({ now: 1_700_000_000_000 });
    const store = createChartStore(fixture, 1_700_000_000_000, {
      demoOverlays: false,
      settings: { swyzzle: true, swyzzleEffect: 'fluid' },
    });
    expect(store.getState().settings.swyzzle).toBe(true);
    expect(store.getState().settings.swyzzleEffect).toBe('fluid');
  });

  it('applies Swyzzle idle seconds from story extras', () => {
    const fixture = createAppChartFixture({ now: 1_700_000_000_000 });
    const store = createChartStore(fixture, 1_700_000_000_000, {
      demoOverlays: false,
      settings: { swyzzle: true, swyzzleIdleSeconds: 3 },
    });
    expect(store.getState().settings.swyzzle).toBe(true);
    expect(store.getState().settings.swyzzleIdleSeconds).toBe(3);
  });
});
