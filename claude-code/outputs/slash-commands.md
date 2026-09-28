# Claude Code built-in slash commands

{{count:slash-commands kind=slash-command}} built-in slash command definitions ({{count:slash-commands group="Bundled skill commands"}} of them bundled skills) in Claude Code ({{distinct:slash-commands details.name}} distinct names): {{count:slash-commands documented=*}} documented, {{count:slash-commands documented=null}} undocumented, {{count:slash-commands details.hidden=true}} hidden by a literal `isHidden`. Gates are recorded only as literal values or the literal names their conditions reference. Registrations whose names are computed at runtime are not listed.

## Local commands

### /add-dir (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187582641 · sha256 `5cc485bc…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `<path>`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Add a new working directory
~~~~~~

### /add-dir (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187582904 · sha256 `5cc485bc…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `<path>`

~~~~~~text
Add a new working directory
~~~~~~

### /advisor (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187900559 · sha256 `2b611ff8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Let Claude consult a stronger model at key moments
~~~~~~

### /advisor (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187900894 · sha256 `2b611ff8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Let Claude consult a stronger model at key moments
~~~~~~

### /artifacts

Source: `chunk-ra61p37g.js` · offset 187584151 · sha256 `8b9f20cc…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Browse your published and shared artifacts
~~~~~~

### /auto-mode-setup (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187583574 · sha256 `8e164cfa…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[--request-id <uuid>] (--wizard posture=… scope=… depth=… --propose | --expect-sha256 <64-hex> --apply-file <path>)`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Teach auto mode about your environment, plus optional rule tweaks
~~~~~~

### /auto-mode-setup (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187583950 · sha256 `8e164cfa…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Teach auto mode about your environment, plus optional rule tweaks
~~~~~~

### /autocompact (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187591690 · sha256 `2e29ad95…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[auto|<tokens>]`

isEnabled: computed at runtime

isHidden: `false`

~~~~~~text
Set how full the context gets before auto-summarizing
~~~~~~

### /autocompact (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187591967 · sha256 `58d6836b…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[auto|<tokens>]`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Configure the auto-compact window size
~~~~~~

### /autofix-pr (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187584362 · sha256 `6c32fdf3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Monitor and autofix any issues with the current PR
~~~~~~

### /autofix-pr (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187902801 · sha256 `6c32fdf3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local (built by a command factory)`

~~~~~~text
Monitor and autofix any issues with the current PR
~~~~~~

### /background

Source: `chunk-rtsj15er.js` · offset 198794900 · sha256 `b7f09c3b…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/bg`

Argument hint: `[prompt]`

isEnabled: `true`

~~~~~~text
Send this session to the background and free the terminal
~~~~~~

### /branch

Source: `chunk-ra61p37g.js` · offset 187893417 · sha256 `5ae03e00…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[name]`

~~~~~~text
Create a branch of the current conversation at this point
~~~~~~

### /brief

Source: `chunk-dekwpew8.js` · offset 198884225 · sha256 `52458610…`

Status: undocumented

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Toggle brief-only mode
~~~~~~

### /btw

Source: `chunk-ra61p37g.js` · offset 187584632 · sha256 `52bc31e3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[question]`

~~~~~~text
Ask a quick side question without interrupting the main conversation
~~~~~~

### /bug

Source: `chunk-ra61p37g.js` · offset 187585069 · sha256 `d64ca096…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/share`

Argument hint: `[report]`

~~~~~~text
Report a bug or share your conversation
~~~~~~

### /cd

Source: `chunk-ra61p37g.js` · offset 187585223 · sha256 `bedfe2a5…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `<path>`

~~~~~~text
Move this session to a new working directory
~~~~~~

### /chrome

Source: `chunk-ra61p37g.js` · offset 187900011 · sha256 `57d70076…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Open Claude in Chrome settings
~~~~~~

### /clear

Source: `chunk-ra61p37g.js` · offset 187585348 · sha256 `d879dc70…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Aliases: `/reset`, `/new`

Argument hint: `[name]`

~~~~~~text
Start a new session with empty context; previous session stays on disk (resumable with /resume)
~~~~~~

### /cloud-plugins

Source: `chunk-ra61p37g.js` · offset 187583099 · sha256 `9f8fa961…`

Status: undocumented

Type: `local-jsx`

isEnabled: gated (condition references `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`)

~~~~~~text
Choose whether cloud sessions use the plugins enabled on this machine
~~~~~~

### /color (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187585659 · sha256 `d97f485c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[red|blue|green|yellow|purple|orange|pink|cyan|default]`

Interpolated constants (resolved from code): `Bh` = `["red","blue","green","yellow","purple","orange","pink","cyan"]`

~~~~~~text
Set the prompt bar color for this session
~~~~~~

### /color (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187585942 · sha256 `d97f485c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[red|blue|green|yellow|purple|orange|pink|cyan|default]`

isEnabled: computed at runtime

isHidden: computed at runtime

Interpolated constants (resolved from code): `Bh` = `["red","blue","green","yellow","purple","orange","pink","cyan"]`

~~~~~~text
Set the prompt bar color for this session
~~~~~~

### /compact

Source: `chunk-ra61p37g.js` · offset 185920582 · sha256 `6469e86a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `<optional custom summarization instructions>`

isEnabled: gated (condition references `DISABLE_COMPACT`)

~~~~~~text
Free up context by summarizing the conversation so far
~~~~~~

### /config (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187592267 · sha256 `f0247715…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/settings`

Argument hint: `[key=value]`

~~~~~~text
Open settings
~~~~~~

### /config (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187592587 · sha256 `bcf0e110…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Aliases: `/settings`

