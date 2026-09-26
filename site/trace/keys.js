// Trace's keyboard map: one table drives the key handler, the "?" sheet and the palette's commands,
// so what the sheet says is what the keys do. `bind` maps KeyboardEvent.key to the argument the
// action (palette.js ACTIONS[id]) receives. Rows marked `app` are handled by app.js's own onKey and
// are listed here so the sheet is complete.
export const KEYS = [
  { id: "search", group: "Find", keys: ["/", "⌘K"], label: "Search this session", bind: { "/": 0 } },
  { id: "trail", group: "Find", keys: ["n", "⇧N"], label: "Next / previous result of the last search", bind: { n: 1, N: -1 } },
  { id: "help", group: "Find", keys: ["?"], label: "Show these shortcuts", command: "Keyboard shortcuts", bind: { "?": 0 } },
  { app: true, group: "Move", keys: ["←", "→"], label: "Previous / next request (hold ⇧ to jump 10)" },
  { id: "ends", group: "Move", keys: ["Home", "End"], label: "First / last request", bind: { Home: -1, End: 1 } },
  { id: "agent", group: "Move", keys: ["[", "]"], label: "Previous / next agent", bind: { "[": -1, "]": 1 } },
  { id: "ask", group: "Move", keys: ["a", "⇧A"], label: "Next / previous thing you asked", bind: { a: 1, A: -1 } },
  { id: "panel", group: "Move", keys: ["j", "k"], label: "Step through the panel's items (Enter opens)", bind: { j: 1, k: -1 } },
  { app: true, group: "Move", keys: ["Enter"], label: "Go into the session or the selected agent" },
  { app: true, group: "Move", keys: ["Esc"], label: "Back out one step" },
  { id: "overview", group: "Move", keys: ["o"], label: "Session overview", command: "Session overview", bind: { o: 0 } },
  { app: true, group: "Explore", keys: ["1", "2", "3", "4"], label: "Switch between the four questions" },
  { id: "zoom", group: "View", keys: ["+", "−"], label: "Zoom the map in / out", bind: { "+": 1, "=": 1, "-": -1, "_": -1 } },
  { id: "reset", group: "View", keys: ["r"], label: "Reset the camera", command: "Reset the camera", bind: { r: 0 } },
  { id: "mode", group: "View", keys: ["v"], label: "Switch between the 3D and 2D view", command: "Switch 3D / 2D view", bind: { v: 0 } },
  { id: "landmarks", group: "View", keys: ["l"], label: "Show or hide landmark labels", command: "Show / hide landmarks", bind: { l: 0 } },
  { id: "widen", group: "View", keys: ["w"], label: "Expand or compact the reader", command: "Expand / compact the reader", bind: { w: 0 } }
];

const BY_KEY = new Map();
for (const row of KEYS) for (const [key, arg] of Object.entries(row.bind || {})) BY_KEY.set(key, { row, arg });

// The row and argument for a plain key press (no Ctrl, Alt or ⌘), or null.
export function keyFor(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  return BY_KEY.get(e.key) || null;
}

// ⌘K on a Mac, Ctrl+K elsewhere (either works everywhere).
export function isSearchChord(e) {
  return (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === "k";
}

// Fields that take typed keys. The request slider owns its arrows, Home and End.
export function typingInto(target) {
  return !!(target && target.closest && target.closest("input, textarea, select, [contenteditable=true], [role=separator]"));
}
