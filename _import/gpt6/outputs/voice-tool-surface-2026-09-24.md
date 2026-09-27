# Voice tools

The available evidence covers a ChatGPT Work voice preconnect and bundled Codex voice code. Protocol event names and prompt references identify possible integration points; they do not show the complete tool set in an active Work call.

## ChatGPT Work

A prefetched `/realtime/wm` session selected `chat_mode: "work"`, `backend_model: "gpt-6-luna-wm"`, and `voice_mode: "wingman"`. It supplied `client_tools: []` and no populated prompt override fields. No microphone conversation was completed in this capture.

The browser voice protocol includes `get_bidi_system_prompt`, `bidi_system_prompt`, `client_tool_invoke`, `client_tool_result`, and `client_tool_update`. The packaged handler recognizes these events but does not contain a Work prompt body or concrete Work tool schemas. Source: ChatGPT desktop `app.asar`, `webview/assets/mark-session-create-6f7d531b2a15.js` (SHA-256 `c413de08e7d548208f93ba3b9bf6cd97e1872b82cddbfeed99c86a7202be4455`).

## Codex voice

| Voice path | Tools named in bundled prompts or configuration | Evidence |
| --- | --- | --- |
| New coordinator conversation | `list_projects`, `create_thread`, `list_threads`, `send_message_to_thread`, `wait_threads` | Named in the default coordinator developer prompt; runtime configuration can replace it. |
| Voice in an existing Codex task | `capture_screen_context`, `end_realtime_voice_call` | Named as deferred tools in the realtime-start fallback. |
| Feature switches | `appshots_enabled`, `end_realtime_voice_call_enabled`, `transfer_voice_call_enabled`, `navigate_to_codex_page_enabled` | Configuration keys, not an active tool manifest. |

The [bundled Codex voice prompts](#codex-voice-prompts-2026-09-24-md) include a new-thread base that routes execution to a backend agent and a separate coordinator fallback with three routing modes. The two templates are distinct; the package alone does not show which was active in a given session. Source: ChatGPT desktop `app.asar`, `webview/assets/app-initial-51da50e6c6e3.js` (SHA-256 `ea4b3893669a56e67f6baa7d2791ed64e954b081a549f62b647101def36ef6d1`).
