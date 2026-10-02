# Binwalk scan of the Claude Code binary (this release)

Every embedded payload binwalk 3.1.0 reports in the Claude Code 2.1.288 native binary for macOS arm64, regenerated for each release. Each payload is carved at binwalk's offset and size, hashed, decompressed when it is compressed, identified by its structure, and placed relative to the `__BUN` section, which holds the embedded JavaScript and assets the rest of this site is extracted from. A new, removed or changed payload between releases is reported by the watcher.

## Scanned file

| File | Size | SHA-256 | __BUN section | Signatures | Findings |
| --- | ---: | --- | --- | --- | ---: |
| `@anthropic-ai/claude-code-darwin-arm64@2.1.288/package/claude` | 229,255,312 | `bbe93063f7a0` | `0x410C000`, 160,366,784 bytes | copyright 17, crc32 2, pem_certificate 2, pem_public_key 2, riff 1, sha256 1, svg 12, zstd 25 | 29 |

Signatures counted only (svg, png, jpeg, gif, riff, copyright, sha256, crc32, aes_sbox) are icons, license text and hash-constant tables; each is still hashed and diffed release to release. SVG images are counted by this scanner's bounded search because binwalk runs with `-x svg` (its SVG check takes minutes on this binary's JavaScript).

## Findings

| Offset | Signature | Size | Decoded | SHA-256 | Where | Identified as |
| --- | --- | ---: | ---: | --- | --- | --- |
| `0x38D8290` (59605648) | zstd | 65,405 | 162,204 | `a50ea0aec6e1ef83` | outside __BUN | unidentified binary |
| `0x39DF014` (60682260) | zstd | 71,074 | 477,676 | `29a1fdc1d90278d9` | outside __BUN | text |
| `0x39F9F03` (60792579) | zstd | 27,865 | 136,143 | `81f544e2477507c5` | outside __BUN | text |
| `0x49B56CC` (77289164) | pem_public_key | 800 |  | `395759c1f7449ef4` | __BUN | PEM public key |
| `0x4C42DC0` (79965632) | pem_certificate | 708 |  | `22df5ef459b53617` | __BUN | PEM certificate |
| `0xB691693` (191436435) | pem_public_key | 800 |  | `395759c1f7449ef4` | __BUN: `/$bunfs/root/chunk-d9rg2fcs.js` | PEM public key |
| `0xB832FD4` (193146836) | pem_certificate | 708 |  | `22df5ef459b53617` | __BUN: `/$bunfs/root/chunk-s1bjm8ne.js` | PEM certificate |
| `0xD2386B1` (220432049) | zstd | 64,021 | 208,522 | `48444a82d4edcb5b` | __BUN: `/$bunfs/root/chart.umd.min.js` | text |
| `0xD2480C7` (220496071) | zstd | 167,117 | 593,163 | `40bb2eea6ff66e8d` | __BUN: `/$bunfs/root/hljsBundle.generated.min.js` | text; contains copyright 1 |
| `0xD277B15` (220691221) | zstd | 24,296 | 88,532 | `3053d1005e25c867` | __BUN: `/$bunfs/root/template.html-fb05d44d.txt.zst` | text; contains svg 1 |
| `0xD281451` (220730449) | zstd | 31,798 | 117,526 | `a14e3e94a3b38a7c` | __BUN: `/$bunfs/root/artifact-workshop.html-8587e777.txt.zst` | text |
| `0xD289088` (220762248) | zstd | 34,468 | 127,802 | `81443949a38ee51e` | __BUN: `/$bunfs/root/workshop-page.html-a89c848b.txt.zst` | text; contains svg 2 |
| `0xD6A443A` (225068090) | zstd | 31,473 | 95,251 | `ac33e28b62e93322` | __BUN: `/$bunfs/root/permissions_external-64ee756a.txt.zst` | text; contains copyright 1 |
| `0xD6ABF2C` (225099564) | zstd | 128,670 | 576,270 | `82131ac1421ba435` | __BUN: `/$bunfs/root/claude-code.d.ts-816aab49.txt.zst` | text; contains svg 1 |
| `0xD74217D` (225714557) | zstd | 785,819 | 3,566,058 | `18327bef70d96fb5` | __BUN: `/$bunfs/root/mermaid.min.js` | text; contains copyright 1, svg 2 |
| `0xD80D64D` (226547277) | zstd | 27,748 | 103,084 | `57fff821c4b211d4` | __BUN: `/$bunfs/root/ct.mjs-f90faa93.txt.zst` | text |
| `0xD82682C` (226650156) | zstd | 41,172 | 167,048 | `d2c3348b6d4a4db8` | __BUN: `/$bunfs/root/psl-data.json-ffeefa5c.txt.zst` | JSON object |
| `0xD838113` (226722067) | zstd | 19,093 | 70,477 | `599fc9a80173cb39` | __BUN: `/$bunfs/root/playwright-mcp.mjs-3da98bf8.txt.zst` | text |
| `0xD885181` (227037569) | zstd | 24,466 | 69,242 | `25714b54d589b5d8` | __BUN: `/$bunfs/root/SKILL-76b8b2a9.md.zst` | text |
| `0xD8D41E5` (227361253) | zstd | 32,070 | 100,775 | `fd514523fb33274f` | __BUN: `/$bunfs/root/SKILL-69f6fb6b.md.zst` | text |
| `0xD8F2215` (227484181) | zstd | 24,732 | 69,160 | `1c1529ed51351934` | __BUN: `/$bunfs/root/eval-hillclimb-643520d6.md.zst` | text |
| `0xD9240A6` (227688614) | zstd | 84,100 | 318,239 | `a460eacae8c54863` | __BUN: `/$bunfs/root/model-migration-365c3b3c.md.zst` | text |
| `0xD948BC6` (227838918) | zstd | 18,679 | 66,582 | `f23abb75bc079d83` | __BUN: `/$bunfs/root/drop_block_probe-492dab40.py.zst` | text |
| `0xD960266` (227934822) | zstd | 27,613 | 96,305 | `049096a7d12c61f8` | __BUN: `/$bunfs/root/template.html-80565be8.txt.zst` | text; contains svg 7 |
| `0xD96873E` (227968830) | zstd | 41,562 | 154,540 | `6aed147b6312c0c4` | __BUN: `/$bunfs/root/template.html-af756034.txt.zst` | text; contains svg 37 |
| `0xD972999` (228010393) | zstd | 28,340 | 88,266 | `82a6f522faf57e3a` | __BUN: `/$bunfs/root/board.mjs-0bf8864f.txt.zst` | text |
| `0xD97BD21` (228048161) | zstd | 89,731 | 329,237 | `b3defee764d8fe2a` | __BUN: `/$bunfs/root/template.html-94ff54c0.txt.zst` | text; contains svg 38 |
| `0xD991BA5` (228137893) | zstd | 33,596 | 105,678 | `c59fd2ca3dbb0fa2` | __BUN: `/$bunfs/root/merge-state.mjs-49ddf23e.txt.zst` | text |
| `0xD9A05B7` (228197815) | zstd | 27,529 | 80,310 | `727b31d0996b8a22` | __BUN: `/$bunfs/root/plugin-eval-b1b03aad.md.zst` | text |

## Reproduce

In the unpacked `@anthropic-ai/claude-code-darwin-arm64` package:

```sh
binwalk -x svg -l claude.json package/claude
binwalk -x svg -e -C extract-claude package/claude
```

Regenerated by `claude-code/extract/binwalk-scan.mjs`.
