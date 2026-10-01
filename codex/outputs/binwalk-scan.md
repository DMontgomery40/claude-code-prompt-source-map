# Binwalk scan of the ChatGPT desktop app (this build)

Every embedded payload binwalk 3.1.0 reports in the OpenAI executables of ChatGPT desktop 26.928.21956 (build 12404) and its `app.asar`, regenerated for each build. Each payload is carved at binwalk's offset and size, hashed, decompressed when it is compressed, and identified by its structure. A change between builds (a new, removed or changed payload, or a protocol method added or removed) is reported by the watcher. The September 24, 2026 hand run of the same method is kept as an archive: [Binwalk report, September 24](binwalk-report/).

## Scanned files

| File | Role | Size | SHA-256 | Signatures | Findings |
| --- | --- | ---: | --- | --- | ---: |
| `ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex` | Codex CLI | 240,185,120 | `50ac633af648` | copyright 9, crc32 6, png 4, sha256 2, svg 7, zstd 2 | 2 |
| `ChatGPT.app/Contents/Resources/codex-cli/bin/codex-code-mode-host` | Codex code-mode host | 65,359,872 | `16fea600263c` | copyright 52, crc32 2, sha256 3 | 0 |
| `ChatGPT.app/Contents/Resources/codex-cli/codex-resources/voice/bin/codex-voice-host` | Codex voice host | 9,900,112 | `65419b8a5335` | crc32 1, sha256 2 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/bin/node_repl` | Computer Use node_repl | 17,712,272 | `1d3a0c09f8ec` | sha256 2 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/Codex Computer Use.app/Contents/MacOS/SkyComputerUseService` | Computer Use service | 23,793,568 | `d4b177513834` | copyright 1, crc32 1 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/Codex Computer Use.app/Contents/SharedSupport/SkyComputerUseClient.app/Contents/MacOS/SkyComputerUseClient` | Computer Use client | 14,789,968 | `f8d730f8ef8e` | crc32 1 | 0 |
| `ChatGPT.app/Contents/Resources/cua_node/lib/node_modules/@oai/sky/Codex Computer Use.app/Contents/SharedSupport/CUALockScreenGuardian.app/Contents/MacOS/CUALockScreenGuardian` | Computer Use lock-screen guardian | 23,440,064 | `b35d5477af51` | copyright 1, crc32 1 | 0 |
| `ChatGPT.app/Contents/Resources/native/sky.node` | sky native addon | 1,385,024 | `3dacf8e4d8b2` | none | 0 |
| `ChatGPT.app/Contents/Resources/native/usb_webauthn.node` | WebAuthn native addon | 4,821,440 | `16f36c03bcd8` | aes_sbox 1, sha256 1 | 0 |
| `ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/chrome/extension-host/macos/arm64/ChatGPT for Chrome` | Chrome extension host | 1,059,472 | `e7a35591ae26` | none | 0 |
| `ChatGPT.app/Contents/Resources/app.asar` | desktop app archive | 538,323,145 | `3bda98f2265a` | copyright 58, crc32 2, jpeg 3, png 690, riff 919, sha256 2, svg 2513, zip 9 | 9 |

Signatures counted only (svg, png, jpeg, gif, riff, copyright, sha256, crc32, aes_sbox) are icons, license text and hash-constant tables; each is still hashed and diffed build to build. SVG images are counted by this scanner's bounded search because binwalk runs with `-x svg` (its SVG check is quadratic on JavaScript-heavy files).

## Findings

### Codex CLI

`ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex`

| Offset | Signature | Size | Decoded | SHA-256 | Identified as |
| --- | --- | ---: | ---: | --- | --- |
| `0xAE1CA40` (182569536) | zstd | 155,772 | 4,801,394 | `38e4689b23122ad1` | app-server protocol catalog (standard) |
| `0xAE42ABC` (182725308) | zstd | 160,029 | 5,337,029 | `0027faf829943491` | app-server protocol catalog (experimental) |

### desktop app archive

`ChatGPT.app/Contents/Resources/app.asar`

| Offset | Signature | Size | Decoded | SHA-256 | Identified as |
| --- | --- | ---: | ---: | --- | --- |
| `0x640B39E` (104903582) | zip | 9,475 |  | `5d9ef8dd5bf133e8` | zip archive; inside `webview/assets/budget-planner-7fc57dcf2653.xlsx`; 12 members |
| `0x7C3A1E6` (130261478) | zip | 11,351 |  | `ecbafd4fb470c935` | zip archive; inside `webview/assets/content-calendar-f684eeebe28d.xlsx`; 15 members |
| `0x8AE8667` (145655399) | zip | 22,984 |  | `e0a4f029118ed8d6` | zip archive; inside `webview/assets/design-review-df0c95705aed.pptx`; 33 members |
| `0x117A464C` (293226060) | zip | 37,284 |  | `b992115701e90a2e` | zip archive; inside `webview/assets/meeting-notes-217e093e29da.docx`; 17 members |
| `0x126E3424` (309212196) | zip | 25,112 |  | `d79c285eb96961e7` | zip archive; inside `webview/assets/monthly-business-review-aa25b4112c50.pptx`; 33 members |
| `0x16A0A4A1` (379626657) | zip | 37,413 |  | `e8142cdf33271711` | zip archive; inside `webview/assets/project-brief-e08b85749970.docx`; 17 members |
| `0x16A18BB2` (379685810) | zip | 8,936 |  | `73420e7a2774cdfc` | zip archive; inside `webview/assets/project-tracker-12f7a4dcd6be.xlsx`; 12 members |
| `0x17D897D9` (400070617) | zip | 37,326 |  | `ee43184e41f4d6f9` | zip archive; inside `webview/assets/report-outline-d47cda7d5af6.docx`; 17 members |
| `0x19560297` (425067159) | zip | 23,490 |  | `fecbff22bbebfeff` | zip archive; inside `webview/assets/sales-discovery-c8f07eacd6f2.pptx`; 33 members |

## App-server protocol catalogs

The zstd frames in the Codex CLI decode to JSON containers of generated TypeScript bindings and JSON Schemas. Each is compared file-for-file with `codex app-server generate-ts` and `generate-ts --experimental` from the same binary.

| Offset | Compressed | Decoded | Binding set | TypeScript files | JSON Schemas | Internal schemas | generate-ts match | Client methods |
| --- | ---: | ---: | --- | ---: | ---: | ---: | --- | ---: |
| `0xAE1CA40` | 155,772 | 4,801,394 | standard | 734 | 314 | 1 | standard 734/734 (generated 734); experimental 712/734 (generated 875) | 107 |
| `0xAE42ABC` | 160,029 | 5,337,029 | experimental | 875 | 440 | 0 | standard 712/875 (generated 734); experimental 875/875 (generated 875) | 170 |

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
