import { describe, expect, it } from 'vitest';

import { SEARCH_RESULT, TOGGLE_SEARCH_OPTION } from '../actions';
import search from './search';

describe('search options', () => {
  it('toggles match case, whole word, and regular expression independently', () => {
    const withCase = search(undefined, { type: TOGGLE_SEARCH_OPTION, option: 'matchCase' });
    expect(withCase.options).toEqual({
      matchCase: true,
      matchWholeWord: false,
      useRegularExpression: false,
    });

    const withWord = search(withCase, { type: TOGGLE_SEARCH_OPTION, option: 'matchWholeWord' });
    expect(withWord.options.matchWholeWord).toBe(true);
    expect(withWord.options.matchCase).toBe(true);
  });

  it('stores an invalid regular expression error from search results', () => {
    const next = search(undefined, {
      type: SEARCH_RESULT,
      matches: [],
      blocksForMatch: [],
      searchError: 'Invalid regular expression',
    });
    expect(next.searchError).toBe('Invalid regular expression');
    expect(next.matches).toEqual([]);
  });
});
