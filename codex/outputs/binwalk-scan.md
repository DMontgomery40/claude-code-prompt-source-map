# Binwalk scan of the ChatGPT desktop app (this build)

Every embedded payload binwalk 3.1.0 reports in the OpenAI executables of ChatGPT desktop 26.924.22138 (build 11645) and its `app.asar`, regenerated for each build. Each payload is carved at binwalk's offset and size, hashed, decompressed when it is compressed, and identified by its structure. A change between builds (a new, removed or changed payload, or a protocol method added or removed) is reported by the watcher. The September 24, 2026 hand run of the same method is kept as an archive: [Binwalk report, September 24](binwalk-report/).

## Scanned files

| File | Role | Size | SHA-256 | Signatures | Findings |
| --- | --- | ---: | --- | --- | ---: |
| `ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex` | Codex CLI | 238,069,168 | `3e11ccc743e8` | copyright 9, crc32 6, png 4, sha256 2, svg 7, zstd 2 | 2 |
| `ChatGPT.app/Contents/Resources/codex-cli/bin/codex-code-mode-host` | Codex code-mode host | 65,256,736 | `4c39893666a1` | copyright 52, crc32 2, sha256 3 | 0 |
| `ChatGPT.app/Contents/Resources/codex-cli/codex-resources/voice/bin/codex-voice-host` | Codex voice host | 9,311,536 | `cc01c6bddf1a` | crc32 1, sha256 2 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/bin/node_repl` | Computer Use node_repl | 17,690,080 | `10f9b28bf9d6` | sha256 2 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/Codex Computer Use.app/Contents/MacOS/SkyComputerUseService` | Computer Use service | 23,756,832 | `40ff57cbce8d` | copyright 1, crc32 1 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient` | Computer Use client | 14,768,576 | `ba5705d80a32` | crc32 1 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/Codex Computer Use.app/Contents/SharedSupport/CUALockScreenGuardian.app/Contents/MacOS/CUALockScreenGuardian` | Computer Use lock-screen guardian | 23,403,328 | `e9accda743e9` | copyright 1, crc32 1 | 0 |
| `ChatGPT.app/Contents/Resources/native/sky.node` | sky native addon | 1,380,368 | `ccea345878ec` | none | 0 |
| `ChatGPT.app/Contents/Resources/native/usb_webauthn.node` | WebAuthn native addon | 4,821,440 | `102218992285` | aes_sbox 1, sha256 1 | 0 |
| `ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/chrome/extension-host/macos/arm64/ChatGPT for Chrome` | Chrome extension host | 1,059,472 | `3c0a43f6051a` | none | 0 |
| `ChatGPT.app/Contents/Resources/app.asar` | desktop app archive | 480,133,781 | `d0ba973179d2` | copyright 62, crc32 1, jpeg 3, png 199, riff 910, sha256 1, svg 2512, zip 9 | 9 |

Signatures counted only (svg, png, jpeg, gif, riff, copyright, sha256, crc32, aes_sbox) are icons, license text and hash-constant tables; each is still hashed and diffed build to build. SVG images are counted by this scanner's bounded search because binwalk runs with `-x svg` (its SVG check is quadratic on JavaScript-heavy files).

## Findings

### Codex CLI

`ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex`

| Offset | Signature | Size | Decoded | SHA-256 | Identified as |
| --- | --- | ---: | ---: | --- | --- |
| `0xAC9FF2F` (181010223) | zstd | 155,272 | 4,826,889 | `d807a38e2426d20c` | app-server protocol catalog (standard) |
| `0xACC5DB7` (181165495) | zstd | 160,782 | 5,400,392 | `9f6070683280eb85` | app-server protocol catalog (experimental) |

### desktop app archive

`ChatGPT.app/Contents/Resources/app.asar`

