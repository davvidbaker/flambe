import { createShareThreadDrafts } from '../components/ShareTimeline';

describe('createShareThreadDrafts', () => {
  const threads = {
    1: { id: 1, name: 'visible', rank: 0, collapsed: false },
    2: { id: 2, name: 'hidden', rank: 1, collapsed: true },
  };

  it('includes currently visible threads and preserves collapse', () => {
    expect(createShareThreadDrafts(threads, [], false, [2])).toEqual([
      { id: 1, name: 'visible', included: true, collapsed: false },
      { id: 2, name: 'hidden', included: false, collapsed: true },
    ]);
  });
});
