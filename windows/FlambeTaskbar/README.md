# Flambe taskbar status (Windows)

This notification-area helper is the Windows counterpart of
[`macos/FlambeMenuBar`](../../macos/FlambeMenuBar/README.md). It shows recent,
successful bearer-token agent communication:

- outlined flame: the server is unavailable or no agent has communicated in
  the last 30 seconds;
- orange flame: one agent has communicated recently;
- blue, sparkling flame: two or more agents have communicated recently.

Requires the .NET 8 SDK on Windows. From PowerShell:

```powershell
cd windows\FlambeTaskbar
.\run.ps1 -Url http://localhost:4001
```

`run.ps1` loads `FLAMBE_URL` and `FLAMBE_API_TOKEN` from the repository `.env`
when they are not already set. The URL defaults to `http://localhost:4001`.

The helper holds one authenticated Server-Sent Events connection to Flambe; it
does not poll. If that connection drops, it reconnects after five seconds.
Right-click (or left-click) the tray flame to reconnect, preview the
disconnected icon, or quit.
