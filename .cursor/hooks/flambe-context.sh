#!/bin/bash
# Inject Flambe protocol context for Cursor (local and Cloud). Fail open.
# Do not print secrets. No machine-specific paths.

input=$(cat)
event=$(printf '%s' "$input" | python3 -c 'import json,sys
try:
    data=json.load(sys.stdin)
except Exception:
    data={}
print(data.get("hook_event_name") or data.get("event") or "")' 2>/dev/null)

flambe_configured() {
  if [ -n "${FLAMBE_URL:-}" ]; then
    return 0
  fi
  if [ -f .env ] && grep -Eq '^[[:space:]]*FLAMBE_URL[[:space:]]*=' .env; then
    return 0
  fi
  return 1
}

if ! flambe_configured; then
  echo '{}'
  exit 0
fi

if command -v flambe >/dev/null 2>&1; then
  flambe ping >/dev/null 2>&1 || true
elif [ -f cli/bin/flambe.mjs ] && command -v node >/dev/null 2>&1; then
  node cli/bin/flambe.mjs ping >/dev/null 2>&1 || true
fi

case "$event" in
  subagentStart|SubagentStart)
    msg="Flambe protocol: before substantive work, inspect active and suspended activities, then start or resume a semantic activity. Start and end nested activities as focus changes."
    ;;
  beforeSubmitPrompt|UserPromptSubmit|sessionStart|SessionStart)
    msg="Flambe protocol: do not begin substantive unrepresented work. Update the trace before changing semantic focus."
    ;;
  *)
    echo '{}'
    exit 0
    ;;
esac

python3 -c 'import json,sys
print(json.dumps({"additional_context": sys.argv[1]}))' "$msg"
exit 0
