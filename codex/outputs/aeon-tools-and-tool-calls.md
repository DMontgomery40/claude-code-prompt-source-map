# Aeon tools and host tool surface

## Exact source files

| File | Contents |
|---|---|
| `aeon-native-tools-2026-09-24.md` | Current catalog-native persistent tools, instruction-named operations, and historical Aeon cloud tools. |
| `current-host-tool-manifest-2026-09-24.json` | Every tool name and full registered description available through the current Codex host: 451 nested tools plus 5 direct runtime entries. |
| `aeon-current-responses-2026-09-24.json` | Current request and response samples for steering, resume, automatic continuation, concurrency, and automation management. |

## Registry totals

| Surface | Entries |
|---|---:|
| Catalog `experimental_supported_tools` | 2 |
| Current nested host registry | 451 |
| Current direct runtime entries | 5 |
| Current published callable entries | 456 |
| Registered nested-tool description text | 939,166 characters |

## Nested registry namespaces

| Namespace | Tools |
|---|---:|
| `core` | 12 |
| `image_gen` | 1 |
| `mcp__codemode` | 2 |
| `mcp__codex_app` | 38 |
| `mcp__codex_apps` | 326 |
| `mcp__computer_history` | 5 |
| `mcp__event_stream` | 3 |
| `mcp__messages` | 6 |
| `mcp__node_repl` | 3 |
| `mcp__openaiDeveloperDocs` | 5 |
| `mcp__xcodebuildmcp` | 44 |
| `multi_agent_v1` | 5 |
| `web` | 1 |

## Tool composition

```text
persistent-mode catalog tools
  + server-injected Aeon controls
  + core Codex tools
  + Codex desktop task and workspace tools
  + installed plugin and app tools
  + MCP servers and connected services
  + browser and computer-use controls
```

The model catalog uses `tool_mode: "code_mode_only"`. The registry can therefore remain dynamically callable through the code-mode host instead of placing every complete schema inline in one visible prompt block.

## Persistent control flow

```text
work
  -> record the next action
  -> send an asynchronous user message when useful
  -> sleep or schedule independent recurrence
  -> resume from persisted task state
  -> start, wait for, read, or steer worker turns
  -> continue until the requested outcome is established
```