Argument hint: `key=value`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Set a setting by key
~~~~~~

### /context (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187593369 · sha256 `5e903685…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[all]`

isEnabled: computed at runtime

~~~~~~text
Visualize current context usage as a colored grid
~~~~~~

### /context (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187593596 · sha256 `bb97777d…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Show current context usage
~~~~~~

### /copy

Source: `chunk-ra61p37g.js` · offset 187586190 · sha256 `01b91a65…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Copy Claude's last response to clipboard (or /copy N for the Nth-latest)
~~~~~~

### /daemon

Source: `chunk-zm3f67pt.js` · offset 198864807 · sha256 `e47cd881…`

Status: undocumented

Type: `local-jsx`

~~~~~~text
Manage background services and routines
~~~~~~

### /design-login

Source: `chunk-ra61p37g.js` · offset 187621836 · sha256 `b2e3f9b8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Authorize design-system access for /design-sync with your claude.ai account
~~~~~~

### /desktop

Source: `chunk-ra61p37g.js` · offset 187586420 · sha256 `c1703e0a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/app`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Continue the current session in Claude Desktop
~~~~~~

### /diff

Source: `chunk-ra61p37g.js` · offset 187593737 · sha256 `b95a2536…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187593737.

### /effort (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187912671 · sha256 `e9ef028a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Set effort level for model usage
~~~~~~

### /effort (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187912885 · sha256 `e9ef028a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Set effort level for model usage
~~~~~~

### /exit (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187903063 · sha256 `59fffe9f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/quit`

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187903063.

### /exit (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187903233 · sha256 `43c51ca3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187903233.

### /export

Source: `chunk-ra61p37g.js` · offset 187903725 · sha256 `e7a6fef6…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[filename]`

~~~~~~text
Export the current conversation to a file or clipboard
~~~~~~

### /fast (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187892222 · sha256 `4b7317b8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[on|off]`

isHidden: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187892222.

### /fast (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187892431 · sha256 `77530a31…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[on|off]`

isEnabled: computed at runtime

isHidden: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187892431.

### /feedback

Source: `chunk-ra61p37g.js` · offset 187584893 · sha256 `48754384…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[report]`

~~~~~~text
Send feedback to Anthropic or report a bug
~~~~~~

### /focus (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187913336 · sha256 `6f31ffc8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Toggle focus view: just your prompt, summary, and response
~~~~~~

### /focus (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187914996 · sha256 `6f31ffc8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[on|off]`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Toggle focus view: just your prompt, summary, and response
~~~~~~

### /fork (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187893608 · sha256 `e0997af2…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `<directive>`

isEnabled: computed at runtime

~~~~~~text
Spawn a background agent that inherits the full conversation
~~~~~~

### /fork (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187893819 · sha256 `641ba59c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[prompt]`

isEnabled: computed at runtime

~~~~~~text
Copy this conversation into a new background session and keep working here
~~~~~~

### /goal (definition 1 of 2, `chunk-r5njk73f.js`)

Source: `chunk-r5njk73f.js` · offset 198833472 · sha256 `9a733d16…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[<condition> | clear]`

~~~~~~text
Set a goal Claude checks before stopping
~~~~~~

### /goal (definition 2 of 2, `chunk-r5njk73f.js`)

Source: `chunk-r5njk73f.js` · offset 198833663 · sha256 `cc53511f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Set a goal — keep working until the condition is met
~~~~~~

### /help

Source: `chunk-ra61p37g.js` · offset 187594548 · sha256 `23e720a1…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Show help and available commands
~~~~~~

### /hooks

Source: `chunk-ra61p37g.js` · offset 187893146 · sha256 `75ca739e…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
View hook configurations for tool events
~~~~~~

### /ide

Source: `chunk-ra61p37g.js` · offset 187594693 · sha256 `7792c72e…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[open]`

~~~~~~text
Manage IDE integrations and show status
~~~~~~

### /import (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187595735 · sha256 `5061f6b3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[codex|gemini|cursor] [--dry-run]`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Import config from another AI coding agent
~~~~~~

### /import (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187595956 · sha256 `5061f6b3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Import config from another AI coding agent
~~~~~~

### /install

Source: `chunk-qc5ntwm7.js` · offset 212388702 · sha256 `235841f2…`

Status: undocumented

Type: `local-jsx`

Argument hint: `[options]`

~~~~~~text
Install Claude Code native build
~~~~~~

### /install-github-app

Source: `chunk-ra61p37g.js` · offset 187622473 · sha256 `0c15077b…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: gated (condition references `DISABLE_INSTALL_GITHUB_APP_COMMAND`)

~~~~~~text
Set up Claude GitHub Actions for a repository
~~~~~~

### /install-slack-app

Source: `chunk-ra61p37g.js` · offset 187622678 · sha256 `4e344812…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

~~~~~~text
Install the Claude Slack app
~~~~~~

### /keybindings

Source: `chunk-ra61p37g.js` · offset 187621138 · sha256 `cc5dbc0a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

~~~~~~text
Open your keyboard shortcuts file
~~~~~~

### /list-agents

Source: `chunk-7ts6tag1.js` · offset 198832292 · sha256 `8ffbeeb0…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Aliases: `/peers`

isEnabled: computed at runtime

~~~~~~text
List subagents, teammates, and other Claude sessions you can message
~~~~~~

### /login

Source: `chunk-ra61p37g.js` · offset 187621963 · sha256 `28c0482e…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: gated (condition references `DISABLE_LOGIN_COMMAND`)

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187621963.

### /logout

Source: `chunk-ra61p37g.js` · offset 187622221 · sha256 `6e6288ca…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: gated (condition references `DISABLE_LOGOUT_COMMAND`)

