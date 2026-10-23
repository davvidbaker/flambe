import { CommandError } from './commands.mjs';

const configError = message => new CommandError(503, 'REDUCER_CONFIG_INVALID', message);
const providerError = message => new CommandError(502, 'REDUCER_PROVIDER_ERROR', message);
const loopback = host => ['127.0.0.1', 'localhost', '[::1]'].includes(host);

/** Explicit opt-in: unrelated OPENAI_API_KEY/Cloud settings never enable review. */
export function reducerConfig(env = process.env) {
  const mode = env.FLAMBE_LOCAL_REDUCER_MODE ?? 'off';
  if (mode === 'off') return { mode };
  if (mode === 'agent') {
    const reviewStarts = env.FLAMBE_LOCAL_REDUCER_REVIEW_STARTS ?? 'false';
    if (!['false', 'true'].includes(reviewStarts)) throw configError('FLAMBE_LOCAL_REDUCER_REVIEW_STARTS must be true or false.');
    return { mode, reviewStarts: reviewStarts === 'true' };
  }
  if (!['api', 'local'].includes(mode)) throw configError('FLAMBE_LOCAL_REDUCER_MODE must be off, agent, api, or local.');
  const model = env.FLAMBE_LOCAL_REDUCER_MODEL?.trim();
  if (!model) throw configError('Set FLAMBE_LOCAL_REDUCER_MODEL explicitly.');
  let base;
  try {
    base = new URL(env.FLAMBE_LOCAL_REDUCER_BASE_URL ?? (mode === 'api'
      ? 'https://api.openai.com/v1/' : 'http://127.0.0.1:11434/'));
  } catch { throw configError('The reducer base URL is invalid.'); }
  if (base.username || base.password || base.search || base.hash) {
    throw configError('The reducer URL must not contain credentials, a query, or a fragment.');
  }
  if (mode === 'local' && (!['http:', 'https:'].includes(base.protocol) || !loopback(base.hostname))) {
    throw configError('Local reducer mode requires a loopback model endpoint.');
  }
  if (mode === 'local' && /(?:^|[-:])cloud(?:$|[-:])/i.test(model)) {
    throw configError('Choose an installed local model, not a cloud model.');
  }
  if (mode === 'api' && base.protocol !== 'https:') throw configError('API reducer mode requires HTTPS.');
  const apiKey = mode === 'api' ? env.FLAMBE_LOCAL_REDUCER_API_KEY?.trim() : undefined;
  if (mode === 'api' && !apiKey) throw configError('Set FLAMBE_LOCAL_REDUCER_API_KEY for API mode.');
  const timeoutMs = Number(env.FLAMBE_LOCAL_REDUCER_TIMEOUT_MS ?? 30_000);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 90_000) {
    throw configError('Reducer timeout must be between 1 and 90000 milliseconds.');
  }
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  return { mode, model, apiKey, timeoutMs,
    endpoint: new URL(mode === 'api' ? 'responses' : 'api/chat', base).href };
}

async function boundedJson(response) {
  if (!response.ok) {
    await response.body?.cancel();
    throw providerError(`Model request failed (HTTP ${response.status}).`);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_048_576) throw providerError('Model response exceeded the size limit.');
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); }
}

export function createReducerProvider(config, { fetchImpl = globalThis.fetch } = {}) {
  return {
    mode: config.mode,
    model: config.model,
    reviewStarts: config.reviewStarts,
    async review({ system, context, schema }) {
      if (['off', 'agent'].includes(config.mode)) throw new CommandError(503, 'REDUCER_NOT_CONFIGURED', 'AI reducer review is off.');
      const input = JSON.stringify(context);
      const body = config.mode === 'api' ? {
        model: config.model, store: false, max_output_tokens: 2000,
        input: [{ role: 'system', content: system }, { role: 'user', content: input }],
        text: { format: { type: 'json_schema', name: 'flambe_reducer_decision', strict: true, schema } },
      } : {
        model: config.model, stream: false, format: schema,
        messages: [{ role: 'system', content: system }, { role: 'user', content: input }],
        options: { temperature: 0, num_predict: 2000 },
      };
      try {
        const response = await fetchImpl(config.endpoint, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(config.timeoutMs),
          headers: { 'content-type': 'application/json', ...(config.mode === 'api'
            ? { authorization: `Bearer ${config.apiKey}` } : {}) },
          body: JSON.stringify(body),
        });
        const data = await boundedJson(response);
        if ((config.mode === 'api' && data.status && data.status !== 'completed')
          || data.done === false || data.done_reason === 'length') throw providerError('Model response was incomplete.');
        const text = config.mode === 'local' ? data.message?.content
          : data.output?.flatMap(item => item.content ?? []).find(item => item.type === 'output_text')?.text;
        if (typeof text !== 'string') throw providerError('Model did not return a decision.');
        return JSON.parse(text);
      } catch (error) {
        if (error instanceof CommandError) throw error;
        if (['TimeoutError', 'AbortError'].includes(error?.name)) {
          throw new CommandError(504, 'REDUCER_TIMEOUT', 'AI reducer review timed out.');
        }
        // Never return provider response bodies, URLs, headers, or credential-bearing errors.
        throw providerError('AI reducer request failed or returned invalid JSON.');
      }
    },
  };
}
