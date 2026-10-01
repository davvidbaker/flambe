/* Minimal service worker so Chromium treats flambé as installable.
 * Network-only: no offline cache. Keep this file at the site root so scope is "/".
 */
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
