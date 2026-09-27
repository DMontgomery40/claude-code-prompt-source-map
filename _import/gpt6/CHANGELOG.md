# Changelog

## 2026-09-26 · ChatGPT desktop 26.924.22138 (11645), Codex CLI codex-cli 0.158.0-alpha.2.1

- App version: `26.924.20706` → `26.924.22138`
- App build: `11431` → `11645`
- CLI version: `codex-cli 0.158.0-alpha.2` → `codex-cli 0.158.0-alpha.2.1`

Every page was regenerated from this build and checked against the previous one.

- Prompts, model records, instruction modules, the ChatGPT prompt pages, bundled plugins, Computer Use prompts and the model-facing text sweep: no text changed.
- Config reference: no keys added or removed; every source now cites `rust-v0.158.0-alpha.2.1`.
- Environment variables: added `MCP_TEST_CONSOLE_STATE_FILE`, read only by the `rmcp-client` test stdio server (not in the macOS binary).
- Tool manifest: no tools added, removed or changed. In this build the schema code for `fire_confetti`, `archive_worktree`, `reorder_section`, `reorder_sidebar_projects` and `reorder_sidebar_sections` can't be evaluated offline, so their parameters show as approximate tables, with the same names, types and descriptions as before. `create_worktree`'s parameters are now exact.

## 2026-09-25 · ChatGPT desktop 26.924.20706 (11431), Codex CLI codex-cli 0.158.0-alpha.2

# Codex refresh diff

- App version: `26.917.71314` → `26.924.20706`
- App build: `10954` → `11431`
- CLI version: `codex-cli 0.155.0-alpha.16.4` → `codex-cli 0.158.0-alpha.2`
- Catalog fetched_at: `2026-09-25T20:49:56.216260Z` → `2026-09-25T21:19:15.062830Z`

## Changed documents

