import { getHiddenThreadIds, persistHiddenThreadIds } from './threadHiddenState';

const STORAGE_KEY = 'flambe.thread-hidden-state.v1';

function installMemoryStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => { store.delete(key); },
    setItem: (key: string, value: string) => { store.set(key, value); },
  };
  (globalThis as { window?: { localStorage: typeof localStorage } }).window = { localStorage };
}

describe('thread hidden state', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('round-trips hidden ids per trace', () => {
    persistHiddenThreadIds(4, [2, '3' as unknown as number]);
    expect(getHiddenThreadIds(4)).toEqual([2, 3]);
    expect(getHiddenThreadIds(9)).toEqual([]);
  });

  it('ignores unreadable storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-json');
    expect(getHiddenThreadIds(4)).toEqual([]);
  });
});
