# Binwalk of the installed Codex desktop payload

Scanned September 24, 2026 (America/Denver). This follows the linked Aeon/Daybreak investigation and examines the **same installed build**: ChatGPT Desktop `26.917.71314`, bundled Codex `0.155.0-alpha.16.4`. The Codex executable SHA-256 is `93169e745735930598e867ad837abf3fdc50774a3ad7e7aa89c0d0c51b0189a5`; `app.asar` is `03108a728bdb1616958ab89587c5495cab0cf4cd1bbe109bdfb186df0a113804`.

This extraction identifies particular embedded payloads. It is not a complete inventory of the application's icons, resources, or remote configuration.

## Result

An actual Binwalk 3.1.0 signature scan and recursive extraction found **two Zstandard frames embedded in the Codex Mach-O executable**. Earlier raw-string searches would not see their decompressed contents. Both frames are JSON containers with generated TypeScript protocol bindings and JSON Schemas:

| Executable offset | Compressed bytes | Decoded bytes | Binding set | TypeScript files | JSON Schemas |
|---|---:|---:|---|---:|---:|
| `0xAA90C6C` (`178850924`) | 151,873 | 4,727,387 | Standard | 726 | 310 |
| `0xAAB5DAD` (`179002797`) | 158,242 | 5,297,123 | Experimental | 867 | 436 |

Every TypeScript file in the first frame matched the installed binary's `app-server generate-ts` output byte-for-byte (726/726). Every TypeScript file in the second frame matched `app-server generate-ts --experimental` (867/867). This identifies the frames as the current standard and experimental app-server protocol catalogs, rather than guessed text fragments. The experimental catalog adds 63 client request methods (167 versus 104 standard), 141 TypeScript files, and 126 individual JSON Schema files.

The separate `binwalk-method-diff.json` lists all 63 additional method names and both decoded payload hashes.

## What the earlier inspection missed

1. **Saved Daybreak selection is a distinct experimental task field.** `ThreadStartParams.daybreakEnabled` sets the initial choice for a persistent task; `ThreadMetadataUpdateParams.daybreakEnabled` can patch it; `Thread.daybreakEnabled` reports the saved value. The schema says this choice does not select the turn's cyber program or grant access.
2. **A separate experimental turn request field names the treatment.** `TurnStartParams.cyberAccessProgram` accepts `standard`, `daybreakBlue`, or `daybreakRed`. Its type comment says authorization and model-tier restrictions remain server owned. The enum type exists in both generated catalogs, but the request field appears only in the experimental `TurnStartParams`.
3. **Additional experimental orchestration surfaces are present in the binary.** The 63 additional client methods include `thread/queue/*` (add, delete, list, reorder, start, update), `thread/settings/update`, `turn/settings/update`, `thread/memoryMode/set`, `memory/status`, `memory/reset`, `thread/backgroundTerminals/*`, `thread/timeline/list`, and `thread/search*`. Other groups cover project management, environments, remote control, realtime sessions, process control, and user verification. These are protocol definitions; Binwalk alone does not establish that a particular account or client can call them successfully.
4. **No Aeon-specific protocol contract was recovered from either compressed catalog.** Neither contains `thread/startAeon`, `task/checkpoint`, `cloud_threads`, `condition_watch`, or an `Up Next` field. This supports the linked investigation's narrower conclusion about the local app-server protocol. It does not rule out another service or an instruction-level mechanism.

## Other signatures and triage

- The standard scan of `codex` found 28 signatures: two Zstandard frames, six SVGs, four PNGs, and code/text signatures. Full recursive extraction produced the two JSON containers plus ten images. Scanning the decoded containers found no further embedded file signatures.
- The standard scan of `app.asar` found 3,170 signatures, dominated by 2,311 SVGs, 580 RIFF/WebP images, and 220 PNGs. Its nine ZIP hits map exactly to packaged `.docx`, `.pptx`, and `.xlsx` example templates in the ASAR index. All nine extracted successfully; their extracted files had no Aeon, Daybreak, persistent, or checkpoint text matches.
- `--search-all` additionally reported 215 zlib candidates in `app.asar`: 206 map into `.woff` fonts, one into `.woff2`, and eight tiny candidates into JavaScript assets. The eight JavaScript candidates failed independent zlib decompression and are not evidence of hidden compressed logic. All 34 zlib candidates in the Codex executable are only 10–59 bytes. Search-all also reports generic signature false positives, so its counts are not treated as validated payloads.
- A standard scan of `codex-code-mode-host` found no extractable compressed or archive payloads.

## Model aliases are in a different evidence source

The linked September 3 investigation captured an authenticated **live Statsig bootstrap** response with this model configuration:

| Field | Value in that response |
|---|---|
| `default_model_id` | `nathree-aeon` |
| `fixed_model_priority` | `nathree-aeon`, `nathree` |
| `allowed_model_ids` | `gpt-5.6-sol`, `persian`, `mewtwo`, `mewfour`, `nathree`, `nathree-aeon`, `natu-aeon`, `gpt-6-astra` |

Those are real strings in the captured server response, so the earlier binary-focused report was incomplete if read as an inventory of *all* Aeon-related evidence. They were **not** recovered by Binwalk from the installed executable. A separate literal-byte sweep of the current installed ChatGPT app (4,185 files, 1.44 GB) and 12 extracted files from the Codex executable found no `mewfour`, `mewtwo`, `nathree`, `nathree-aeon`, or `natu-aeon` occurrences. The `persian` occurrences in local app files were language, calendar, Unicode, or glyph data, not model configuration. The installed binary hashes above still match this sweep.

The live response is evidence of a remotely evaluated configuration, not proof that these IDs are selectable on this account. In the linked task, requests using `mewfour`, `nathree`, `persian`, and the Aeon IDs returned HTTP 400; a fabricated control ID returned the same class of rejection. A separately saved bootstrap response contained only `gpt-5.6-sol` in its model configuration. The configuration can vary by evaluation context, and a generic rejection does not establish whether an alias exists behind another gate. No behavior, weights, or capabilities can be inferred from these names alone.

## Reproduction and limits

Commands used (Binwalk 3.1.0):

```sh
binwalk -l codex.json /Applications/ChatGPT.app/Contents/Resources/codex
binwalk -a -l codex-all.json /Applications/ChatGPT.app/Contents/Resources/codex
binwalk -e -M -C extract-codex-full /Applications/ChatGPT.app/Contents/Resources/codex
binwalk -l app-asar.json /Applications/ChatGPT.app/Contents/Resources/app.asar
binwalk -a -l app-asar-all.json /Applications/ChatGPT.app/Contents/Resources/app.asar
binwalk -e -M -y zip -C extract-asar-zips /Applications/ChatGPT.app/Contents/Resources/app.asar
/Applications/ChatGPT.app/Contents/Resources/codex app-server generate-ts --out generated-stable
/Applications/ChatGPT.app/Contents/Resources/codex app-server generate-ts --experimental --out generated-experimental
```

The companion evidence archive includes Binwalk's JSON logs, extraction logs, and both decompressed protocol containers. Binwalk detects supported signatures; it cannot prove that every opaque, encrypted, or custom-encoded payload in the application has been found. The protocol files prove bundled definitions, not live availability or permission.

[Download the raw Binwalk logs and extracted protocol bundles](./binwalk-evidence.tar.gz).
