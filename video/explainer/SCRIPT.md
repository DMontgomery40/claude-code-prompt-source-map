# Trace explainer: script draft v1 (target ~80 s, 16:9 + 4:5, VO + light music + burned-in captions)

Tone: calm, confident, explanatory. Every shot holds long enough to read. Cuts on VO phrase boundaries.
Data: frozen Claude Code session 9969db93 (1 d 4 h, 1,656 main requests, 90 subagents). Every on-screen/VO number is read from the tool in the same shot.

| # | t (s) | Picture | Panel | VO |
|---|-------|---------|-------|----|
| 1 | 0-8 | Full UI overview, slow drift; strata legend visible | narrow (default) | "This is one Claude Code session. A day and four hours, sixteen hundred requests, ninety subagents. Trace turns the log into a landscape you can explore." |
| 2 | 8-17 | Cinematic side angle; captions tag the axes and strata colors | hidden | "Time runs left to right. Height is how full the model's context was. And every color is a source: your words, files and command output, subagent reports, the model's own replies, and text the harness slipped in between turns." |
| 3 | 17-31 | Layers zoom near a peak; press Space: grains pour in, the re-read sweep climbs, sweep labels pop; then the playhead crosses a compaction: 969k column collapses to a puck, pours into ~89k | narrow | "Press play, and watch it fill, grain by grain. On every request the model re-reads the entire pile, that's the sweep. And when it hits the ceiling, compaction crushes nine hundred sixty-nine thousand tokens down to eighty-nine thousand." |
| 4 | 31-45 | Press / , type CLAUDE.md: "instructions file · 94× · 91 agents · ≈32k total"; Enter opens it; press w: reader widens and shows the text | narrow -> WIDE | "So what's actually in there? Press slash to search the whole session. Your CLAUDE.md was sent ninety-four times, to ninety-one agents. Open it, and read exactly what the model read." |
| 5 | 45-55 | Lens 1 panel: Injected ≈97k 10%, "from your setup ≈34k"; "Your instructions, skills & memory" list (skills list re-sent N×) | wide | "A tenth of this context was text nobody typed: reminders, skill lists and memories, re-sent on every turn." |
| 6 | 55-65 | Press 2: "Left the machine (96): 3 deploy · 1 send · 92 network"; j/k + Enter opens a deploy; custody ladder (Asked by / Permitted by bypassPermissions) | narrow | "Press two for everything that left your machine: ninety-six calls. Open one, and Trace shows who asked for it and what permitted it." |
| 7 | 65-73 | Press 4: agents table (advisor 7.3M fresh); ] steps agents; Enter flies to its ridge | narrow | "Press four for subagents: what each one cost, and what it brought back." |
| 8 | 73-79 | ? shortcut sheet; quick key montage with key-cap overlays | narrow | "Every view is one key away. Press question mark for all of them." |
| 9 | 79-86 | Pull back to the whole landscape; end card: "Runs entirely in your browser. Nothing leaves this device." URLs ccprompts.dtmont.com/trace and gpt6aeon.dtmont.com/trace | hidden | "It all runs in your browser; your logs never leave your machine. Open a session and see what your agent really saw." |

Key-cap overlay (bottom-left) whenever a key is pressed: / Enter w 2 j k 4 ] ? Space.
Captions: phrase-chunked (≤ 2 lines, ≤ ~32 chars/line), word-timed from ElevenLabs /with-timestamps, bottom-center (16:9) / lower third above UI (4:5).
Music: soft ambient pad + light pulse, ducked under VO (−22 LUFS bed vs −14 LUFS mix).
