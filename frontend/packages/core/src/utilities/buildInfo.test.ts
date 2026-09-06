import { describe, expect, it } from 'vitest';

import { commitUrl, shortSha } from './buildInfo';

describe('buildInfo', () => {
  it('shortens a full git SHA', () => {
    expect(shortSha('56a54ae0123456789abcdef0123456789abcdef0')).toBe('56a54ae');
  });

  it('leaves unknown unchanged', () => {
    expect(shortSha('unknown')).toBe('unknown');
  });

  it('builds a GitHub commit URL', () => {
    expect(commitUrl('56a54ae0123456789abcdef0123456789abcdef0')).toBe(
      'https://github.com/davvidbaker/flambe/commit/56a54ae0123456789abcdef0123456789abcdef0',
    );
    expect(commitUrl('unknown')).toBeNull();
  });
});
