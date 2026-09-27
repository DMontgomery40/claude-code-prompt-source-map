# Harness layer (in progress)

A new view in Trace, beside the 3D landscape and the 2D view. It shows what the harness put in front of
the model: every piece of harness text, where it came from, what put it there, who got it, and when. It
**adds** a view and replaces nothing. The landscape, the 2D view, every sidebar panel and lens, search,
the reader, the custody ladder and playback all stay. Grains were the one exception, and were removed
on 2026-09-27.

## What it shows
- **Pieces.** What reached the model is grouped by the text's own shape, wherever it rode in: its own
  reminder block, appended to a tool result, inside a user turn, or inside an agent message. A library
  match is an annotation on a piece, never the category it is filed under. Pieces nobody has named are
  the headline.
- **Provenance rungs.** Each piece is one of:
  - linked to a library record;
  - linked by type, but the text differs;
  - in the library, but Trace doesn't link it;
  - only in the binary or app bundle (unnamed);
  - composite;
  - outside any binary (your files, MCP servers, the model service);
  - found nowhere.
- **Views.**
  - **Session board:** wires run from the origin rail, through a clamp for the trigger, out to the agents
    that got the piece, then onto a timeline.
  - **Request rack:** one request assembled in log order, carrying the literal text.
  - **Compare:** births of the main thread against a subagent.
  - **Later:** the pieces events added to a request.
- **Hand-offs.** A click in the layer opens Trace's own reader at that block. A selection in Trace's
  sidebar drives the layer.

## Status (2026-09-27): ported into `site/trace`
- **The mode.** The Harness button sits beside 3D/2D, and the `h` key toggles it. Both appear in the "?"
  sheet and the command palette. `?view=harness` opens straight into it, and back and forward work.
- **Where it lives.**
  - `harness/pieces.js` builds the model in the worker, lazily, the first time the mode opens. It works on
    any session and links pieces by text.
  - `harness/view.js` draws the board, live racks, compare, later and six presets. It uses its own canvas,
    renders on demand, and does nothing while hidden.
  - `harness/mode.js` is the glue.
- **What keeps working.** The 3D scene runs hidden under the layer, so playback and the session map still
  work.
- **Hand-offs.** A pick opens the existing reader through `A.openBlockAt`, and Trace's selection drives
  the layer.
- **Literal index.** Each product ships `literal-index.<product>.json`: hashes, file names and offsets,
  with no text. The page fetches it only when the layer opens.
- **Verified** in the built site on one Claude Code session and three Codex/ChatGPT sessions. The model
  builds in 0.5–3.6 s in the browser, and there are no console errors.
- **Placing short wrappers (dfe10dd).** The literal index also keeps short markers: a wrapper's head
  line or an opening tag, matched only when a piece's whole first line matches. Rust sources are read as
  Rust strings. On the three private Codex/ChatGPT sessions, the pieces that read "not in the library"
  went from 10, 7 and 5 to 1, 1 and 0.
- **Craft pass (122c9dd).**
  - A cool, neutral stage.
  - The legend sits in the caption, and the layer keeps clear of Trace's playback bar and Session map.
  - One hero callout; hover shows a tip, and a pick sends a pulse along the wire.
  - Racks fold repeats into one "×n" plate and frame only as many rows as stay readable; the wheel walks
    the rest.
- **Open.**
  - **The hero graphic doesn't carry the claim.** The caption does. A cold read called the wires mostly
    decoration, and next to Ryan Sael's frames at the same scale it is still behind on materials and on
    having one designed object. This is a concept question, not a craft one.
  - **At 1280×800,** Trace's own chrome leaves the layer about 240 px of height.
  - **Text on linked plates** is lower contrast than on the red and amber ones.
  - **Size.** The literal index is 1.7 MB (Claude Code) and 1.2 MB (Codex/ChatGPT) gzipped, and loads
    only when the layer opens.

## Where the work in progress lives
Locally, in the gitignored `private/research/restart/`. That covers the brief, discovery scans, the four
prototypes with their reports, and the combined build (`combined/`: data builders, the page,
Codex/ChatGPT support, the integration mock and its stills). It embeds real session text, so it never
leaves this machine.
