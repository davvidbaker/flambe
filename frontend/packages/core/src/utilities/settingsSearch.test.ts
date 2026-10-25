import { describe, expect, it } from 'vitest';

import { filterBySettingsQuery, matchesSettingsQuery, type SettingsSearchable } from './settingsSearch';

const mute: SettingsSearchable = {
  setting: 'activityMute',
  copy: 'Mute Activities',
  description: 'Dim every activity except the focused one.',
};

const absoluteTime: SettingsSearchable = {
  setting: 'absoluteTimeLabels',
  copy: 'Absolute Time Labels',
  description: 'Show clock times on the timeline axis instead of time ago.',
  subsettings: [
    {
      setting: 'twelveHourClock',
      copy: '12-hour clock',
      description: 'Use AM/PM instead of 24-hour time.',
    },
  ],
};

const swyzzle: SettingsSearchable = {
  setting: 'swyzzle',
  copy: 'Swyzzle',
  description: 'After the configured idle time, melt the flame chart.',
  number: { copy: 'Idle seconds', setting: 'swyzzleIdleSeconds' },
  select: { copy: 'Shader', setting: 'swyzzleEffect', options: ['swyzzle', 'gameOfStrife'] },
};

describe('settings search', () => {
  it('matches every setting when the query is blank', () => {
    expect(filterBySettingsQuery([mute, absoluteTime], '   ')).toEqual([mute, absoluteTime]);
  });

  it('matches a setting by its label or description', () => {
    expect(filterBySettingsQuery([mute, absoluteTime], 'mute').map(item => item.setting)).toEqual([
      'activityMute',
    ]);
    expect(filterBySettingsQuery([mute, absoluteTime], 'clock times').map(item => item.setting)).toEqual([
      'absoluteTimeLabels',
    ]);
  });

  it('matches a parent when only a subsetting fits', () => {
    expect(filterBySettingsQuery([absoluteTime, mute], 'am/pm').map(item => item.setting)).toEqual([
      'absoluteTimeLabels',
    ]);
  });

  it('matches nested number and select controls', () => {
    expect(matchesSettingsQuery(
      [swyzzle.copy, swyzzle.number?.copy, swyzzle.select?.options.join(' ')].join(' '),
      'idle',
    )).toBe(true);
    expect(filterBySettingsQuery([mute, swyzzle], 'gameofstrife').map(item => item.setting)).toEqual([
      'swyzzle',
    ]);
  });

  it('requires every word to match', () => {
    expect(filterBySettingsQuery([mute, absoluteTime], 'mute clock')).toEqual([]);
  });
});