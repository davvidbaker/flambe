import { describe, expect, it } from 'vitest';

import {
  activityMatchesSearch,
  compileSearchRegex,
  InvalidSearchRegexError,
  type SearchOptions,
} from './activityMatchesSearch';

const defaultOptions: SearchOptions = {
  matchCase: false,
  matchWholeWord: false,
  useRegularExpression: false,
};

describe('activityMatchesSearch', () => {
  it('matches case-insensitively by default', () => {
    expect(activityMatchesSearch('Fix USERPROFILE', 'userprofile', defaultOptions)).toBe(true);
    expect(activityMatchesSearch('Fix USERPROFILE', 'USERPROFILE', defaultOptions)).toBe(true);
  });

  it('honors match case', () => {
    expect(
      activityMatchesSearch('Fix USERPROFILE', 'userprofile', {
        ...defaultOptions,
        matchCase: true,
      }),
    ).toBe(false);
    expect(
      activityMatchesSearch('Fix USERPROFILE', 'USERPROFILE', {
        ...defaultOptions,
        matchCase: true,
      }),
    ).toBe(true);
  });

  it('honors match whole word', () => {
    expect(
      activityMatchesSearch('inside the activity', 'in', {
        ...defaultOptions,
        matchWholeWord: true,
      }),
    ).toBe(false);
    expect(
      activityMatchesSearch('in the activity', 'in', {
        ...defaultOptions,
        matchWholeWord: true,
      }),
    ).toBe(true);
  });

  it('treats the query as a regular expression', () => {
    expect(
      activityMatchesSearch('Fix USERPROFILE resolution', 'Fix .* resolution', {
        ...defaultOptions,
        useRegularExpression: true,
      }),
    ).toBe(true);
    expect(
      activityMatchesSearch('Fix USERPROFILE resolution', 'Fix .* resolution', defaultOptions),
    ).toBe(false);
  });

  it('throws for an invalid regular expression', () => {
    expect(() =>
      compileSearchRegex('(', { ...defaultOptions, useRegularExpression: true }),
    ).toThrow(InvalidSearchRegexError);
  });
});
