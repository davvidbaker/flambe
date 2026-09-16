/** Explicit transport boundary; never infer local-only intent from a URL. */
export function runtimeConfig(env) {
  const mode = env.FLAMBE_RUNTIME_MODE?.trim();
  if (!mode) return {};
  if (!['cloud', 'local_self_contained'].includes(mode)) {
    throw new Error('FLAMBE_RUNTIME_MODE must be cloud or local_self_contained');
  }
  return { runtimeMode: mode };
}

export function assertRuntimeUrl(value, mode) {
  if (mode !== 'local_self_contained') return;
  let url;
  try { url = new URL(value); } catch {
    throw new Error('Self-contained mode requires a loopback HTTP URL');
  }
  // Numeric addresses avoid DNS resolution changing the trust boundary.
  if (!['http:', 'https:'].includes(url.protocol)
    || !['127.0.0.1', '[::1]'].includes(url.hostname)
    || url.username || url.password) {
    throw new Error('Self-contained mode requires 127.0.0.1 or [::1]; remote destinations are disabled');
  }
}