~~~~~~text
Sign out from your Anthropic account
~~~~~~

### /loops

Source: `chunk-ra61p37g.js` · offset 187893293 · sha256 `54168081…`

Status: undocumented

Type: `local-jsx`

isEnabled: `false`

~~~~~~text
List, create, and delete loops
~~~~~~

### /mcp (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187622943 · sha256 `c2c551b3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[reconnect|enable|disable [<server>|all]]`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Manage MCP servers
~~~~~~

### /mcp (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187623195 · sha256 `c2c551b3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[reconnect (<server>|all)|enable|disable [<server>|all]]`

~~~~~~text
Manage MCP servers
~~~~~~

### /memory

Source: `chunk-ra61p37g.js` · offset 187594088 · sha256 `fb6fd517…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Edit CLAUDE.md files and memory settings
~~~~~~

### /mobile

Source: `chunk-ra61p37g.js` · offset 187623414 · sha256 `911b1a74…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/ios`, `/android`

~~~~~~text
Show QR code to download the Claude mobile app
~~~~~~

### /model (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187903908 · sha256 `4ed26d50…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `<model>`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Set the AI model for Claude Code
~~~~~~

### /model (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187904068 · sha256 `3819d381…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[model]`

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187904068.

### /output-style

Source: `chunk-ra61p37g.js` · offset 187593135 · sha256 `845433e1…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[style]`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
List output styles or switch to one
~~~~~~

### /passes

Source: `chunk-ra61p37g.js` · offset 187892675 · sha256 `a293185e…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isHidden: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187892675.

### /pause-memory

Source: `chunk-ra61p37g.js` · offset 187594278 · sha256 `d49d7b56…`

Status: undocumented

Type: `local`

Aliases: `/memory-pause`, `/toggle-memory`

isEnabled: `false`

isHidden: `false`

~~~~~~text
Pause automemory for this session
~~~~~~

### /permissions

Source: `chunk-ra61p37g.js` · offset 187891944 · sha256 `5a68c592…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/allowed-tools`

~~~~~~text
Manage allow and deny tool permission rules
~~~~~~

### /plan

Source: `chunk-ra61p37g.js` · offset 187892099 · sha256 `5d041f82…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[open|<description>]`

~~~~~~text
Enable plan mode or view the current session plan
~~~~~~

### /plugin

Source: `chunk-ra61p37g.js` · offset 187894834 · sha256 `4ddd75bf…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/plugins`, `/marketplace`

~~~~~~text
Manage Claude Code plugins
~~~~~~

### /plugin-types

Source: `chunk-ra61p37g.js` · offset 187895106 · sha256 `bb922139…`

Status: undocumented

Type: `local`

Argument hint: `[dir]`

~~~~~~text
Write claude-code.d.ts, claude-code-plugins.d.ts and claude-code-mcp.d.ts: the plugin API's TypeScript declarations, the enabled plugins' type contracts and the inputs of the connected MCP tools, for typing a hooks module against this session
~~~~~~

### /powerup

Source: `chunk-ra61p37g.js` · offset 187623832 · sha256 `08c74ce2…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Discover Claude Code features through quick interactive lessons
~~~~~~

### /privacy-settings

Source: `chunk-ra61p37g.js` · offset 187893009 · sha256 `787e5dc1…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
View and update your privacy settings
~~~~~~

### /radio

Source: `chunk-ra61p37g.js` · offset 187900387 · sha256 `387887d0…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

~~~~~~text
Listen to Claude FM lo-fi radio
~~~~~~

### /rate-limit-options

Source: `chunk-ra61p37g.js` · offset 187906230 · sha256 `1b2d6d5f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Manage usage limits and upgrade options
~~~~~~

### /recap

Source: `chunk-2p2xj0m3.js` · offset 198879543 · sha256 `21ea02a9…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

~~~~~~text
Generate a one-line session recap now
~~~~~~

### /release-notes

Source: `chunk-ra61p37g.js` · offset 187623938 · sha256 `d3750dfd…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
View release notes
~~~~~~

### /reload-plugins

Source: `chunk-ra61p37g.js` · offset 187895506 · sha256 `277cd7ff…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[--force]`

~~~~~~text
Activate pending plugin changes in the current session
~~~~~~

### /reload-skills

Source: `chunk-ra61p37g.js` · offset 187895785 · sha256 `3b405e96…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

~~~~~~text
Pick up skills added or changed on disk during this session
~~~~~~

### /remote-control (definition 1 of 2, `chunk-2mvpxmqb.js`)

Source: `chunk-2mvpxmqb.js` · offset 198863842 · sha256 `746a2063…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/rc`

isEnabled: computed at runtime

isHidden: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-2mvpxmqb.js` offset 198863842.

### /remote-control (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187902549 · sha256 `dc8b8572…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local (built by a command factory)`

Aliases: `/rc`

~~~~~~text
Control this session from your phone or claude.ai/code
~~~~~~

### /remote-env

Source: `chunk-ra61p37g.js` · offset 187904331 · sha256 `e4a76f28…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Choose the default environment for cloud agents
~~~~~~

### /rename (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187624093 · sha256 `791d99d5…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/name`

Argument hint: `[name]`

~~~~~~text
Rename the current conversation
~~~~~~

### /rename (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187624318 · sha256 `791d99d5…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Aliases: `/name`

Argument hint: `[name]`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Rename the current conversation
~~~~~~

### /resume

Source: `chunk-ra61p37g.js` · offset 187624532 · sha256 `1dd9caf3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/continue`

Argument hint: `[conversation id or search term]`

~~~~~~text
Resume a previous conversation
~~~~~~

