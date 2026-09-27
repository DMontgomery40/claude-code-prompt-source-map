# Harness layer (in progress)

A new view in Trace, beside the 3D landscape and the 2D view. It shows what the harness put in front of
the model: every piece of harness text, where it came from, what put it there, who got it, and when. It
**adds** a view and replaces nothing. The landscape, the 2D view, every sidebar panel and lens, search,
the reader, the custody ladder and playback all stay. Grains are the one exception: they may be removed
(decision 2026-09-27).

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

## Status
- Prototyped and integrated as a mock inside built copies of Trace for both products: a Harness button next
  to 2D/3D, and the `h` key.
- Tested on one Claude Code session and three Codex/ChatGPT sessions.
- Not yet ported into `site/trace`. Porting needs:
  - a first-class mode in `setMode`;
  - hand-off through `A.openBlockAt`;
  - rendering as a module rather than an iframe;
  - pieces computed in `worker.js`;
  - a shipped literal index next to `reference-index.json`.
- Open decision: whether an index derived from the binary may ship publicly.

## Where the work in progress lives
Locally, in the gitignored `private/research/restart/`. That covers the brief, discovery scans, the four
prototypes with their reports, and the combined build (`combined/`: data builders, the page,
Codex/ChatGPT support, the integration mock and its stills). It embeds real session text, so it never
leaves this machine.
