# Plan: port the harness layer into Trace, and remove grains (2026-09-27)

**Goal.** Add the harness layer to `site/trace` as a real third mode beside 3D and 2D. It shows the text
the harness put in front of the model: where each piece came from, what put it there, who got it, and
when. It must work for Claude Code and Codex/ChatGPT sessions, and for **any** session a user opens, not
only prepared ones. Remove grains at the same time.

**Constraints (David, 2026-09-27):**
- This is **another layer, never a replacement**. The landscape, the 2D view, every sidebar panel and lens,
  search, the reader, the custody ladder, playback, the minimap and keys all stay and keep working.
- Grains go: the pour, the re-read sweep, density, words-on-grains and the compaction puck. Following one
  item copy by copy survives through the layer.
- Organize by what reached the model; a library match is only an annotation. Unnamed pieces are the headline.
- Never frame anything around token cost or re-reads.
- Say "Codex/ChatGPT", never "Codex" alone.

**Reference implementation.** The prototypes live locally in `private/research/restart/combined/`. Read them
there, never copy their data. `docs/harness-layer.md` summarizes the design.
- `build_data.py` and `../opus-a/work/{extract,bucket}.py`: Claude Code derivation.
- `codex/derive_codex.py`, `codex/readref.py`: Codex/ChatGPT derivation.
- `proto.src.html`: the view.
- `integration/patch_trace_copy.py`, `integration/cc/trace/harness/harness-mode.js`: the app wiring.
- `data/combined.json`: the data contract, as the view consumed it.

## Interfaces (fixed; change them only through the lead)

### 1. `site/trace/harness/pieces.js`
Pure logic, no DOM. It runs in the worker.

```js
// Build the harness model for a loaded trace. `readText(agentIdx, blockIdx)` resolves a block's exact text
// (the worker already reads refs, and the model must follow ref.path). `index` is the product's prepared
// reference index. `literals` is the optional literal index (see 3), or null.
export async function buildHarnessModel({ trace, readText, index, literals, onProgress }) -> HarnessModel
// One request's assembly, computed on demand (no precomputed racks).
export function rackFor(model, trace, agentIdx, reqIdx) -> { agent, req, t, plates: Plate[] }
```

**HarnessModel** follows `data/combined.json`, minus `racks` (computed live) and `rules` (build-time
overrides don't exist at runtime):
- `product`, `libName`, `shelves[{name,n}]`.
- `session{version,title,started,ended,nagents,nrequests,libVersion,minutes}`.
- `agents[{id,name,kind,model,born,end,reqs,parent,comp[]}]`.
- `pieces[{id,name,rung,origin,record,where{shelf,key,pos,label},trigger,triggers[[name,n]],via[[vehicle,n]],n,reach,sample,recordText,composite,userShare,gates,note,firstLog{file,offset,path},ev[[agentIdx,minutes]],blocks[[agentIdx,blockIdx]],odd,partial,order}]`.
- `births[{n,pieces[]}]`.

Rungs: `linked`, `linked-type-text-differs`, `in-library-unlinked`, `binary-only`, `composite`, `outside`
and `found-nowhere`.
- **At runtime, link by text, not by attachment type.** This fixes Trace's linker bugs: MCP-failed notices
  filed as deferred tools, the teammate envelope never linked, and templated text defeating line hashes.
- `binary-only` needs the literal index. Without it, such pieces are `found-nowhere` and labelled "not in
  the library".

**Grouping.** Group discovery-first, by each piece's own normalized first line, wherever it rode in: its
own block, appended to a tool result, inside a user turn, inside an agent message, or in the system and
tools slot. Drop look-alikes: reminder markup quoted mid-body in tool output or in code the model read.
**Triggers** are observed regularities, labelled as such: at agent birth, every turn, after compaction,
after a file edit, on a hook, mid-turn typing, a teammate message, a silence timer. Never claim harness
intent.

### 2. `site/trace/harness/view.js` (plus `harness.css`)
DOM and three.js. It runs on the main thread.

```js
export function createHarnessView({ container, onPick /* (agentId, blockIndex) */ }) -> {
  setModel(model, trace), show(), hide(),
  sync({ level, agentId, reqIdx, block }),   // Trace's selection drives the layer
  playhead(minutes),                         // Trace's transport drives the time cursor
  dispose()
}
```

- The layer renders into its own canvas inside `container`. It is a module, not an iframe.
- **Views:**
  - Session board: origin rail, trigger clamps, recipient fan, and the when-plane.
  - Request rack: live, from `rackFor`.
  - Compare: births.
  - Later: what events added.
- **Presets:** hero, session, one request, later, compare, close-up.
- The hero is the data-picked least-explained piece. Prefer text that reads like an instruction over
  formatting headers.
- It renders on demand and does no work while hidden.
- Everything product-specific comes from the model.

### 3. The literal index (build time; **not shipped until David decides**)
Built by `site/src/shared/trace-build.mjs` from `claude-code/work` (the extracted chunks) and `codex/work`
(the CLI source, the binary, and app.asar):
- **Contents:** hashes of normalized literal lines and prefixes, plus chunk or file and offset. No text.
- **Output:** `dist/trace/literal-index.json` only when `HARNESS_LITERALS=1`.
- **Default:** off. The view says "not in the library" instead of "in the binary at …".

### 4. The app wiring (owned by the lead)
The same edits as the integration mock:
- `app.js`: `setMode("harness")`, `S.lastMode`, history, `sync` from `render()`, `playhead` from
  `onPlayhead`, hand-off via `A.openBlockAt`, and playback and minimap visible in harness mode.
- `index.html`: the button, before `#mode`.
- `keys.js`: the `h` key.
- `palette.js`: the action.
- The worker message `{type:"harness"}` is computed lazily, the first time the mode opens.

## Work split (one git worktree each, disjoint files)

| Owner | Branch and worktree | Owns |
|---|---|---|
| **A** pieces | `port/pieces` in `.worktrees/pieces` | `site/trace/harness/pieces.js`, `worker.js` (the harness message), the literal-index build in `site/src/shared/trace-build.mjs`, and `site/trace/test/harness-pieces.test.mjs` (+ fixtures) |
| **B** view | `port/view` in `.worktrees/view` | `site/trace/harness/view.js`, `site/trace/harness/harness.css`, `site/trace/harness/vendor/` (only if addons are needed; prefer `site/trace/vendor`), and `site/trace/test/harness-view.test.mjs` |
| **C** grains out | `port/grains-out` in `.worktrees/grains` | `grains.js`, `grain-rules.js` and their tests; grain hooks in `scene.js`, `playback.js`, `director.js`, `landscape-geometry.js`, `scene-rules.js`, `block-text.js`; grain controls in `app.js` (only the grain lines); `docs/specs` and `docs/plans` status notes |
| **Lead** | `main` | the rest of `app.js`, `index.html`, `keys.js`, `palette.js`, `trace.css`; integration, the gate, live verification and docs |

`app.js` is shared: C removes only grain lines, and the lead adds the harness wiring. The lead merges C
first and then wires on top.

## Gates
- **Each owner:** focused tests for their files, plus `cd site && node --test trace/test/*.test.mjs`
  green in their worktree.
- **Lead after merging:** `npm run check`, which covers build, all tests, links and leaks. Then
  Playwright on the real sessions in `private/sessions/`: one Claude Code session and three
  Codex/ChatGPT sessions (A, B, C). Verify:
  - existing views and panels are unchanged;
  - the harness mode works;
  - hand-offs work in both directions;
  - no console errors.
- Then stills for David. **No deploy or push without his OK.**
