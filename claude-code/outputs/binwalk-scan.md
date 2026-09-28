# Binwalk scan of the Claude Code binary (this release)

Every embedded payload binwalk 3.1.0 reports in the Claude Code 2.1.284 native binary for macOS arm64, regenerated for each release. Each payload is carved at binwalk's offset and size, hashed, decompressed when it is compressed, identified by its structure, and placed relative to the `__BUN` section, which holds the embedded JavaScript and assets the rest of this site is extracted from. A new, removed or changed payload between releases is reported by the watcher.

## Scanned file

| File | Size | SHA-256 | __BUN section | Signatures | Findings |
| --- | ---: | --- | --- | --- | ---: |
| `@anthropic-ai/claude-code-darwin-arm64@2.1.284/package/claude` | 226,563,088 | `50a14c2f50f5` | `0x410C000`, 157,689,482 bytes | copyright 17, crc32 2, pem_public_key 2, riff 1, sha256 1, svg 12, zstd 24 | 26 |

Signatures counted only (svg, png, jpeg, gif, riff, copyright, sha256, crc32, aes_sbox) are icons, license text and hash-constant tables; each is still hashed and diffed release to release. SVG images are counted by this scanner's bounded search because binwalk runs with `-x svg` (its SVG check takes minutes on this binary's JavaScript).

## Findings

| Offset | Signature | Size | Decoded | SHA-256 | Where | Identified as |
| --- | --- | ---: | ---: | --- | --- | --- |
| `0x38D8290` (59605648) | zstd | 65,405 | 162,204 | `a50ea0aec6e1ef83` | outside __BUN | unidentified binary |
| `0x39DF014` (60682260) | zstd | 71,074 | 477,676 | `29a1fdc1d90278d9` | outside __BUN | text |
| `0x39F9F03` (60792579) | zstd | 27,865 | 136,143 | `81f544e2477507c5` | outside __BUN | text |
| `0x49A5128` (77222184) | pem_public_key | 800 |  | `395759c1f7449ef4` | __BUN | PEM public key |
| `0xB444C10` (189025296) | pem_public_key | 800 |  | `395759c1f7449ef4` | __BUN: `/$bunfs/root/chunk-12b356cy.js` | PEM public key |
| `0xCFB536F` (217797487) | zstd | 64,021 | 208,522 | `48444a82d4edcb5b` | __BUN: `/$bunfs/root/chart.umd.min.js` | text |
| `0xCFC4D85` (217861509) | zstd | 167,117 | 593,163 | `40bb2eea6ff66e8d` | __BUN: `/$bunfs/root/hljsBundle.generated.min.js` | text; contains copyright 1 |
| `0xCFF47D3` (218056659) | zstd | 24,296 | 88,532 | `3053d1005e25c867` | __BUN: `/$bunfs/root/template.html-fb05d44d.txt.zst` | text; contains svg 1 |
| `0xCFFE10F` (218095887) | zstd | 31,798 | 117,526 | `a14e3e94a3b38a7c` | __BUN: `/$bunfs/root/artifact-workshop.html-8587e777.txt.zst` | text |
| `0xD005D46` (218127686) | zstd | 34,468 | 127,802 | `81443949a38ee51e` | __BUN: `/$bunfs/root/workshop-page.html-a89c848b.txt.zst` | text; contains svg 2 |
| `0xD4210F8` (222433528) | zstd | 29,665 | 88,944 | `2a4edc49dbac12ae` | __BUN: `/$bunfs/root/permissions_external-bf8e779c.txt.zst` | text; contains copyright 1 |
| `0xD4284DA` (222463194) | zstd | 121,696 | 544,492 | `7bdd541d2d29d233` | __BUN: `/$bunfs/root/claude-code.d.ts-c417f0db.txt.zst` | text; contains svg 1 |
| `0xD4BCBED` (223071213) | zstd | 785,819 | 3,566,058 | `18327bef70d96fb5` | __BUN: `/$bunfs/root/mermaid.min.js` | text; contains copyright 1, svg 2 |
| `0xD5870DC` (223899868) | zstd | 26,843 | 99,383 | `42997e590455fee4` | __BUN: `/$bunfs/root/ct.mjs-c4c5ed4a.txt.zst` | text |
| `0xD59FBAF` (224000943) | zstd | 41,172 | 167,048 | `d2c3348b6d4a4db8` | __BUN: `/$bunfs/root/psl-data.json-ffeefa5c.txt.zst` | JSON object |
| `0xD5B1496` (224072854) | zstd | 19,093 | 70,477 | `599fc9a80173cb39` | __BUN: `/$bunfs/root/playwright-mcp.mjs-3da98bf8.txt.zst` | text |
| `0xD5FDF0E` (224386830) | zstd | 24,466 | 69,242 | `25714b54d589b5d8` | __BUN: `/$bunfs/root/SKILL-76b8b2a9.md.zst` | text |
| `0xD64CEF1` (224710385) | zstd | 32,070 | 100,774 | `dde9ae548039fe35` | __BUN: `/$bunfs/root/SKILL-f1be9d20.md.zst` | text |
| `0xD66A06E` (224829550) | zstd | 24,171 | 67,497 | `cb25d90ae3eebd96` | __BUN: `/$bunfs/root/eval-hillclimb-bc802041.md.zst` | text |
| `0xD6971A8` (225014184) | zstd | 84,061 | 317,800 | `ed2cb8ee513126e9` | __BUN: `/$bunfs/root/model-migration-7ea404e2.md.zst` | text |
| `0xD6D2FD0` (225259472) | zstd | 27,613 | 96,305 | `049096a7d12c61f8` | __BUN: `/$bunfs/root/template.html-80565be8.txt.zst` | text; contains svg 7 |
| `0xD6DB4A8` (225293480) | zstd | 41,562 | 154,540 | `6aed147b6312c0c4` | __BUN: `/$bunfs/root/template.html-af756034.txt.zst` | text; contains svg 37 |
| `0xD6E5703` (225335043) | zstd | 28,340 | 88,266 | `82a6f522faf57e3a` | __BUN: `/$bunfs/root/board.mjs-0bf8864f.txt.zst` | text |
| `0xD6EEA8B` (225372811) | zstd | 89,731 | 329,237 | `b3defee764d8fe2a` | __BUN: `/$bunfs/root/template.html-94ff54c0.txt.zst` | text; contains svg 38 |
| `0xD70490F` (225462543) | zstd | 33,596 | 105,678 | `c59fd2ca3dbb0fa2` | __BUN: `/$bunfs/root/merge-state.mjs-49ddf23e.txt.zst` | text |
| `0xD713321` (225522465) | zstd | 27,529 | 80,310 | `727b31d0996b8a22` | __BUN: `/$bunfs/root/plugin-eval-b1b03aad.md.zst` | text |

## Reproduce

In the unpacked `@anthropic-ai/claude-code-darwin-arm64` package:

```sh
binwalk -x svg -l claude.json package/claude
binwalk -x svg -e -C extract-claude package/claude
```

Regenerated by `claude-code/extract/binwalk-scan.mjs`.
