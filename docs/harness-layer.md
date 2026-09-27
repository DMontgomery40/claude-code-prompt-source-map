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

## Status
- **Prototyped and integrated as a real mode in built copies of Trace, for both products.**
  - A Harness button sits next to 2D/3D, and the `h` key toggles it. Both appear in the "?" sheet and the command palette.
  - `?view=harness` opens straight into it.
  - `S.mode = "harness"` is a real mode, so back and forward work through view history.
  - Trace's selection and playhead drive the layer.
  - A click in the layer calls `A.openBlockAt`, so the reader, crumbs and playhead follow.
  - Grains are gone from Trace (removed 2026-09-27, `port/grains-out`).
  - The patch against the built Trace is small: app.js +21 lines, index.html +3, keys.js +1, palette.js +1, plus a `harness/` folder.
- **Tested** on one Claude Code session and three Codex/ChatGPT sessions.
- **Not yet ported into `site/trace`.** The port needs to:
  - apply those edits to the source;
  - mount the layer as a module in the stage container (no iframe, no second WebGL context);
  - compute pieces in `worker.js` instead of precomputed per-session data;
  - ship a literal index next to `reference-index.json`;
  - add an n/N "next copy of this piece" key.
- **Known rough edges:**
  - Esc/back can leave the mode.
  - A 2D-only session has no playback or minimap in the layer.
  - The panel note says "ridge" in Harness mode.
  - The bottom-left is tight under 980 px.
- **Open decision:** whether an index derived from the binary may ship publicly.

## Where the work in progress lives
Locally, in the gitignored `private/research/restart/`. That covers the brief, discovery scans, the four
prototypes with their reports, and the combined build (`combined/`: data builders, the page,
Codex/ChatGPT support, the integration mock and its stills). It embeds real session text, so it never
leaves this machine.