### /rewind

Source: `chunk-ra61p37g.js` · offset 187895984 · sha256 `b04bc5f5…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Aliases: `/checkpoint`, `/undo`

~~~~~~text
Restore the code and/or conversation to a previous point
~~~~~~

### /sandbox

Source: `chunk-ra61p37g.js` · offset 187899158 · sha256 `2da1aade…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isHidden: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187899158.

### /schedule (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187902709 · sha256 `9e19563c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local (built by a command factory)`

Aliases: `/routines`

~~~~~~text
Create and manage scheduled remote Claude Code agents
~~~~~~

### /scroll-speed

Source: `chunk-ra61p37g.js` · offset 187625868 · sha256 `35d4450c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Adjust mouse wheel scroll speed
~~~~~~

### /session

Source: `chunk-ra61p37g.js` · offset 187625589 · sha256 `d22023b6…`

Status: undocumented

Type: `local-jsx`

Aliases: `/remote`

isEnabled: computed at runtime

isHidden: gated (condition references `fanout`)

~~~~~~text
Show cloud session URL and QR code
~~~~~~

### /setup-bedrock

Source: `chunk-ra61p37g.js` · offset 187624702 · sha256 `9049309c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isHidden: gated (condition references `CLAUDE_CODE_USE_BEDROCK`)

~~~~~~text
Reconfigure Amazon Bedrock authentication, region, or model pins
~~~~~~

### /setup-vertex

Source: `chunk-ra61p37g.js` · offset 187624877 · sha256 `f1f7ad1b…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isHidden: gated (condition references `CLAUDE_CODE_USE_VERTEX`)

~~~~~~text
Reconfigure Google Vertex AI authentication, project, region, or model pins
~~~~~~

### /skill-doctor (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187891221 · sha256 `15b184c7…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Show which loaded skills are unused and costing context
~~~~~~

### /skill-doctor (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187891369 · sha256 `15b184c7…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Show which loaded skills are unused and costing context
~~~~~~

### /skills

Source: `chunk-ra61p37g.js` · offset 187626075 · sha256 `f64e79c7…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
List available skills
~~~~~~

### /status

Source: `chunk-ra61p37g.js` · offset 187626210 · sha256 `caac99e2…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Show Claude Code status including version, model, account, API connectivity, and tool statuses
~~~~~~

### /stickers

Source: `chunk-ra61p37g.js` · offset 187900226 · sha256 `8350767b…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

~~~~~~text
Order Claude Code stickers
~~~~~~

### /stop (definition 1 of 2, `chunk-3b7zf3mv.js`)

Source: `chunk-3b7zf3mv.js` · offset 198799235 · sha256 `251d8826…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Stop this background session; transcript and worktree are kept
~~~~~~

### /stop (definition 2 of 2, `chunk-3b7zf3mv.js`)

Source: `chunk-3b7zf3mv.js` · offset 198799393 · sha256 `251d8826…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

~~~~~~text
Stop this background session; transcript and worktree are kept
~~~~~~

### /subtask

Source: `chunk-ra61p37g.js` · offset 187893994 · sha256 `9b550321…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `<task>`

isEnabled: computed at runtime

~~~~~~text
Send a subagent off with your full context; its result comes back here
~~~~~~

### /tasks

Source: `chunk-ra61p37g.js` · offset 187626417 · sha256 `765d4e9f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/bashes`

~~~~~~text
View and manage everything running in the background
~~~~~~

### /teleport (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187626585 · sha256 `65374137…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/tp`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Send this session to the cloud, or resume one from claude.ai
~~~~~~

### /teleport (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187902431 · sha256 `65374137…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local (built by a command factory)`

Aliases: `/tp`

~~~~~~text
Send this session to the cloud, or resume one from claude.ai
~~~~~~

### /terminal-setup

Source: `chunk-ra61p37g.js` · offset 187644294 · sha256 `a0c0473a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187644294.

### /theme

Source: `chunk-ra61p37g.js` · offset 187891633 · sha256 `54b7e334…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

~~~~~~text
Change the theme
~~~~~~

### /tui

Source: `chunk-ra61p37g.js` · offset 187891762 · sha256 `0b642684…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `[default|fullscreen]`

~~~~~~text
Set the terminal UI renderer (default | fullscreen)
~~~~~~

### /ultraplan (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187890399 · sha256 `8914c9e1…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Argument hint: `<prompt>`

isEnabled: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187890399.

### /ultraplan (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187902228 · sha256 `bc843114…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local (built by a command factory)`

~~~~~~text
A cloud session drafts a plan you can edit and approve
~~~~~~

### /ultrareview (definition 1 of 3, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187625229 · sha256 `27ce695a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187625229.

### /ultrareview (definition 2 of 3, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187625322 · sha256 `29d59a6b…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187625322.

### /ultrareview (definition 3 of 3, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187902322 · sha256 `414688ad…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local (built by a command factory)`

~~~~~~text
Find and verify bugs in your branch using a cloud session
~~~~~~

### /upgrade

Source: `chunk-ra61p37g.js` · offset 187905128 · sha256 `434669de…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Upgrade to Max for higher rate limits and more Opus
~~~~~~

### /usage (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187890727 · sha256 `258bee07…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

Aliases: `/cost`, `/stats`

~~~~~~text
Show session cost, plan usage, and activity stats
~~~~~~

### /usage (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187890942 · sha256 `c9d6e91c…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Aliases: `/cost`, `/stats`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Show session cost, plan usage, and what's contributing to your limits
~~~~~~

### /usage-credits (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187905307 · sha256 `1db112fa…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Configure usage credits or request them from your admin when you hit a limit
~~~~~~

