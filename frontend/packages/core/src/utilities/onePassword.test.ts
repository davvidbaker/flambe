import { describe, expect, it } from 'vitest';

import { syncOnePasswordBodyAttribute } from './onePassword';

describe('syncOnePasswordBodyAttribute', () => {
  it('ignores non-auth routes on document.body and enables autofill on /login and /register', () => {
    const attrs = new Map<string, string>();
    const fakeDoc = {
      body: {
        setAttribute: (name: string, value: string) => attrs.set(name, value),
        removeAttribute: (name: string) => attrs.delete(name),
      },
    } as unknown as Pick<Document, 'body'>;

    syncOnePasswordBodyAttribute('/davvidbaker/traces/1', fakeDoc);
    expect(attrs.has('data-1p-ignore')).toBe(true);

    syncOnePasswordBodyAttribute('/login', fakeDoc);
    expect(attrs.has('data-1p-ignore')).toBe(false);

    syncOnePasswordBodyAttribute('/register', fakeDoc);
    expect(attrs.has('data-1p-ignore')).toBe(false);

    syncOnePasswordBodyAttribute('/traces/1', fakeDoc);
    expect(attrs.has('data-1p-ignore')).toBe(true);
  });
});
