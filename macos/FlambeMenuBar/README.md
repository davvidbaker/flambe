# Flambe menu-bar status

This macOS helper shows recent, successful bearer-token agent communication:

- outlined flame: the server is unavailable or no agent has communicated in
  the last 30 seconds;
- orange flame: one agent has communicated recently;
- blue, sparkling flame: two or more agents have communicated recently.

Launch it as a persistent macOS app with Swift 5.7 or newer:

```sh
cd macos/FlambeMenuBar
bash run.sh --url http://localhost:4001
```

`run.sh` loads `FLAMBE_URL` and `FLAMBE_API_TOKEN` from the repository's
`.env` file when they are not already set. The URL defaults to
`http://localhost:4001`.

`run.sh` creates a local `.app` bundle under `.build/` and launches it with
macOS, so it remains open after the terminal command completes. The helper
holds one authenticated Server-Sent Events connection to Flambe; it does not
poll. If that connection drops, it reconnects after five seconds. Use the
menu-bar icon to reconnect manually or quit the helper.