### /usage-credits (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187905508 · sha256 `1db112fa…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: computed at runtime

~~~~~~text
Configure usage credits or request them from your admin when you hit a limit
~~~~~~

### /version (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187896878 · sha256 `a6a03726…`

Status: undocumented

Type: `local-jsx`

isEnabled: `false`

~~~~~~text
Show this session's version (autoupdate may have a newer one)
~~~~~~

### /version (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187898555 · sha256 `52d48b4d…`

Status: undocumented

Type: `local`

isEnabled: `false`

isHidden: computed at runtime

~~~~~~text
Print the version this session is running (not what autoupdate downloaded)
~~~~~~

### /voice

Source: `chunk-ra61p37g.js` · offset 187623588 · sha256 `bb20d74f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local`

Argument hint: `[hold|tap|off]`

isHidden: computed at runtime

~~~~~~text
Toggle voice mode
~~~~~~

### /web-setup

Source: `chunk-jt2pa6qd.js` · offset 184738748 · sha256 `23d3eee0…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

isHidden: gated (condition references `allow_remote_sessions`, `allow_quick_web_setup`)

~~~~~~text
Set up cloud sessions with your GitHub account
~~~~~~

### /wellbeing

Source: `chunk-ra61p37g.js` · offset 187913168 · sha256 `a76d5c4a…`

Status: undocumented

Type: `local-jsx`

Aliases: `/breaks`, `/break-reminder`, `/downtime`

isEnabled: `false`

~~~~~~text
Configure optional break reminders and quiet-hours nudges
~~~~~~

### /workflows

Source: `chunk-fjhvb4b3.js` · offset 198838270 · sha256 `1b3ac0ef…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

~~~~~~text
Browse running and completed workflows
~~~~~~

## Prompt commands

### /init

Source: `chunk-ra61p37g.js` · offset 187620713 · sha256 `ebcb4926…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt`

Description: computed (getter).

Undocumented; read at `chunk-ra61p37g.js` offset 187620713.

### /insights (definition 1 of 2, `chunk-50qtypn7.js`)

Source: `chunk-50qtypn7.js` · offset 196349602 · sha256 `6a39fdb6…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt`

~~~~~~text
Generate a report analyzing your Claude Code sessions
~~~~~~

### /insights (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187916597 · sha256 `6a39fdb6…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt`

~~~~~~text
Generate a report analyzing your Claude Code sessions
~~~~~~

### /security-review

Source: `chunk-ra61p37g.js` · offset 187643218 · sha256 `61328990…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (built by a command factory)`

~~~~~~text
Complete a security review of the pending changes on the current branch
~~~~~~

### /statusline

Source: `chunk-ra61p37g.js` · offset 187911583 · sha256 `05088293…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt`

~~~~~~text
Set up Claude Code's status line UI
~~~~~~

### /team-onboarding

Source: `chunk-5andxc08.js` · offset 198858215 · sha256 `0afdbc6f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt`

isHidden: `false`

~~~~~~text
Help teammates ramp on Claude Code with a guide from your usage
~~~~~~

## Bundled skill commands

### /artifact-capabilities

Source: `chunk-s8g6a4jf.js` · offset 193323183 · sha256 `38bc300a…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Runtime capabilities for published Artifacts

~~~~~~text
Runtime capabilities a published Artifact page can be granted — behavior static HTML cannot provide on its own, such as the page reading live or connected data, remembering what people do on it (a poll, a sign-up sheet, a checklist, a document edited in place — it saves new versions of itself), keeping state shared across viewers, knowing who is viewing, asking Claude a question of its own, storing files people add, or handing the viewer a file to save. Serves this user's live capability roster and the typed call definitions. Load it whenever any such runtime behavior would make an artifact more useful, before writing the page.
~~~~~~

### /artifact-components

Source: `chunk-s8g6a4jf.js` · offset 193326647 · sha256 `75f8404b…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Embed reusable components in an Artifact

~~~~~~text
Embed reusable artifact components in any HTML artifact - first entry: the workshop decision component (clickable option rows backed by a machine-readable record the session reads back). Use when a non-workshop artifact should carry decisions the reader answers from the published page, or to look up a component's exact scripts, styles, markup contract, and composition limits.
~~~~~~

### /artifact-design

Source: `chunk-s8g6a4jf.js` · offset 193327381 · sha256 `bf8ecec6…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `false`

~~~~~~text
Design guidance and fundamentals for Artifacts.
~~~~~~

### /artifact-diagramming

Source: `chunk-s8g6a4jf.js` · offset 193328139 · sha256 `12a6cbe2…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Diagramming guidance for Artifacts

~~~~~~text
Diagramming know-how for Artifacts - when a picture earns its place, how to draw one that shows the real mechanism, and the inline-SVG mechanics that keep it legible in both themes.
~~~~~~

### /artifact-pr-review

Source: `chunk-s8g6a4jf.js` · offset 193493818 · sha256 `874f010b…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Publish a PR review briefing Artifact from a template

~~~~~~text
Publish a PR review briefing Artifact from a template
~~~~~~

### /batch

Source: `chunk-s8g6a4jf.js` · offset 193338068 · sha256 `fb256681…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Plan a large change; background agents each open a PR

~~~~~~text
Research and plan a large-scale change, then execute it in parallel across 5–30 isolated worktree agents that each open a PR.
~~~~~~

### /claude-api

Source: `chunk-nmxqbq07.js` · offset 193275356 · sha256 `03b11ab9…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Build and debug apps that use the Claude API

~~~~~~text
Build and debug apps that use the Claude API
~~~~~~

### /claude-code-docs

Source: `chunk-fkd4vat3.js` · offset 209907117 · sha256 `55107626…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: gated (condition references `tengu_birch_kettle`)

