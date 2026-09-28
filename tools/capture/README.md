# Network capture for Trace

A session log records what the agent did. The requests on the wire show what the harness actually sent: the exact system
blocks and tools, beta flags, feature-flag values, rate-limit state, side calls that never reach the log, and the
harness's own telemetry about how it assembled the prompt. `capture.sh` records one CLI session's HTTPS traffic to a HAR
file. Trace attaches that HAR to the session's log and shows the wire next to the landscape.

```sh
tools/capture/capture.sh -o ~/captures -- claude            # interactive Claude Code session
tools/capture/capture.sh -o ~/captures -- claude -p "…"     # one-shot
tools/capture/capture.sh -o ~/captures -- codex             # Codex/ChatGPT CLI
```

Then open Trace and drop the session's log together with the `capture-*.har` it printed. Claude Code sessions are in
`~/.claude/projects/`, Codex/ChatGPT rollouts in `~/.codex/sessions/`.

Needs `mitmproxy` (`brew install mitmproxy`), `python3` and `node`.

## How it works

- `capture.sh` starts `mitmdump` on a free `127.0.0.1` port with a certificate authority made for this run only. Only
  the command's own process tree trusts it, through `NODE_EXTRA_CA_CERTS` (Claude Code) and `CODEX_CA_CERTIFICATE`
  (Codex/ChatGPT), and it reaches the proxy through `HTTPS_PROXY`. Nothing is added to the system keychain. The CA is
  deleted when the command exits. `localhost` traffic (local MCP servers) is not proxied.
- `trace_capture.py` (the mitmproxy addon) scrubs each flow after it has gone upstream, so requests still authenticate
  but nothing saved holds a credential. It removes auth, cookie and API-key headers, and bearer tokens, API keys and
  OAuth token fields in bodies and websocket frames. Server-sent event streams pass through as they arrive, so an
  interactive session still streams, and are teed into the recording.
- The HAR is written once, when the command exits. Websocket traffic (Codex/ChatGPT's model connection) is kept in each
  entry's `_webSocketMessages`, the field Chrome DevTools uses.
- `check-har.mjs` then scans the file for anything that still looks like a credential and deletes the file on a hit.

## What stays in the file

Credentials are removed. Everything else stays, including your prompts, file contents the agent read, and account
details (email, account and organization ids, plan). Treat a capture like the session log itself and keep it private.
Trace hides identity fields when it shows a capture, and it never uploads or stores one.

## Limits

- Every HTTPS request from the command and its children is recorded: the model API, feature flags, telemetry, MCP
  servers, and any tool the agent runs (`git`, `npm`, `curl`).
- A tool that pins certificates or ignores the proxy variables is not recorded.
- Browser chats (chatgpt.com, claude.ai) have no session log for Trace to attach a capture to. A DevTools
  "Save all as HAR" export is out of scope for now.
- Claude Code can also export its own request and response bodies through OpenTelemetry (`OTEL_LOG_RAW_API_BODIES`). That
  route needs a collector, and Trace does not read it yet.
