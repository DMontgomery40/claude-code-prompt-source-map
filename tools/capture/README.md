# Network capture for Trace

A session log records what the agent did. The requests on the wire show what the harness actually sent: the exact system
blocks and tools, beta flags, feature-flag values, rate-limit state, side calls that never reach the log, and the
harness's own telemetry about how it assembled the prompt. `capture.sh` records one CLI session's HTTPS traffic to a HAR
file and files it beside that session's log. From then on Trace attaches it on its own whenever you open the session:
by pasted id, through the folder picker, by dropping the session's folder, or through the local resolver.

```sh
tools/capture/capture.sh -- claude            # interactive Claude Code session
tools/capture/capture.sh -- claude -p "…"     # one-shot
tools/capture/capture.sh -- codex             # Codex/ChatGPT CLI
```

Where a capture is filed:

- Claude Code: `~/.claude/projects/<project>/<session id>/network/capture-<time>.har`, in the folder that already holds
  the session's subagents. A run that holds several sessions (a `/clear`, a resume) is filed with each of them.
- Codex/ChatGPT: `~/.codex/sessions/YYYY/MM/DD/<rollout name>.capture-<time>.har`, beside the root thread's rollout.
  Codex/ChatGPT reads only `rollout-*.jsonl` there, so the `.har` is left alone.

A HAR you already have is filed the same way (a copy; the original stays):

```sh
node tools/capture/file-capture.mjs capture-20260928-153000.har
```

`capture.sh -o DIR -- …` keeps the HAR in `DIR` instead of filing it; attach it in Trace with "+ Network capture" or by
dropping it on the open session. If no session log is found (the command made none), the HAR is kept in the current
folder. To remove a filed capture, delete the `.har` (or the session's `network/` folder).

Needs `mitmproxy` (`brew install mitmproxy`), `python3` and `node`.

## How it works

- `capture.sh` starts `mitmdump` on a free `127.0.0.1` port with a certificate authority made for this run only. Only
  the command's own process tree trusts it, through `NODE_EXTRA_CA_CERTS` (Claude Code) and `CODEX_CA_CERTIFICATE`
  (Codex/ChatGPT), and it reaches the proxy through `HTTPS_PROXY`. Nothing is added to the system keychain. The CA is
  deleted when the command exits. `localhost` traffic (local MCP servers) is not proxied.
- `trace_capture.py` (the mitmproxy addon) scrubs each flow after it has gone upstream, so requests still authenticate
  but nothing saved holds a credential. What was sent, and how, stays documented: each credential is replaced where it
  was by a description such as `Bearer <redacted by trace-capture: JWT | 1849 chars | fp 04b7401a | alg RS256 | claims
  aud,exp,…,https://api.openai.com/profile{email,email_verified,name},… | issuer https://auth.openai.com | lifetime 10d>`:
  its kind (OAuth access token, API key, npm token, JWT, cookie…), length, a fingerprint that matches the same value
  elsewhere in the same capture (and is meaningless outside it), and for a JWT its algorithm, claim names, issuer,
  audience, scopes and lifetime, never claim values. Cookies keep their names and Set-Cookie attributes. It covers auth,
  cookie and API-key headers, bearer tokens, JWTs, API keys and OAuth token fields in bodies and websocket frames, and
  token-like URL query parameters. Server-sent event streams pass through as they arrive, so an interactive session
  still streams, and are teed into the recording.
- The HAR is written once, when the command exits, then `file-capture.mjs` reads which session each request names
  (`x-claude-code-session-id`, Codex/ChatGPT's `session-id` and `thread-id`) and files it beside that session's log. Websocket traffic (Codex/ChatGPT's model connection) is kept in each
  entry's `_webSocketMessages`, the field Chrome DevTools uses.
- `check-har.mjs` then scans the file for anything that still looks like a credential and deletes the file on a hit.

## What stays in the file

Credential values are removed; the fact that each one was sent, where, and in what form stays (see above). Everything
else stays, including your prompts, file contents the agent read, and account details (email, account and organization
ids, plan). Treat a capture like the session log itself and keep it private.
Trace hides identity fields when it shows a capture, and it never uploads or stores one.

## Limits

- Every HTTPS request from the command and its children is recorded: the model API, feature flags, telemetry, MCP
  servers, and any tool the agent runs (`git`, `npm`, `curl`).
- A tool that pins certificates or ignores the proxy variables is not recorded.
- Browser chats (chatgpt.com, claude.ai) have no session log for Trace to attach a capture to. A DevTools
  "Save all as HAR" export is out of scope for now.
- Claude Code can also export its own request and response bodies through OpenTelemetry (`OTEL_LOG_RAW_API_BODIES`). That
  route needs a collector, and Trace does not read it yet.