userInvocable: `true`

Menu description: Answer questions about Claude Code features and settings

Interpolated constants (resolved from code): `A` = `"Answer questions about Claude Code itself: commands, flags, settings, hooks, skills, MCP servers, subagents, IDE integrations, sandboxing, deployment, and Claude Tag (Claude in Slack). Verifies against the running build before recommending any command, flag, or setting.\n"`

~~~~~~text
Answer questions about Claude Code features and settings
~~~~~~

### /claude-in-chrome

Source: `chunk-s8g6a4jf.js` · offset 193352232 · sha256 `4c33a9a9…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Let Claude browse and interact with pages in your Chrome

~~~~~~text
Automates your Chrome browser to interact with web pages - clicking elements, filling forms, capturing screenshots, reading console logs, and navigating sites. Opens pages in new tabs within your existing Chrome session. Requires site-level permissions before executing (configured in the extension).
~~~~~~

### /code-review

Source: `chunk-s8g6a4jf.js` · offset 193393548 · sha256 `1f74433d…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

Aliases: `/review`

userInvocable: `true`

Menu description: Review the current diff or a PR for bugs and cleanups

~~~~~~text
Review the current diff or a PR for bugs and cleanups
~~~~~~

### /commit

Source: `chunk-s8g6a4jf.js` · offset 193397985 · sha256 `3aa45708…`

Status: documented at https://code.claude.com/docs/en/skills

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Create a git commit

~~~~~~text
Create a git commit. Use whenever you are about to create a commit, whether the user asked for one or it is a step in your current task — it gathers git context and applies the required commit workflow (message style, staging rules, attribution).
~~~~~~

### /cowork-plugin

Source: `chunk-s8g6a4jf.js` · offset 193398744 · sha256 `a4ecae0f…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: gated (condition references `CLAUDE_CODE_ENTRYPOINT`)

userInvocable: `false`

~~~~~~text
Create a new Cowork plugin from scratch, or customize an installed plugin for a specific organization. Use when: customize plugin, set up plugin, configure plugin, tailor plugin, adjust plugin settings, customize plugin connectors, customize plugin skill, tweak plugin, modify plugin configuration, create a plugin, build a plugin, make a new plugin, develop a plugin, scaffold a plugin.
~~~~~~

### /dataviz

Source: `chunk-s8g6a4jf.js` · offset 193399525 · sha256 `c2588db3…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Chart and dashboard design guidance

~~~~~~text
Use this skill whenever you are about to create ANY chart, graph, plot, dashboard, or data visualization, in ANY output medium — an HTML or React artifact, inline SVG, plotting code in any library (matplotlib, plotly, d3, Recharts, …), an image/PNG you will render and upload, or a chart shared into Slack. Read it BEFORE writing the first line of chart code, choosing chart colors, building a stat tile / meter / KPI row, or laying out a dashboard. When the destination is a first-party document connector (host-designated, never self-described) that renders live charts, hand it the rows (inline, or as an uploaded data file the chart cites) rather than a rendered PNG/SVG — a picture of a chart loses hover, data inspection and per-value comments. Produces visualizations that read as one system — elegant, accessible, consistent in light and dark — using a brand-neutral placeholder palette you swap for your own. Teaches a design-system-agnostic method: a form heuristic, a color formula with a runnable validator, mark specs, and interaction rules. A validated default palette is documented in `references/palette.md` — swap that file's values for your brand's. Triggers on: "chart", "graph", "plot", "data viz", "visualization", "dashboard", "analytics", "visualize data", "categorical colors", "sequential / diverging palette", "stat tile", "sparkline", "heatmap", "legend", "axis", "tooltip", "chart colors", "color by series".
~~~~~~

### /debug

Source: `chunk-s8g6a4jf.js` · offset 193401484 · sha256 `97be86ab…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Turn on debug logging and investigate problems

~~~~~~text
Enable debug logging for this session and help diagnose issues
~~~~~~

### /design

Source: `chunk-s8g6a4jf.js` · offset 193410665 · sha256 `bab2d75f…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Undocumented; read at `chunk-s8g6a4jf.js` offset 193410665.

### /design-sync

Source: `chunk-s8g6a4jf.js` · offset 193411172 · sha256 `54919f73…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Push your design system components to claude.ai/design

~~~~~~text
Push a React design system to claude.ai/design. This runs a converter that bundles the real component code (from Storybook or a bare package) and uploads it. Use when the user runs /design-sync or says "sync my design system to Claude Design".
~~~~~~

### /doctor

Source: `chunk-s8g6a4jf.js` · offset 193461229 · sha256 `0ccc94fb…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

Aliases: `/checkup`

isEnabled: gated (condition references `DISABLE_DOCTOR_COMMAND`)

userInvocable: `true`

Menu description: Health-check your setup and fix issues: installation, unused extensions, duplicated or bloated memory files, slow hooks, updates, permissions

~~~~~~text
Health-check the user's Claude Code setup and fix issues: diagnose installation health — what the `claude doctor` terminal diagnostics cover — from local data (duplicate or leftover installs, PATH, unparseable settings files, broken or colliding agent definitions, skills whose frontmatter fails to parse); find unused skills, MCP servers, and plugins versus their context cost and disable dead weight; deduplicate local CLAUDE.md files against checked-in ones; trim checked-in CLAUDE.md files by cutting content a session could derive from the codebase (directory layouts, tech-stack lists, architecture overviews) while keeping gotchas, rationale, and non-standard conventions; migrate always-loaded CLAUDE.md guidance into lazy skills and nested CLAUDE.md files; flag slow hooks and context-heavy extensions; check the installed version is current; make auto mode the default permission mode; and pre-approve frequently denied read-only commands. Use when the user asks for a doctor run, checkup, audit, tune-up, or cleanup of their Claude Code setup or configuration.
~~~~~~

