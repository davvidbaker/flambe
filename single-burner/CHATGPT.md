# Connect Single Burner to hosted ChatGPT

Local Codex connects directly and needs no tunnel. See [local Codex setup](README.md#use-it-with-local-codex).

This guide is for hosted ChatGPT. Starting Single Burner does not set up a tunnel
or connect ChatGPT. Keep the server running throughout setup. The examples use
`http://127.0.0.1:4001`; replace that address throughout if your server prints a
different port.

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

   Choose the ZIP for your OS (windows, darwin for macOS, or linux) and CPU:
   amd64 for Intel/AMD, arm64 for ARM.
   Extract the whole ZIP into one folder, keeping its files together.
   Open a second Bash terminal (Git Bash on Windows) and cd into that folder.
   Run ./tunnel-client help quickstart to confirm it starts.
   On Windows, use ./tunnel-client.exe here and in the function below.

4. In that second terminal, paste the two function definitions below. Use the
   organization and tunnel IDs you chose in step 1. The two secret prompts hide
   what you type.
   The local token is FLAMBE_API_TOKEN printed when Single Burner starts;
   it is different from the tunnel runtime key. Keep both secrets out of chat.
   Paste this in Bash (Git Bash on Windows):

   ```bash
   flambe_tunnel_setup() {
     read -r -p "Platform organization ID (org-...): " CONTROL_PLANE_ORGANIZATION_ID
     read -r -p "Tunnel ID (tunnel_...): " CONTROL_PLANE_TUNNEL_ID
     read -r -s -p "Tunnel runtime key (hidden): " CONTROL_PLANE_API_KEY
     printf '\n'
     export CONTROL_PLANE_ORGANIZATION_ID CONTROL_PLANE_TUNNEL_ID CONTROL_PLANE_API_KEY
     read -r -s -p "Local Flambe token (hidden): " flambe_local_token
     printf '\n'
     export FLAMBE_LOCAL_AUTH="Bearer $flambe_local_token"
     unset flambe_local_token
   }

   flambe_tunnel() {
     ./tunnel-client "$@" \
       --control-plane.organization-id "$CONTROL_PLANE_ORGANIZATION_ID" \
       --control-plane.tunnel-id "$CONTROL_PLANE_TUNNEL_ID" \
       --control-plane.api-key env:CONTROL_PLANE_API_KEY \
       --mcp.server-url http://127.0.0.1:4001/mcp \
       --mcp.extra-headers 'Authorization: env:FLAMBE_LOCAL_AUTH' \
       --mcp.discovery-extra-headers 'Authorization: env:FLAMBE_LOCAL_AUTH' \
       --health.listen-addr 127.0.0.1:8787
   }
   ```

   Then run these commands one at a time, answering the prompts:

   ```bash
   flambe_tunnel_setup
   flambe_tunnel doctor --explain
   ```

   Continue only when doctor succeeds. Then run:

   ```bash
   flambe_tunnel run
   ```

   Leave BOTH terminals running. In your browser, open:
   http://127.0.0.1:8787/ui

   Confirm the tunnel is healthy, ready, and polling before adding it in ChatGPT.
   On a later restart, repeat step 4; these commands do not save your keys.

5. In the intended ChatGPT workspace, open https://chatgpt.com/plugins
   Choose +, then Add custom MCP server. Set:

   - Name: **Single Burner**
   - Connection: **Tunnel**
   - Tunnel: the same `tunnel_...` ID from step 1
   - Authentication: **No authentication**

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
   printed when Single Burner starts, and reducer.mode matches this server's AI reducer mode.
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
