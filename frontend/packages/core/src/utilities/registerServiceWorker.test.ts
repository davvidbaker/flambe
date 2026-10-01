import { describe, expect, it, vi } from 'vitest';

import { registerServiceWorker } from './registerServiceWorker';

describe('registerServiceWorker', () => {
  it('registers the root service worker when available', () => {
    const register = vi.fn(() => Promise.resolve({} as ServiceWorkerRegistration));
    registerServiceWorker(register);
    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('no-ops when service workers are unavailable', () => {
    expect(() => registerServiceWorker(undefined)).not.toThrow();
  });
});
