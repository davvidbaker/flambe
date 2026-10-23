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
