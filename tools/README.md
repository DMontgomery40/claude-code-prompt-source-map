# Trace local resolver

From `site/`, run `npm run build` and `npm run trace:local`. Open
`http://127.0.0.1:8766/trace/` and paste a session ID. With the matching client
changes deployed, the two hosted Trace pages can use the same resolver. The
browser may ask once for local-network access to the resolver.

The resolver binds only to `127.0.0.1:8766`. It reads the requested session family
from `~/.codex/sessions` or `~/.claude/projects`; it refreshes the file inventory
for every pasted ID. Parsing and rendering remain in the browser. Session data
is not uploaded to the hosted site. Stop the process to disable local access.
Nothing is installed at login by this command.

Only the two exact hosted origins (`https://gpt6aeon.dtmont.com` and
`https://ccprompts.dtmont.com`) and the resolver's own origin can call the session
API. Requests require a custom header, and file reads use expiring opaque tokens
for the selected family. There is no arbitrary-path or directory-listing API.
Symlinks under the session roots are skipped. Host checks reject DNS rebinding.

Verify with `npm test`, `npm run test:local`, and `npm run build` from `site/`.
The local resolver tests use temporary synthetic sessions and a real HTTP server;
private user sessions must never be added as fixtures or copied into `site/dist`.
