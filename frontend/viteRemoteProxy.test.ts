import { describe, expect, it } from 'vitest';

import {
  isLoopbackTarget,
  remoteDevProxyOptions,
  stripSecureFromSetCookie,
  targetOrigin,
  viteDevProxy,
} from './viteRemoteProxy.mjs';

describe('viteRemoteProxy', () => {
  it('treats localhost and loopback as local Mix', () => {
    expect(isLoopbackTarget('http://127.0.0.1:4001')).toBe(true);
    expect(isLoopbackTarget('http://localhost:4001')).toBe(true);
    expect(isLoopbackTarget('https://flambe.fly.dev')).toBe(false);
  });

  it('strips Secure from Set-Cookie for HTTP localhost', () => {
    expect(
      stripSecureFromSetCookie(
        '_flambe_next_key=abc; path=/; HttpOnly; Secure; SameSite=Lax',
      ),
    ).toEqual(['_flambe_next_key=abc; path=/; HttpOnly; SameSite=Lax']);
  });

  it('rewrites SameSite=None after dropping Secure', () => {
    expect(stripSecureFromSetCookie('a=1; Secure; SameSite=None')).toEqual(['a=1; SameSite=Lax']);
  });

  it('uses Origin rewrite only for remote targets', () => {
    const local = viteDevProxy('http://127.0.0.1:4001', 'http://127.0.0.1:4001');
    expect(local['/api']).toEqual({ target: 'http://127.0.0.1:4001', changeOrigin: true });
    expect(local['/settings']).toEqual({ target: 'http://127.0.0.1:4001', changeOrigin: true });
    expect(local['/socket'].configure).toBeUndefined();

    const remote = viteDevProxy('https://flambe.fly.dev', 'https://flambe.fly.dev');
    expect(remote['/api'].target).toBe('https://flambe.fly.dev');
    expect(typeof remote['/api'].configure).toBe('function');
    expect(remote['/socket'].ws).toBe(true);
    expect(remote['/socket'].headers).toEqual({ origin: 'https://flambe.fly.dev' });
    expect(targetOrigin('https://flambe.fly.dev/unused')).toBe('https://flambe.fly.dev');
    expect(remoteDevProxyOptions('https://flambe.fly.dev').changeOrigin).toBe(true);
  });
});
