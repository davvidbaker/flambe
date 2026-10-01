/** Register the root-scoped PWA service worker when the browser supports it. */
export function registerServiceWorker(
  register: typeof navigator.serviceWorker.register | undefined = typeof navigator !== 'undefined'
    && navigator.serviceWorker
    ? navigator.serviceWorker.register.bind(navigator.serviceWorker)
    : undefined,
): void {
  if (typeof register !== 'function') return;
  void register('/sw.js').catch(() => {
    // Installability is best-effort; a missing SW must not break the app.
  });
}
