// Navigation lives outside Redux. Sagas can use this small bridge while
// components use React Router's declarative links and hooks.
export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