| Offset | Signature | Size | Decoded | SHA-256 | Identified as |
| --- | --- | ---: | ---: | --- | --- |
| `0x5A82AEC` (94907116) | zip | 9,475 |  | `5d9ef8dd5bf133e8` | zip archive; inside `webview/assets/budget-planner-7fc57dcf2653.xlsx`; 12 members |
| `0x6FBFD93` (117177747) | zip | 11,351 |  | `ecbafd4fb470c935` | zip archive; inside `webview/assets/content-calendar-f684eeebe28d.xlsx`; 15 members |
| `0x7CA915C` (130715996) | zip | 22,984 |  | `e0a4f029118ed8d6` | zip archive; inside `webview/assets/design-review-df0c95705aed.pptx`; 33 members |
| `0xFDE5B54` (266230612) | zip | 37,284 |  | `b992115701e90a2e` | zip archive; inside `webview/assets/meeting-notes-217e093e29da.docx`; 17 members |
| `0x10BA3B7A` (280640378) | zip | 25,112 |  | `d79c285eb96961e7` | zip archive; inside `webview/assets/monthly-business-review-aa25b4112c50.pptx`; 33 members |
| `0x13DAFC2C` (333118508) | zip | 37,413 |  | `e8142cdf33271711` | zip archive; inside `webview/assets/project-brief-e08b85749970.docx`; 17 members |
| `0x13DBD7FB` (333174779) | zip | 8,936 |  | `73420e7a2774cdfc` | zip archive; inside `webview/assets/project-tracker-12f7a4dcd6be.xlsx`; 12 members |
| `0x15034416` (352535574) | zip | 37,326 |  | `ee43184e41f4d6f9` | zip archive; inside `webview/assets/report-outline-d47cda7d5af6.docx`; 17 members |
| `0x165BB711` (375109393) | zip | 23,490 |  | `fecbff22bbebfeff` | zip archive; inside `webview/assets/sales-discovery-c8f07eacd6f2.pptx`; 33 members |

## App-server protocol catalogs

The zstd frames in the Codex CLI decode to JSON containers of generated TypeScript bindings and JSON Schemas. Each is compared file-for-file with `codex app-server generate-ts` and `generate-ts --experimental` from the same binary.

| Offset | Compressed | Decoded | Binding set | TypeScript files | JSON Schemas | Internal schemas | generate-ts match | Client methods |
| --- | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: |
| `0xAC9FF2F` | 155,272 | 4,826,889 | standard | 740 | 314 | 1 | standard 740/740 (generated 740); experimental 718/740 (generated 881) | 107 |
| `0xACC5DB7` | 160,782 | 5,400,392 | experimental | 881 | 440 | 0 | standard 718/881 (generated 740); experimental 881/881 (generated 881) | 170 |

The experimental catalog has 170 client methods, the standard one 107; 63 are experimental-only:

`account/bedrock/discover`, `account/bedrock/setup`, `collaborationMode/list`, `environment/add`, `environment/info`, `environment/status`, `fuzzyFileSearch/sessionStart`, `fuzzyFileSearch/sessionStop`, `fuzzyFileSearch/sessionUpdate`, `mcpServer/event/stream/start`, `mcpServer/event/stream/stop`, `memory/reset`, `memory/status`, `mock/experimentalMethod`, `plugin/search`, `process/kill`, `process/resizePty`, `process/spawn`, `process/writeStdin`, `project/create`, `project/delete`, `project/import`, `project/list`, `project/move`, `project/read`, `project/update`, `remoteControl/client/list`, `remoteControl/client/revoke`, `remoteControl/disable`, `remoteControl/enable`, `remoteControl/pairing/start`, `remoteControl/pairing/status`, `remoteControl/status/read`, `rollout/compress`, `server/diagnostics`, `thread/backgroundTerminals/clean`, `thread/backgroundTerminals/list`, `thread/backgroundTerminals/terminate`, `thread/decrement_elicitation`, `thread/increment_elicitation`, `thread/memoryMode/set`, `thread/queue/add`, `thread/queue/delete`, `thread/queue/list`, `thread/queue/reorder`, `thread/queue/start`, `thread/queue/update`, `thread/realtime/appendAudio`, `thread/realtime/appendSpeech`, `thread/realtime/appendText`, `thread/realtime/listVoices`, `thread/realtime/start`, `thread/realtime/stop`, `thread/search`, `thread/searchOccurrences`, `thread/settings/update`, `thread/timeline/list`, `turn/settings/update`, `userVerification/cancel`, `userVerification/delete`, `userVerification/enroll`, `userVerification/status`, `userVerification/verify`

Since the September 24 hand run (104 standard, 167 experimental client methods): no experimental-only method added; none removed.

## Reproduce

Paths are inside `ChatGPT.app/Contents/Resources`.

```sh
binwalk -x svg -l codex.json codex-cli/CodexCLI.app/Contents/MacOS/codex
binwalk -e -C extract-codex codex-cli/CodexCLI.app/Contents/MacOS/codex
binwalk -x svg -l app-asar.json app.asar
binwalk -e -y zip -C extract-asar-zips app.asar
codex-cli/CodexCLI.app/Contents/MacOS/codex app-server generate-ts --out generated-standard
codex-cli/CodexCLI.app/Contents/MacOS/codex app-server generate-ts --experimental --out generated-experimental
```

Regenerated by `codex/extract/codex/binwalk-scan.mjs`.