### /explain-usage

Source: `chunk-s8g6a4jf.js` · offset 193462778 · sha256 `5f8f4685…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: See where this session’s tokens went, in plain words

~~~~~~text
Explain where this session's tokens went, with one simple chart in plain language. Use when: explain usage, explain my usage, where did my tokens go, token usage breakdown, what used the most tokens.
~~~~~~

### /fewer-permission-prompts

Source: `chunk-s8g6a4jf.js` · offset 193472420 · sha256 `3ee36c59…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Pre-approve safe read-only commands based on your usage

~~~~~~text
Scan your transcripts for common read-only Bash and MCP tool calls, then add a prioritized allowlist to project .claude/settings.json to reduce permission prompts.
~~~~~~

### /keybindings-help

Source: `chunk-s8g6a4jf.js` · offset 193479453 · sha256 `4bddaa3f…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `false`

~~~~~~text
Use when the user wants to customize keyboard shortcuts, rebind keys, add chord bindings, or modify ~/.claude/keybindings.json. Examples: "rebind ctrl+s", "add a chord shortcut", "change the submit key", "customize keybindings".
~~~~~~

### /loop

Source: `chunk-b82ys6y1.js` · offset 209956090 · sha256 `72070ca8…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

Aliases: `/proactive`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Repeat a prompt or command on an interval (e.g. /loop 5m /foo)

~~~~~~text
Run a prompt or slash command on a recurring interval (e.g. /loop 5m /foo). Omit the interval to let the model self-pace.
~~~~~~

### /memory-types

Source: `chunk-s8g6a4jf.js` · offset 193481784 · sha256 `3b444f10…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `false`

~~~~~~text
Full reference for the memory type taxonomy — what each type captures, when to save it, how to structure the body, with examples.
~~~~~~

### /pr

Source: `chunk-s8g6a4jf.js` · offset 193491869 · sha256 `5988d897…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Create a pull request

~~~~~~text
Create a GitHub pull request. Use whenever you are about to open a PR, whether the user asked for one or it is a step in your current task — it gathers branch context and applies the required PR workflow (gh CLI, title/body format, attribution).
~~~~~~

### /prototype

Source: `chunk-s8g6a4jf.js` · offset 193486946 · sha256 `842294d8…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Prototype an idea as a working Artifact

~~~~~~text
Turn an idea into a working proof of concept and publish it as an Artifact - a single self-contained page the user can open, click through, and react to. Run a short intake, state your assumptions, build, then iterate on feedback in the same artifact. Use when the user asks to prototype an idea, mock up a concept, build a proof of concept, or wants to see something working before committing to a real build - including, on an explicit ask, a new feature shown in place on an app they already have.
~~~~~~

### /run

Source: `chunk-6d81jq1f.js` · offset 209919360 · sha256 `fea68146…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Launch this project’s app to see your change working

~~~~~~text
Launch and drive this project's app to see a change working. Use when asked to run, start, or screenshot the app, or to confirm a change works in the real app (not just tests). First looks for a project skill that already covers launching the app; otherwise falls back to built-in patterns per project type (CLI, server, TUI, Electron, browser-driven, library).
~~~~~~

### /run-skill-generator

Source: `chunk-nbsdmh9f.js` · offset 209925847 · sha256 `df8af926…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Create a skill that knows how to run this project’s app

~~~~~~text
Author or improve the run-<unit> skill - a per-project skill that tells agents how to build, launch, and drive this project's app. Use when the user asks to set up the project, get it running, write run instructions, or verify build/run steps work from a clean environment.
~~~~~~

### /schedule (definition 1 of 2, `chunk-en0nxvah.js`)

Source: `chunk-en0nxvah.js` · offset 209988629 · sha256 `cef7f886…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

Aliases: `/routines`

isEnabled: gated (condition references `CLAUDE_CODE_REMOTE`)

userInvocable: `true`

Menu description: Create and manage routines: cloud agents on a schedule

~~~~~~text
Create, update, list, or run scheduled cloud agents (routines) that execute on a cron schedule.
~~~~~~

### /setup-claude

Source: `chunk-tqdvvysv.js` · offset 209932488 · sha256 `5342f75d…`

Status: undocumented

Type: `prompt (bundled skill)`

Aliases: `/setup-cowork`

isEnabled: gated (condition references `CLAUDE_CODE_ENTRYPOINT`)

userInvocable: `true`

Menu description: Guided setup — pick a role, install a plugin, try a skill, connect tools

~~~~~~text
Guided setup — pick a role, install a matching plugin, try a skill, connect tools. Use when: set up claude, setup claude, set up cowork, setup cowork, get started with claude, claude onboarding.
~~~~~~

### /simplify

Source: `chunk-s8g6a4jf.js` · offset 193497340 · sha256 `ff580043…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Clean up the changed code without changing behavior

~~~~~~text
Review the changed code for reuse, simplification, efficiency, and altitude cleanups, then apply the fixes. Quality only — it does not hunt for bugs; use /code-review for that.
~~~~~~

### /update-config

Source: `chunk-s8g6a4jf.js` · offset 193525053 · sha256 `813bb0ef…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

Menu description: Change settings: hooks, permissions, environment variables

