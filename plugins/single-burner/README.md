# Single Burner private plugin workflow

This directory owns the workflow skill added to the existing private Single
Burner plugin. Its App binding and personal/workspace connection belong to the
registered plugin and are preserved when updating this skill. No personal App
id, tunnel credential, or model credential is packaged here.

The skill teaches instance-bound tracking and the current-work-AI review flow.
The local server must run with `FLAMBE_LOCAL_REDUCER_MODE=agent` and expose
`flambe_decide`; refresh tool discovery after restarting an updated server.
See [Single Burner setup](../../single-burner/README.md#optional-ai-reducer)
and [ADR-022](../../docs/ADR-022-work-ai-reducer-reviews.md).

## Set up another machine or a work workspace

The private plugin already installed in David's personal account is bound to
his Mac's tunnel. Installing Single Burner with npm on another machine does
not install a ChatGPT plugin, move that binding, or add this workflow skill.
Do not copy the personal plugin's `.app.json` to the work setup.

The complete setup has four parts:

1. Run Single Burner on the target machine, with `FLAMBE_LOCAL_REDUCER_MODE=agent`
   when the current work AI should perform reviews.
2. Create a tunnel associated with the intended Platform organization and
   ChatGPT workspace. Run tunnel-client on that machine with the local bearer
   token for both MCP discovery and ordinary requests. The startup message has
   Bash/Git Bash commands and the exact authentication flags.
3. In that ChatGPT workspace, use **Plugins → + → Add custom MCP server** with
   **Connection: Tunnel**, choose that tunnel, and **Create as a plugin**. This
   creates the registered tool connection; it does not automatically attach the
   skill in this directory.
4. Add `skills/single-burner/SKILL.md` from this directory to the newly created
   plugin, preserving its own registered App binding and audience. Install the
   resulting plugin and select it in a new Work chat.

For step 4, use Plugin Creator in the target workspace, or have that workspace's
plugin owner perform the update. A copyable prompt is:

> Update the existing private Single Burner plugin in this workspace. Inspect
> its current files and registered connection first. Add the canonical skill
> from https://raw.githubusercontent.com/davvidbaker/flambe/main/plugins/single-burner/skills/single-burner/SKILL.md
> at skills/single-burner/SKILL.md. Preserve its existing App/tunnel binding,
> visibility, other files, and presentation; increment its version. Do not
> create another plugin or copy a personal plugin's App binding. Verify the
> saved plugin contains the skill, then return its install link. If there are
> multiple matching plugins, ask me which one before editing.

Confirm the installed plugin contains the `single-burner` skill. Call
`flambe_traces` through it and compare `instance.id` with the target server's
startup output. In agent mode, complete a test review using `flambe_message`
and `flambe_decide`, then end the test activity. Discovery alone verifies tool
reachability; it does not verify that the complete tracking/reducer workflow
is installed and working.

This workflow was verified for the personal Mac connection. A fresh Windows
work-workspace installation still requires live verification. The work plugin
must be created/updated in that workspace; the personal connection does not
establish its availability or editing permissions there.
