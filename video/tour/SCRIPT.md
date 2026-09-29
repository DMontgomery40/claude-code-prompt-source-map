# Tour video, v2: a story, not a feature list (154 s, 16:9 and 4:5)

v1 (109 s) was rejected on 2026-09-28: it opened on "Search the Claude Code source map… press two…" and never said
what this is, what a harness is, why hidden prompt text matters, or what the 3D picture means. v2 is built on a
question the viewer already has, **"why did my agent do that?"**, answered in four parts:

1. **The problem.** The model gets far more text than you typed, you never see it, and it decides what the agent does.
2. **What this is.** The harness writes that text; Harness Source Map reads every piece out of the shipped apps.
3. **Proof in your own session.** Trace shows what the harness actually sent, what came from you, what the agent did.
4. **What even the log hides.** A network capture shows the rest: the system prompt as sent, the tools, the flags,
   and where your data went.

Every feature appears as the answer to a question, and the 3D picture is explained before it's used. A chip, top-left,
names each part as it begins (Harness Source Map / Trace · your session / Trace · network capture).

Framing (AGENTS.md): harness transparency, never token cost. Left out: the harness layer view (`h`, the Harness
button, hero cards, weaving wire), grains, and lenses 3 and 4 (lens 3's flagged items were private bash commands).

| # | t (s) | picture | voiceover |
|---|-------|---------|-----------|
| 1 | 0–14 | Drawn: a chat box types "fix the failing test"; above it the stack the model receives rises slab by slab (system prompt, tool definitions, reminders, skills, MCP instructions, hook output, your CLAUDE.md again); the harness-written slabs get "undocumented" tags. | "Ever wonder why your coding agent did what it did? The model sees far more than you typed: a system prompt, tool definitions, reminders slipped between your turns. You never see it, and almost none of it is documented." |
| 2 | 14–24 | The landing page: "What the agent harness puts in front of the model." (boxed), a scroll to the Claude Code and Codex/ChatGPT cards. | "It's written by the harness: the program around the model, like Claude Code or Codex. Harness Source Map reads all of it out of the shipped apps." |
| 3 | 24–32 | Claude Code map: ⌘K "plan mode", Enter on the Plan mode header reminder: the exact text, file and offset. | "How does plan mode stop Claude Code from editing? Here's the exact reminder it inserts, and where it ships." |
| 4 | 32–39 | Codex/ChatGPT map: ⌘K "persistent", Enter: the persistent-mode instructions page. | "The same for Codex and ChatGPT, including GPT-6's persistent-mode instructions." |
| 5 | 39–48 | What wins, advisor card: tick the remote flag (the verdict flips on), tick the env var (it flips back off). | "What wins shows which setting Claude Code obeys. Anthropic can flip this flag without a release; your environment variable still wins." |
| 6 | 48–57 | Trace loader, Choose files, the session opens; HUD: 1 d 4 h and 90 subagents boxed. | "That's what the harness can send. Trace shows what it actually sent, in your own session: a day and four hours, ninety subagents." |
| 7 | 57–68 | Clean 3D flight; overlay: TIME →, TEXT IN FRONT OF THE MODEL ↑, and the colour legend. | "Time runs left to right. Height is how much text the model had in front of it. Gray is the harness, pink is what it injected, green is you." |
| 8 | 68–73 | Landmarks on, zoom into request 947, lift to the Injected layer. | "Zoom in: each request is a stack of these layers." |
| 9 | 73–85 | Open the MCP server instructions block (Inspect layers): the request column, You ≈ 8.1k 9% and Harness ≈ 44k 47% boxed. | "Open the pink one: instructions from your MCP servers, never shown in your chat. Here, under a tenth came from you. Almost half came from the harness." |
| 10 | 85–95 | / CLAUDE.md: "94× · 91 agents" boxed, Enter flies to a copy (home paths in the reader blurred). | "Search the session: your Claude dot M D went out ninety-four times, to ninety-one agents, the main thread and every subagent." |
| 11 | 95–105 | 2: Left the machine (96); open a deploy: Asked by (your mid-turn message), Permitted by (bypassPermissions). | "Press two for everything that left your machine. Open a deploy to see why it ran: you asked for it mid-turn, and bypass-permissions mode let it through." |
| 12 | 105–114 | A short captured session: + Network capture opens the card (what a capture is, tools/capture/capture.sh), Choose a .har file…, attached, Open "What went over the wire". | "The log still leaves things out. Record a short session's network traffic, attach the capture, and Trace lines it up with the log." |
| 13 | 114–120 | On the wire: System blocks as sent, the 156-char billing header boxed. | "Now see what the model was really sent: a billing header in the system prompt," |
| 14 | 120–123 | Tools as sent (18). | "all eighteen tools," |
| 15 | 123–129 | On the wire, not in the log: the mid-conversation system message (45,107 chars) and tool_addition parts. | "and a forty-five-thousand-character system message. None of it is in your log." |
| 16 | 129–136 | Sensitive data in transit: the same OAuth token to 2 Anthropic hosts; device and environment details to Datadog (third party). | "And where your data went: your login token to two Anthropic hosts, your device details to Datadog." |
| 17 | 136–141 | Flags & experiments (728), filter "cedar". | "Every flag your account was served: seven hundred twenty-eight." |
| 18 | 141–147 | Click tengu_cedar_lantern: the source map opens on act_dont_rederive, "When you have enough information to act, act." | "Click one to see what it turns on: When you have enough information to act, act." |
| 19 | 147–154 | Pull back over the landscape; end card: Harness Source Map · See what your agent was really told · harness.dtmont.com /claude-code /codex /trace. | "Harness Source Map. It runs in your browser. See what your agent was really told." |

363 words, ElevenLabs `eleven_v4_turbo` (voice Eric) sped to 1.05× afterwards (`tempo` in vo.json; the v4 models
ignore `speed`). Checked back with Whisper.

Every number is read from the tool in the same shot. "Almost none of it is documented" is checked against the search
index: 99% of Claude Code's prompts and reminders, and 95% of all its model-facing records, are undocumented
(2026-09-28). Forbidden values (home path, private session ids, capture identities: the same set as
tools/leak-check.mjs) are found on screen by the capture and blurred in the edit.
