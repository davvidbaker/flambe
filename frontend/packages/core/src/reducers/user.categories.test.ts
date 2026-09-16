import { describe, expect, it } from 'vitest';

import { CATEGORIES_EVENT, CATEGORY_CREATE } from '../actions';
import user from './user';

describe('user categories', () => {
  it('replaces the palette from a socket event', () => {
    const next = user(undefined, {
      type: CATEGORIES_EVENT,
      data: [
        { id: 9, name: 'ops', color_background: '#00ff00', color_text: '#000000' },
      ],
    });
    expect(next.categories).toEqual([
      { id: 9, name: 'ops', color_background: '#00ff00', color_text: '#000000' },
    ]);
  });

  it('adds an optimistic category without requiring an activity', () => {
    const next = user(undefined, {
      type: CATEGORY_CREATE,
      name: 'ops',
      color_background: '#00ff00',
      color_text: '#111111',
    });
    expect(next.categories).toEqual([
      {
        name: 'ops',
        id: 'optimisticCategory',
        color_background: '#00ff00',
        color_text: '#111111',
      },
    ]);
  });
});
