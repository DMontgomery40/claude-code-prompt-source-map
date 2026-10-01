# Trace: organizing the wire data, and keeping the user's place

Date: 2026-09-30. Status: built.

## Problem

- **The lens was one long column.** "What went over the wire" stacked every section. On a real Claude Code capture
  (80 MB, 446 requests) it was 26 screens tall. 70% of that was a 262-row telemetry timeline of mostly repeated events.
- **The per-request card buried core features.** It was 1,700 px and pushed Action and the Custody ladder off-screen.
- **The sidebar lost the user's place.** Every state change rebuilt it, so:
  - Opening a body or block jumped to the top.
  - Closing the reader left the user there.
  - Back restored a raw `scrollTop` over different content.
  - Crumbs and lens tabs went to the very top.
  - "Show all" lists, folds and Show/Hide boxes closed again.

## How the design was chosen

Three designs were proposed, each organizing the data a different way:

- **A, digest first:** findings up front, sections closed.
- **B, one request list:** every entry in one filterable list, with facets.
- **C, by destination:** grouped by party, then host, then endpoint.

A judge scored them on these criteria:

- the default height stays bounded
- the researcher's first questions are on the first screen at 420 px
- Action and Custody aren't buried
- it works for both products, at 420 px, widened, and on mobile
- nothing is removed
- every control has a stable key
- the cost is reasonable

A won. From the others it borrows:
- from C: the party-first host list, grouping by path template so every entry is reachable, and the
  per-call sensitive-data fold that opens by itself when something is flagged
- from B: the Log | Wire token table, inline readers, and "what changed since the previous call"

B's request list and C's destination tree are left for later. They would be new modes, and their data models
duplicate capture.js.

## The user's rules (they outrank everything)

- **Dropdowns, not pills.** Filters are `<select>` menus or search boxes. Lists of names (tools as sent, betas)
  are tables and lists. Rule numbers are text with the title on hover.
- **Never hide what DevTools shows.** Anything in the capture is visible, or one labelled click away with its
  count. That includes:
  - deferred tools, which get their own column in "Tools as sent"
  - every endpoint entry (previously "and 215 more" was unreachable)
  - every event, every send and every header
  - a body longer than 400,000 characters ("Show all N characters")

## The lens, top to bottom

1. **Header:** the source line, and the notes in a fold.
2. **Findings.**
   - *Calls by model*: one row per model, with calls, in the log or not, input, output, cache read and cache
     write. The main model is first; side models (e.g. Haiku while the session runs on Opus) are marked.
   - *Six one-line findings*, each with an "Open →" that opens its section: Not in your log, Credentials,
     Identity, Phones home, Switched on, Against the log.
3. **Sections, closed**, each summary stating what's inside and how many:
   - **Model calls:** "Requests not in your log" (open), then one group per call signature, each call with what
     changed since the last.
   - **Sensitive data in transit:**
     - Credentials sent: the credential cards, unchanged.
     - Where they travel: the rules, a rule dropdown, then one fold per host, third parties first.
   - **Endpoints by role:** a host list, then roles → endpoints → path groups, 25 entries then the rest.
   - **Telemetry** (Codex/ChatGPT: Analytics events):
     - a name dropdown
     - repeats in a row merged, each merged row openable
     - 25 rows, then the rest
     - all event names
     - every event in order, drawn when opened
   - **Betas, flags & client_data** (Codex/ChatGPT: Feature states, model catalog & handshake).
   - **Account, plan & limits.**
   - **Headers:** a search box and a side dropdown.

## The request panel (L2) and layers (L3)

**L2, top to bottom:**
1. A one-line wire summary that jumps to the card.
2. Where the context came from.
3. Tokens, the log's beside the wire's, with a verdict line.
4. Action.
5. Custody ladder.
6. The On the wire card. Collapsed, it shows the route, the ids and the body buttons, then one-line folds:
   - Sensitive (open when something is flagged)
   - Not in the log (system blocks, tools, other parts)
   - Betas
   - The response
   - Rate limits
   - Codex/ChatGPT adds response.create, and the attribution table (60 rows, then the rest).

**L3:** a block's reader opens inside the row that opened it.

## State (panel-memory.js)

- **One record per view** (lens, level, agent, request, layer, inspected call). It holds:
  - the open folds, under stable `data-fold` keys
  - dropdown and search values
  - an anchor: the row at the top edge, found again by its child path or the nearest key
- **Rebuilds:** `app.js paintPanel()` saves the record before every rebuild and restores it after.
- **Readers:** closing one returns to the row that opened it.
- **History:** entries carry the record, so Back, crumbs and lens tabs return to the same folds and row.
- **Collapsing a fold** keeps its header on screen.

## Checks

- `test/panel-memory.test.mjs`: folds, values, anchors by path and by key, opener return.
- `test/network-digest.test.mjs` (both products' fixtures):
  - calls by model add up to every call and its usage
  - always six findings
  - every entry in exactly one path group
  - hosts ordered third party first
  - log and wire token rows
- `test/ui.test.mjs`:
  - findings first, with one row per model
  - sections start closed
  - fold keys are unique
  - no pills outside the credential cards
  - nothing planted shows, even with every fold open
  - Action sits above the card
- **In Chrome** on the real capture, each case at 0 px drift:
  - wire body close
  - Back from a request
  - "Show all" tool calls and Back
  - lens tabs away and back
  - block reader close and Back