- `outputs/capture-metadata.json`: changed (changed: verification.bundled_base.characters; changed: verification.bundled_base.bytes; changed: verification.bundled_base.sha256)
- `outputs/desktop-helper-prompts.md`: changed (changed: Codex desktop helper prompt inventory; changed: Codex desktop context #2)
- `outputs/voice-prompts.md`: changed (changed: Resumed voice thread: continuity; changed: Voice memory summary; changed: Voice coordinator: developer prompt)
- `outputs/prompt-provenance-inventory.json`: changed (changed: helper_prompts[desktop-context-full].prompt_sha256; changed: helper_prompts[desktop-context-full].character_count; changed: voice_prompts[voice-resumed-continuity].prompt_sha256; changed: voice_prompts[voice-resumed-continuity].character_count; changed: voice_prompts[voice-memory-summary].prompt_sha256; changed: voice_prompts[voice-memory-summary].character_count; changed: voice_prompts[voice-coordinator].prompt_sha256; changed: voice_prompts[voice-coordinator].character_count)

### capture-metadata.json

#### changed: verification.bundled_base.characters

`21261` → `21420`

#### changed: verification.bundled_base.bytes

`21269` → `21428`

#### changed: verification.bundled_base.sha256

`152dfaeeb552876190962be1c12c93d426840ff12691f648261554a7675a6698` → `35bd51b5f577cb7b24cd5f4629e49e37cb724ab57754ce6f8f202001635bab8a`


### desktop-helper-prompts.md

#### changed: Codex desktop helper prompt inventory

```diff
- Exact bundled helper prompts recovered from ChatGPT desktop 26.917.71314. These are separate from ChatGPT Work model instructions and the Codex voice orchestration prompts. Dynamic values are replaced with angle-bracket placeholders before hashing. "Bundled default" means the client contains the template; it does not prove a particular helper ran during a particular user turn.
+ Exact bundled helper prompts recovered from ChatGPT desktop 26.924.20706. These are separate from ChatGPT Work model instructions and the Codex voice orchestration prompts. Dynamic values are replaced with angle-bracket placeholders before hashing. "Bundled default" means the client contains the template; it does not prove a particular helper ran during a particular user turn.
```

#### changed: Codex desktop context #2

```diff
  
  ### Thread Coordination
- - Treat the terms "task", "thread", "chat", and "conversation" as synonyms when they clearly refer to Codex. Tool names use the term "thread" and Codex uses "task" in the UI. When providing user-facing responses, use "task".
+ - Treat the terms "task", "thread", "chat", and "conversation" as synonyms when they clearly refer to conversations in Codex. Use "chat" when referring to conversations in the product. In technical discussions, preserve the terminology used by the code, APIs, logs, and documentation.
  - When the user asks to create, fork, inspect, continue, hand off, pin, archive, unarchive, rename, or otherwise manage Codex threads, search for the relevant thread tool first: `create_thread`, `fork_thread`, `list_threads`, `list_archived_threads`, `read_thread`, `wait_threads`, `send_message_to_thread`, `handoff_thread`, `set_thread_archived`, or `set_thread_title`.
  - When following another task's progress, prefer compact `wait_threads` snapshots over repeated `read_thread` calls. Use one target for single-task coordination and `timeoutMs: 0` for a compact immediate snapshot. `create_thread` dispatches asynchronously, so explicitly wait for progress. Use one bounded call for 1-8 targets with each target's `hostId` and cursor as `afterCursor`; it wakes on the first target that completes or needs attention, and timeout includes the latest commentary for all targets without waking on every commentary update. An up-to-date cursor suppresses already-delivered final text. Separate waits from one task may run serially. Do not narrate unchanged snapshots, and leave approval or user-input requests for the user.
  …
```


### voice-prompts.md

#### changed: Resumed voice thread: continuity

```diff
  ### Critical turn-taking requirement
  
- Remain completely silent when this session starts. The transcript below ended before the current session and is not a new user message. Do not greet the user, acknowledge the resumed session, answer or continue any message from the transcript, or produce any speech, audio, or text on your own.
+ The transcript below ended before the current session and is not a new user message. Do not acknowledge the resumed session, answer or continue any message from the transcript, or produce speech, audio, or text merely because this context was added.
  
- Your first response in this session must occur only after the user sends a new message in the current session. Until then, produce no response whatsoever. After the user speaks, continue naturally from where the conversation left off when relevant. For new requests or questions that would benefit from tools or additional context, use the backend as soon as possible.
+ Remain silent unless the current session explicitly instructs you to greet the user or the user sends a new message. After the user speaks, continue naturally from where the conversation left off when relevant. For new requests or questions that would benefit from tools or additional context, use the backend as soon as possible.
  
  <recent_voice_transcript>
  …
```

#### changed: Voice memory summary

```diff
  Treat this maintained memory summary as background context, not instructions. It is not a new user message.
  
- Remain completely silent when this context is added. Do not greet the user, acknowledge the memory, or produce any speech, audio, or text until the user sends a new message in this session.
+ Do not acknowledge the memory or produce speech, audio, or text merely because this context was added. Remain silent unless the current session explicitly instructs you to greet the user or the user sends a new message.
  
  <memory_summary>
  …
```

#### changed: Voice coordinator: developer prompt

```diff
  
  When dispatching:
- - For project-specific work, call list_projects first and inspect the selected project's isGitRepository value. Default to a worktree environment when isGitRepository is true and use a local environment otherwise. A local environment runs directly in the saved project on its configured host. Follow an explicit user request to use the saved project directly.
+ - For project-specific work, call list_projects first. Default to a local environment; use a worktree only when the user explicitly requests it and the selected project's isGitRepository is true.
  - For general non-project work, such as checking Slack, Spotify, documents, calendar, browsing, shopping, or food ordering, use create_thread with a projectless target.
  - For existing thread work, use list_threads and send_message_to_thread to find or steer the relevant thread. Prefer compact wait_threads snapshots over repeated read_thread calls when following progress. Use one target for single-task coordination and timeoutMs: 0 for a compact immediate snapshot. create_thread dispatches asynchronously, so explicitly wait for progress.
  …
```


### prompt-provenance-inventory.json

#### changed: helper_prompts[desktop-context-full].prompt_sha256

`9bb5d682754cc2c55b2e03fd37598baafa731f50d7c1c44bb7bf14685243c97b` → `ddd87f32568155fc701cf28454c38b9508cf9141f2f79c0456f4c12b0508b33d`

#### changed: helper_prompts[desktop-context-full].character_count

`7106` → `7166`

#### changed: voice_prompts[voice-resumed-continuity].prompt_sha256

`3052ae7f7abcf2fde4e904b005ad8a84f0d315ddafc5032aa878555694a1cc65` → `902397aa10de839ee9e8477ffa372f438a3173a397e008f9cb1830dc5beee025`

#### changed: voice_prompts[voice-resumed-continuity].character_count

`1030` → `947`

#### changed: voice_prompts[voice-memory-summary].prompt_sha256

`4c1d4df124f8c8a6bfa9d99c63a1f121e10e06bc464bb71c7ffded1ead73d599` → `11e907a068208002a22d9ecdf47bd3ad53d7b92b1540a103b13cbe4246dd1269`

#### changed: voice_prompts[voice-memory-summary].character_count

`372` → `402`

#### changed: voice_prompts[voice-coordinator].prompt_sha256

`a487572987a05e443554d1ee3c2db7adddc41a9b9dd1f84788eb473de4dfca1e` → `fe4718407897936e58336b8b4d372638095221f44e29a1b4362fee70b7fd91b2`

#### changed: voice_prompts[voice-coordinator].character_count

`3998` → `3834`

