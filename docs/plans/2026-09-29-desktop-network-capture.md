# Trace desktop network capture

Codex/ChatGPT desktop recording uses the shipped macOS app's CLI override and force-CLI switches to start its own
local app-server with a private proxy and per-run certificate authority. It preserves the existing profile/account,
normal authentication and TLS verification. The already-running app is refused; no quit or restart is automatic.

The loopback resolver exposes origin/header-guarded status/start/stop endpoints. Its independent local worker owns
the proxy until the recorded app naturally exits. Stop asks the addon to take a final sanitized checkpoint and stop
retaining bodies while forwarding continues. All capture folders are local, private and gitignored.

The addon serializes detached scrubbed copies, including live WebSocket frames and partial streamed responses. It
never edits traffic sent upstream. Session association follows request-local thread metadata and exact response IDs.
Filing partitions multi-thread traffic by root/family; unidentified traffic stays unattributed. Explicit attachment
requires a known local UUID and is allowed only when the traffic contains no exact session IDs.

Implementation verification covers loopback API guards, refusal/lifecycle behavior, stopped forwarding, credential
redaction, live checkpoints, concurrent-thread correlation, HTTPS/SSE and WebSocket parsing, and CLI compatibility.
Actual desktop acceptance remains a separate gate: after explicit approval to relaunch, make a benign desktop UI
request, confirm its model request/response and thread association, and inspect it in Trace's network lens. A launched
helper, runtime receipt, fixture process or CLI capture does not establish that acceptance.
