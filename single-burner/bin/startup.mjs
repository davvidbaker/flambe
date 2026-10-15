export function printStartup({ host, port, store }, stdout = process.stdout) {
  const { rawToken, traceId } = store.credentials();
  const origin = `http://${host}:${port}`;
  stdout.write(`
Flambé Single Burner is running.

Open your local chart: ${origin}
Keep this terminal running. Press Ctrl+C to stop Single Burner.
Your activities are saved locally in SQLite.

Connect your coding agent

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

3. Add this instruction to your project's AGENTS.md (or your agent's equivalent
   instructions file), or paste it into the agent's chat:

   Use Flambé to track substantial work. Run the flambe CLI from this project's
   directory so it reads .env. Follow the flambe-cli skill: start activities,
   nest focused work under its parent, and end activities with their outcomes.
   Skill: https://github.com/davvidbaker/flambe/blob/main/.codex/skills/flambe-cli/SKILL.md

4. Check the connection from that project directory:

   flambe status --active

   Your agent's start/end commands will update the chart at ${origin}.
   No npm login is needed to run Single Burner or send activities to it.

The agent must run on this machine and be able to reach ${origin}.
A cloud-hosted agent cannot reach your machine's localhost.
`);
}
