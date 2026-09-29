#!/usr/bin/env node
// The release navigator pairs announcements with extracted evidence. It does not
// infer server prompts or account availability from client strings.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { productOrigin } from '../../../site/src/shared/site.mjs';
import { privacyScan } from './lib/privacy.mjs';
import { coverageTotals } from './lib/coverage-summary.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = name => JSON.parse(fs.readFileSync(path.join(repo, 'outputs', name), 'utf8'));
const sources = read('sources.json');
const tools = read('desktop-tool-manifest.json');
const config = read('codex-config.json');
const env = read('codex-env-vars.json');
const cli = read('codex-cli-prompts.json');
const coverage = coverageTotals(read('devday-surface-coverage.json'));
const promptFiles = ['conversation', 'gpt-builder', 'work', 'finance-health', 'sites-artifacts'].map(p => read(`chatgpt-${p}-prompts.json`));
const absentStyle = promptFiles.flatMap(p => p.not_found ?? []).filter(p => p.id.startsWith('write-like-me-')).length;
const prompts = promptFiles.reduce((n, p) => n + p.items.length, 0);
const link = (label, slug) => `[${label}](${productOrigin('codex')}/${slug}/)`;
const md = `# Dev Day: what changed in the harness

This capture reads ChatGPT desktop ${sources.app.version} (build ${sources.app.build}) and its bundled ${sources.cli.version}. The Dev Day refresh began with build 11645 / CLI 0.158 as its baseline; current extraction pages use the capture above. Dated browser observations and historical binary reports retain their original evidence dates.

## Start with the changed instructions

- ${link('GPT-6.1 Sol base instructions', 'gpt-6-1-sol-base-instructions')} and ${link('full model record', 'raw-captured-gpt-6-1-sol-record')} expose the newly catalogued model's instruction stack.
- ${link('Model prompt comparison', 'three-model-prompt-comparison')} compares the dedicated GPT-6 model records in this authenticated capture; ${link('conditional modules', 'conditional-instruction-modules')} includes model-specific differences.
- ${link('ChatGPT Work prompts', 'chatgpt-work-prompts')} includes the grounded writing-style demo, private review/repair prompts and GIF-editing instructions. ${absentStyle} older writing-style anchors are explicitly absent in this build.
- ${link('Desktop tool manifest', 'tool-manifest')}, ${link('bundled plugins', 'chatgpt-bundled-plugins')}, ${link('computer-use prompts', 'computer-use-prompts')} and ${link('other model-facing text', 'desktop-model-facing-text')} show the tools and additional instructions the app can put before a model.

## Announcements and their source-map boundaries

The [official Dev Day recap](https://openai.com/index/devday-2026-recap/) provides the announcement boundary. The table below connects those announcements to the extracted pages; shipped bytes establish client implementation, while the announcement establishes public product status.

| Announced surface | Extracted evidence and activation boundary |
| --- | --- |
| GPT-6.1 Sol | Select the model; the dedicated catalog record supplies its prompts. [Official model announcement](https://openai.com/index/introducing-gpt-6-1-sol/). |
| Ultrafast | Speed-tier configuration and catalog settings are distinct from instruction text. Account-specific settings are excluded. [Official speed-tier guidance](https://learn.chatgpt.com/docs/agent-configuration/speed). |
| Cloud tasks and reusable environments | Environment setup, permissions and cloud-related client surfaces are inventoried. Cloud-side instruction assembly remains unobserved. [Cloud documentation](https://learn.chatgpt.com/docs/cloud). |
| Refreshed CLI | Compiled prompts, feature gates and configuration follow ${sources.cli.version}, including opt-in steering. [Official changelog](https://learn.chatgpt.com/docs/changelog). |
| Code review | User-triggered private-review and repair messages are extracted with hashes. Posting and cloud execution are separate actions. [Review documentation](https://learn.chatgpt.com/docs/code-review?surface=app). |
| Security Cloud | Repository scanning and scheduled runs are announced; client endpoint evidence does not reveal cloud prompts. [Cloud setup](https://learn.chatgpt.com/docs/security/setup). |
| Decisions API | A finite-answer preview is announced. No Decisions request or server prompt is inferred from the desktop catalog. |
| Agents API and computer use | API-hosted harness behavior and desktop computer-use prompts are separate evidence sources. [API computer-use documentation](https://developers.openai.com/api/docs/guides/agents-api/tools/computer-use). |
| Plugin extensions and creation | Bundled plugin instructions, sidebar/viewer surfaces and creation prompts are captured. Plugin permissions still determine access. |
| Sites with plugins | Sites prompts and artifact/tool plumbing are captured; connected data remains subject to the selected plugin's permissions. |
| Dots, Spaces and ongoing tasks | Rule, Space and scheduling surfaces are inventoried. No server instruction stack is claimed from UI strings alone. |

## What was refreshed

The configuration reference now contains ${config.items.length.toLocaleString('en-US')} entries; the environment-variable reference contains ${env.items.length.toLocaleString('en-US')}. The desktop manifest contains ${tools.tools.length} tools. The five ChatGPT prompt pages publish ${prompts} items. CLI prompt/skill verification is in ${link('the compiled CLI inventory', 'codex-cli-prompts')}. Exact spans, assembled templates, path-only evidence and unavailable anchors retain separate labels.

The ${link('Dev Day surface coverage ledger', 'devday-surface-coverage')} accounts for all ${coverage.candidates} structural candidates and maps them to existing coverage, added evidence, incidental changes or unresolved implementation details. Jev's ${coverage.positive} positive classifications are review signals; ${coverage.positiveEndpoints} are endpoints. These counts do not establish newly active features. The ${link('package scan', 'package-scan')} and ${link('binary scan', 'binwalk-scan')} preserve their own build provenance and experimental-method boundaries.

## Limits of this capture

These pages show what the shipped harness can send and the conditions visible in its code. A compiled endpoint, translated label, feature flag or prompt does not prove an account can activate it. Dated Work browser tests remain dated: Codex CLI catalog prompts are not substituted for Work's server-side instructions. Private sessions and account identity are excluded.
`;
privacyScan(new Map([['devday-update.md', md]]));
fs.writeFileSync(path.join(repo, 'outputs/devday-update.md'), md);
console.log(JSON.stringify({ page: 'devday-update', prompts, config: config.items.length, env: env.items.length, cli_records: cli.items?.length ?? null }));
