/**
 * When Vite proxies to a remote Phoenix (Fly today, staging later), rewrite
 * Origin so production `check_origin` accepts the WebSocket, and drop `Secure`
 * from Set-Cookie so http://localhost can store the session.
 */

export function isLoopbackTarget(urlString) {
  try {
    const { hostname } = new URL(urlString);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return true;
  }
}

export function targetOrigin(urlString) {
  return new URL(urlString).origin;
}

export function stripSecureFromSetCookie(value) {
  const cookies = Array.isArray(value) ? value : [value];
  return cookies.map((cookie) =>
    cookie
      .replace(/;\s*Secure\b/gi, '')
      .replace(/;\s*SameSite=None\b/gi, '; SameSite=Lax'),
  );
}

function rewriteOriginHeaders(proxyReq, origin) {
  proxyReq.setHeader('origin', origin);
  proxyReq.setHeader('referer', `${origin}/`);
}

export function remoteDevProxyOptions(target, { websocket = false } = {}) {
  const origin = targetOrigin(target);
  return {
    target,
    changeOrigin: true,
    ...(websocket ? { ws: true, headers: { origin } } : {}),
    configure(proxy) {
      proxy.on('proxyReq', (proxyReq) => {
        rewriteOriginHeaders(proxyReq, origin);
      });
      proxy.on('proxyReqWs', (proxyReq) => {
        rewriteOriginHeaders(proxyReq, origin);
      });
      proxy.on('proxyRes', (proxyRes) => {
        const setCookie = proxyRes.headers['set-cookie'];
        if (setCookie) {
          proxyRes.headers['set-cookie'] = stripSecureFromSetCookie(setCookie);
        }
      });
    },
  };
}

export function viteDevProxy(apiTarget, socketTarget) {
  if (isLoopbackTarget(apiTarget) && isLoopbackTarget(socketTarget)) {
    return {
      '/api': { target: apiTarget, changeOrigin: true },
      '/auth': { target: apiTarget, changeOrigin: true },
      '/settings': { target: apiTarget, changeOrigin: true },
      '/socket': { target: socketTarget, changeOrigin: true, ws: true },
    };
  }

  return {
    '/api': remoteDevProxyOptions(apiTarget),
    '/auth': remoteDevProxyOptions(apiTarget),
    '/settings': remoteDevProxyOptions(apiTarget),
    '/socket': remoteDevProxyOptions(socketTarget, { websocket: true }),
  };
}
