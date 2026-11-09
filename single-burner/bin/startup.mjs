const guide = 'https://github.com/davvidbaker/flambe/tree/main/single-burner';

export function printStartup({ host, port, store, reducerInfo, logPath, version, engineVersion }, stdout = process.stdout) {
  const { rawToken, traceId } = store.credentials();
  const origin = `http://${host}:${port}`;
  const color = stdout.isTTY && !('NO_COLOR' in process.env) && process.env.TERM !== 'dumb';
  const heading = text => color ? `\x1b[1;36m${text}\x1b[0m` : text;
  const mode = reducerInfo?.mode ?? 'off';
  const reducer = mode === 'agent' ? 'agent (your current work AI)'
    : `${mode}${reducerInfo?.model ? ` (${reducerInfo.model})` : ''}`;

  stdout.write(`
  ${heading(`Flambé Single Burner v${version ?? 'unknown'}`)}
  Running locally. Keep this terminal open; Ctrl+C to stop.

  Chart     ${origin}
  Storage   SQLite on this machine
  Version   ${version ?? 'unknown'} (engine ${engineVersion ?? 'unknown'})
  Log       ${logPath ?? 'disabled'}
  View logs flambe-single-burner logs${logPath ? ` --log ${JSON.stringify(logPath)}` : ''}
  Instance  ${store.instance().id}
  Reducer   ${reducer}
${mode === 'api' ? '  AI review sends activity context to your configured model provider.\n' : ''}${mode === 'codex' ? '  Independent AI review sends activity context through a dedicated Codex login.\n' : ''}${mode === 'off' ? '  Thread selection: AI is off; new roots without a thread use the first-ranked thread.\n' : ''}
${mode === 'codex' && reducerInfo.loginHelp ? `  ${heading('Reducer Codex authentication')}\n  ${reducerInfo.loginHelp}\n\n` : ''}  ${heading('Connect local Codex · one-time setup')}

  1. In a second terminal, install the agent CLI:
     npm install -g @davvidbaker/flambe-cli

  2. Add these values to your project's .env. Keep .env out of Git:

FLAMBE_URL=${origin}
FLAMBE_RUNTIME_MODE=local_self_contained
FLAMBE_API_TOKEN=${rawToken}
FLAMBE_TRACE_ID=${traceId}

  3. From that project, run: flambe setup codex
     Restart Codex, then open /hooks to review/trust the hooks.
     Local Codex needs no tunnel, ChatGPT plugin, or extra API key.

  ${heading('Connect Pi · automatic request headlines')}

  Install the same CLI globally, then install its Pi extension:
     pi install npm:@davvidbaker/flambe-cli
     Restart Pi after installation; it reads the same project .env.
     Each Pi user request gets a root activity; its subactivities nest inside.

  ${heading('Check the connection')}
     flambe status --active --json
     "activities": [] means connected, with no work running yet.
     Without --json, an empty list prints nothing. Your agent records work.
     Existing shell FLAMBE_* values override .env; update old connections.

  ${heading('Guides: other agents, hosted ChatGPT, and reducer setup')}
  ${guide}

`);
}