~~~~~~text
Use this skill to configure the Claude Code harness via settings.json. Automated behaviors ("from now on when X", "each time X", "whenever X", "before/after X") require hooks configured in settings.json - the harness executes these, not Claude, so memory/preferences cannot fulfill them. Also use for: permissions ("allow X", "add permission", "move permission to"), env vars ("set X=Y"), hook troubleshooting, or any changes to settings.json/settings.local.json files. Examples: "allow npm commands", "add bq permission to global settings", "move permission to user settings", "set DEBUG=true", "when claude stops show X". For simple settings like theme/model, suggest the /config command.
~~~~~~

### /verify

Source: `chunk-s8g6a4jf.js` · offset 193526434 · sha256 `230c901a…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

userInvocable: `true`

~~~~~~text
Verify that a code change actually does what it's supposed to by exercising it end-to-end and observing behavior — drive the affected flow, not just tests or typecheck. Run before committing nontrivial changes; bootstraps this repo's project verify skill if none exists yet. Don't invoke it on a diff that only touches tests, docs, or other code with no runtime surface to drive (a change to product source always has one) — there's nothing to observe.
~~~~~~

### /whiteboard

Source: `chunk-s8g6a4jf.js` · offset 193486463 · sha256 `7d8425ff…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Pair on a whiteboard artifact — you draw, Claude answers on it

~~~~~~text
Pair on a whiteboard artifact — you draw, Claude answers on it
~~~~~~

### /workflow-authoring

Source: `chunk-jbscp9r6.js` · offset 207293681 · sha256 `91d77e77…`

Status: documented at https://code.claude.com/docs/en/commands

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Load the reference for writing Workflow tool scripts

Interpolated constants (resolved from code): `Kd` = `"Workflow"`

~~~~~~text
Reference for writing a Workflow tool script (script API and gotchas, resume, quality patterns, worked examples). Load before authoring a script for a workflow the user already opted into; it does not itself authorize running one.
~~~~~~

### /workshop

Source: `chunk-s8g6a4jf.js` · offset 193325668 · sha256 `ce7c51c9…`

Status: undocumented

Type: `prompt (bundled skill)`

isEnabled: computed at runtime

userInvocable: `true`

Menu description: Build a design together, one decision at a time

~~~~~~text
Build a design together with the user, one decision at a time - publish an evolving plan document as an Artifact, surface each open decision on the page for the reader to answer there, apply their choices in this session, and republish the updated draft until the reader starts the build. Use when asked to workshop a design, brainstorm with decision points, or drive an iterative decide-and-revise loop through an artifact.
~~~~~~

## Hidden commands

### /__remote-workflow

Source: `chunk-ra61p37g.js` · offset 187904534 · sha256 `d8310700…`

Status: hidden; undocumented

Type: `local`

isHidden: `true`

~~~~~~text
Run the workflow script delivered in this session environment (server-launched sessions only)
~~~~~~

### /agents

Source: `chunk-ra61p37g.js` · offset 187894558 · sha256 `87d89e75…`

Status: hidden; documented at https://code.claude.com/docs/en/commands

Type: `local`

isHidden: `true`

~~~~~~text
(removed) Ask Claude to create/manage subagents, or edit .claude/agents/
~~~~~~

### /design-consent

Source: `chunk-ra61p37g.js` · offset 187621371 · sha256 `96319895…`

Status: hidden; undocumented

Type: `local`

isEnabled: computed at runtime

isHidden: `true`

~~~~~~text
Grant Claude agent access to your Design projects
~~~~~~

### /design-revoke

Source: `chunk-ra61p37g.js` · offset 187621597 · sha256 `5ad6f04f…`

Status: hidden; undocumented

Type: `local`

isEnabled: computed at runtime

isHidden: `true`

~~~~~~text
Revoke Claude agent access to your Design projects
~~~~~~

### /extra-usage (definition 1 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187905744 · sha256 `bb0a165d…`

Status: hidden; documented at https://code.claude.com/docs/en/commands

Type: `local-jsx`

isEnabled: computed at runtime

isHidden: `true`

~~~~~~text
Renamed to /usage-credits
~~~~~~

### /extra-usage (definition 2 of 2, `chunk-ra61p37g.js`)

Source: `chunk-ra61p37g.js` · offset 187905904 · sha256 `bb0a165d…`

Status: hidden; documented at https://code.claude.com/docs/en/commands

Type: `local`

isEnabled: computed at runtime

isHidden: `true`

~~~~~~text
Renamed to /usage-credits
~~~~~~

### /heapdump

Source: `chunk-ra61p37g.js` · offset 187896288 · sha256 `35cf05a5…`

Status: hidden; documented at https://code.claude.com/docs/en/commands

Type: `local`

isHidden: `true`

~~~~~~text
Dump the JS heap to the Desktop; on Linux with no Desktop folder, the home directory
~~~~~~

### /pro-trial-expired

Source: `chunk-ra61p37g.js` · offset 187906083 · sha256 `f99c8fe6…`

Status: hidden; undocumented

Type: `local-jsx`

isHidden: `true`

~~~~~~text
Options shown when the Pro plan Claude Code trial has ended
~~~~~~

### /update

Source: `chunk-ra61p37g.js` · offset 187903464 · sha256 `f9869f8e…`

Status: hidden; undocumented

Type: `local`

Aliases: `/restart`

isEnabled: `false`

isHidden: `true`

~~~~~~text
Switch to the latest version (conversation continues)
~~~~~~

### /workflow-launch-exec

Source: `chunk-ra61p37g.js` · offset 187904842 · sha256 `a690fa82…`

Status: hidden; undocumented

Type: `local`

isHidden: `true`

~~~~~~text
Execute a server-launched workflow handoff (workflow_launch event sessions only)
~~~~~~
