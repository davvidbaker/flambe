export function printStartup({ host, port, store, reducerInfo }, stdout = process.stdout) {
  const { rawToken, traceId } = store.credentials();
  const origin = `http://${host}:${port}`;
  const windows = process.platform === 'win32';
  const tunnelBinary = windows ? './tunnel-client.exe' : './tunnel-client';
  const tunnelPlatform = windows ? 'windows' : process.platform === 'darwin' ? 'darwin' : 'linux';
  stdout.write(`
Flambé Single Burner is running.

Open your local chart: ${origin}
Keep this terminal running. Press Ctrl+C to stop Single Burner.
Your activities are saved locally in SQLite.
Database instance ID: ${store.instance().id}
AI reducer: ${reducerInfo?.mode ?? 'off'}${reducerInfo?.model ? ` (${reducerInfo.model})` : ''}.
${reducerInfo?.mode === 'api' ? 'AI review sends activity context directly to your configured model provider.\n' : ''}

Starting this server does not record work automatically. Your agent must send
activity commands. A new database starts with an empty chart.

Connect a coding agent running on this machine

1. Install the agent CLI in a second terminal:

   npm install -g @davvidbaker/flambe-cli

2. In the project your agent works on, add or update these entries in .env:
   Keep .env out of Git. This token lets the CLI write to this local Flambé;
   it is not an npm or OpenAI credential.

FLAMBE_URL=${origin}
FLAMBE_RUNTIME_MODE=local_self_contained
FLAMBE_API_TOKEN=${rawToken}
FLAMBE_TRACE_ID=${traceId}

   Existing shell environment variables override .env. Update or remove any
   old FLAMBE_* connection settings before starting your agent.

3. For LOCAL CODEX, run this from that project directory:

   flambe setup codex

   This installs project hooks and the flambe-cli skill, preserving existing
   unrelated hooks and custom instructions. Restart local Codex and use /hooks
   to review/trust the new hook definitions. Keep the flambe CLI on PATH.
   Run flambe setup codex --check to inspect the installed files.
   Use flambe setup codex --remove to remove only Flambe's hook handlers.

   Local Codex connects directly to this server. It needs NO ChatGPT plugin,
   Platform organization, tunnel, or extra model API key. Hooks prompt regular
   tracking checkpoints; your agent still names and nests meaningful work.
   On Windows, the hook command uses flambe.cmd, including when you installed
   from Git Bash and Codex runs its hooks through the Windows shell.

4. For other coding agents, add this instruction to your project's AGENTS.md
   (or equivalent instructions file), or paste it into the agent's chat:

   Use Flambé to track substantial work. Run the flambe CLI from this project's
   directory so it reads .env. Follow the flambe-cli skill: start activities,
   nest focused work under its parent, and end activities with their outcomes.
   Skill: https://github.com/davvidbaker/flambe/blob/main/.codex/skills/flambe-cli/SKILL.md

5. Check the connection in the second terminal, from that project directory:

   flambe status --active --json

   A successful response contains an "activities" list. If it is empty
   ("activities": []), the connection worked; no activities are running yet.
   Without --json, flambe status --active prints nothing when that list is empty.
   If the command reports an error, check that this server is still running,
   that you are in the project directory, and that its .env has the values above.

6. Ask your agent to begin tracking its work. Its start/end commands will update
   the chart at ${origin}. The status check itself creates no activities.
   No npm login is needed to run Single Burner or send activities to it.

The agent must run on this machine and be able to reach ${origin}.
A cloud-hosted agent cannot reach your machine's localhost.

OPTIONAL: Connect hosted ChatGPT (requires a separate tunnel)

Local Codex users do not need this section.
Starting Single Burner does not set up a tunnel or connect hosted ChatGPT. The local
coding-agent setup above needs no tunnel. For ChatGPT, follow these steps.

1. Keep this server running. In your browser, open:
   https://platform.openai.com/settings/organization/tunnels

   Sign in with the account you use for the intended ChatGPT workspace and select
   the correct Platform organization. Create a tunnel named Single Burner and
   associate it with that ChatGPT workspace. Copy its tunnel_... ID and the
   owning org-... ID. For work, use the work organization/workspace; the personal
   connection to another computer will still access that computer's database.
   If the work workspace cannot be selected, resolve its organization association
   with your administrator before continuing.

2. In that same Platform organization, open:
   https://platform.openai.com/settings/organization/api-keys

   Create a restricted runtime key named Single Burner tunnel. Give it Tunnels
   Read + Use; no model permissions are needed. Creating/managing the tunnel
   separately requires Tunnels Read + Manage. Keep the runtime key for the hidden
   prompt below; do not paste it into chat, .env, or a shell command.

3. Download the full tunnel-client ZIP for this computer from:
   https://github.com/openai/tunnel-client/releases/latest

   Choose tunnel-client-v<version>-${tunnelPlatform}-amd64.zip for Intel/AMD,
   or tunnel-client-v<version>-${tunnelPlatform}-arm64.zip for ARM.
   Extract the whole ZIP into one folder, keeping its files together.
   Open a second ${windows ? 'Git Bash' : 'Bash'} terminal and cd into that folder.
   Run ${tunnelBinary} help quickstart to confirm it starts.

4. In that second terminal, paste the two function definitions below. Use the
   organization and tunnel IDs you chose in step 1. The two secret prompts hide
   what you type.
   The local token is FLAMBE_API_TOKEN printed near the top of THIS terminal;
   it is different from the tunnel runtime key. Keep both secrets out of chat.
   These commands use Bash syntax${windows ? ' (Git Bash on Windows)' : '; use Bash for this block'}:

   flambe_tunnel_setup() {
     read -r -p "Platform organization ID (org-...): " CONTROL_PLANE_ORGANIZATION_ID
     read -r -p "Tunnel ID (tunnel_...): " CONTROL_PLANE_TUNNEL_ID
     read -r -s -p "Tunnel runtime key (hidden): " CONTROL_PLANE_API_KEY
     printf '\\n'
     export CONTROL_PLANE_ORGANIZATION_ID CONTROL_PLANE_TUNNEL_ID CONTROL_PLANE_API_KEY
     read -r -s -p "Local Flambe token (hidden): " flambe_local_token
     printf '\\n'
     export FLAMBE_LOCAL_AUTH="Bearer $flambe_local_token"
     unset flambe_local_token
   }

   flambe_tunnel() {
     ${tunnelBinary} "$@" \\
       --control-plane.organization-id "$CONTROL_PLANE_ORGANIZATION_ID" \\
       --control-plane.tunnel-id "$CONTROL_PLANE_TUNNEL_ID" \\
       --control-plane.api-key env:CONTROL_PLANE_API_KEY \\
       --mcp.server-url ${origin}/mcp \\
       --mcp.extra-headers 'Authorization: env:FLAMBE_LOCAL_AUTH' \\
       --mcp.discovery-extra-headers 'Authorization: env:FLAMBE_LOCAL_AUTH' \\
       --health.listen-addr 127.0.0.1:8787
   }

   Then run these commands one at a time, answering the prompts:

   flambe_tunnel_setup
   flambe_tunnel doctor --explain

   Continue only when doctor succeeds. Then run:

   flambe_tunnel run

   Leave BOTH terminals running. In your browser, open:
   http://127.0.0.1:8787/ui

   Confirm the tunnel is healthy, ready, and polling before adding it in ChatGPT.
   On a later restart, repeat step 4; these commands do not save your keys.

5. In the intended ChatGPT workspace, open https://chatgpt.com/plugins
   Choose +, then Add custom MCP server. Set:

   Name: Single Burner
   Connection: Tunnel
   Tunnel: the same tunnel_... ID from step 1
   Authentication: No authentication

   No authentication is correct here because tunnel-client supplies the local
   Authorization header from step 4. Single Burner still requires its token.
   Review the access warning, then choose Create as a plugin. Your workspace
   must allow custom MCP servers; this permission is separate from tunnel access.

6. Add the Single Burner workflow skill to THAT new plugin. "Create as a plugin"
   gives it the tools; it does not automatically add our tracking/reducer skill.
   The npm install does not install a ChatGPT plugin or attach this skill either.
   The personal plugin on another account/computer is not the work connection.

   In a ChatGPT chat in the SAME workspace with Plugin Creator available, paste:

   "Update the existing private Single Burner plugin in this workspace. Inspect
   its current files and registered connection first. Add the canonical skill
   from https://raw.githubusercontent.com/davvidbaker/flambe/main/plugins/single-burner/skills/single-burner/SKILL.md
   at skills/single-burner/SKILL.md. Preserve its existing App/tunnel binding,
   visibility, other files, and presentation; increment its version. Do not
   create another plugin or copy a personal plugin's App binding. Verify the
   saved plugin contains the skill, then return its install link. If there are
   multiple matching plugins, ask me which one before editing."

   If plugin editing is unavailable, have the workspace plugin owner add that
   same skill file. A working tool connection alone is not the complete Flambe
   workflow. The workflow source is also at plugins/single-burner in our repo.

7. Open the resulting Single Burner plugin in ChatGPT Plugins and install it
   using its + button. Start a new Work chat and select @Single Burner.
   Confirm its installed skills include single-burner.

8. In that chat, ask:
   "Call flambe_traces on Single Burner. Show instance.id, instance.name, and
   reducer.mode. Do not use Cloud."

   Success: instance.name is Single Burner, instance.id matches the database ID
   printed above, and reducer.mode matches this server's AI reducer mode.
   Then ask it to track and end a short connection-test activity. In agent mode,
   also request a reducer review and verify it submits with flambe_decide.
   Do not consider setup complete until the installed plugin's tool calls work.

If doctor reports 401/403, check the runtime key's organization and Tunnels
Read + Use. If ChatGPT cannot find the tunnel, check its workspace association.
If the local MCP server returns 401, re-enter THIS database's local token.
For current upstream details:
https://developers.openai.com/api/docs/guides/secure-mcp-tunnels

Keep this server and the tunnel client running while using ChatGPT. A tunnel
runtime key is required even in agent reducer mode; a model API key is not.
Keep this connection separate from Cloud and Development.

`);
}
