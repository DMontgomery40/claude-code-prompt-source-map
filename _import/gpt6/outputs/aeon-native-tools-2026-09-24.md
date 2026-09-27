# Aeon-native tool signals

## Current model catalog

`gpt-6-astra.experimental_supported_tools` contains exactly:

```json
[
  "send_user_message_async",
  "clock"
]
```

## Current persistent instructions

The persistent instruction block names these operations:

| Name in the instructions | Function |
|---|---|
| `functions.send_user_message_async` | Message or question while persistent work continues. |
| `clock.sleep` | Suspend the current persistent loop until the next useful check. |
| `update_up_next` | Record the next action before sleep and clear it when work resumes. |
| automations | Move genuinely recurring or independently scheduled work out of the active loop. |

## Current host registry

The exact 451-entry nested host registry captured for this Codex task contains no tool whose registered name is `send_user_message_async`, `clock`, or `update_up_next`. Those names belong to the persistent-mode instruction/catalog layer and are not part of this ordinary task's nested registry snapshot.

The complete current host registry, including every tool name and full registered description, is published separately as `current-host-tool-manifest-2026-09-24.json`.

## Historical Aeon cloud tools

The recovered historical Aeon instruction composition names:

- `cloud_threads.create`
- `cloud_threads.list`
- `cloud_threads.read`
- `cloud_threads.send_message`
- `automations.list`
- `automations.peek`
- `automations.update`
- `automations.discover_webhook_schema`
- `automations.create`
- `clock.wait`
- `functions.request_user_input`
- `react_to_user_message`

These names are retained in the historical instruction files exactly as recovered.
