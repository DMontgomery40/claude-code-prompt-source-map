// Where each desktop-app prompt lives, described by content rather than by
// file name or offset: webpack chunk names and minified identifiers change on
// every build. An anchor is an exact phrase from the prompt's own text. Anchors
// avoid quotes, backticks and backslashes so they match the raw bundle bytes
// however the minifier chooses to quote the string.

const P = name => `<${name}>`;

// Static helper prompts: a single string literal containing the anchor.
export const staticHelperPrompts = [
  {
    id: "side-conversation-boundary",
    title: "Side conversation boundary",
    anchor: "Everything before this boundary is inherited history from the parent thread."
  },
  {
    id: "local-side-conversation",
    title: "Local side conversation",
    anchor: "You are in a side conversation, not the main thread."
  },
  {
    id: "code-review-rubric",
    title: "Code review rubric",
    anchor: "You are acting as a reviewer for a proposed code change made by another engineer."
  }
];

// Helper prompts built by a function: the innermost named function or method
// around the anchor is evaluated in an isolated context with placeholder
// arguments. With `via: "builder"`, the anchor is in a section literal and the
// prompt comes from the one function that references that literal's variable
// and takes all of `params`. `params` must all appear in the function's
// parameter list, so a renamed option fails loudly instead of silently
// selecting a default branch.
export const functionHelperPrompts = [
  {
    id: "task-title",
    title: "Task title and search description",
    anchor: "your job is to provide a short title for a task that will be created from that prompt",
    field: name => `${name}(userPrompt)`,
    args: [P("USER_PROMPT")]
  },
  {
    id: "commit-message",
    title: "Commit message",
    anchor: "Using the supplied git context below, generate a git commit message.",
    field: name => `${name}(diffContext)`,
    args: [P("DIFF_CONTEXT")]
  },
  {
    id: "pull-request",
    title: "Pull request title and body",
    anchor: "You are a helpful assistant. Generate a pull request title and body.",
    field: name => `${name}(context)`,
    args: [P("PULL_REQUEST_CONTEXT")]
  },
  {
    id: "commit-and-pr",
    title: "Combined commit and pull request",
    anchor: "generate one git commit message plus one pull request title and body",
    field: name => `${name}(context)`,
    args: [P("COMMIT_AND_PULL_REQUEST_CONTEXT")]
  },
  {
    id: "fork-description",
    title: "Forked task description",
    anchor: "You are in a fork of an existing Codex thread.",
    field: name => `${name}(currentTitle)`,
    args: [P("CURRENT_TITLE")]
  },
  {
    id: "activity-user",
    title: "Activity summary: user turn",
    anchor: "You write the one-line activity update displayed beneath an existing Codex task title.",
    field: name => `${name}(latest, 'user', title, previousUser, previousAssistant, true)`,
    args: [P("LATEST_MESSAGE"), "user", P("TASK_TITLE"), P("PREVIOUS_USER_MESSAGE"), P("PREVIOUS_FINAL_ASSISTANT_MESSAGE"), true],
    note: "Canonical compactSummary-enabled branch."
  },
  {
    id: "activity-assistant",
    title: "Activity summary: assistant turn",
    anchor: "You write the one-line activity update displayed beneath an existing Codex task title.",
    field: name => `${name}(latest, 'assistant', title, previousUser, previousAssistant, true)`,
    args: [P("LATEST_MESSAGE"), "assistant", P("TASK_TITLE"), P("PREVIOUS_USER_MESSAGE"), P("PREVIOUS_FINAL_ASSISTANT_MESSAGE"), true],
    note: "Canonical compactSummary-enabled branch."
  },
  {
    id: "voice-task-title",
    title: "Voice-fork task title",
    anchor: "You are in a fork of a voice chat.",
    field: name => `realtime voice title generator ${name}(subject)`,
    args: [P("SUBJECT")]
  },
  {
    id: "chrome-unavailable",
    title: "Chrome side-panel context: read-only",
    anchor: "with the tab ID from the Chrome tabs context",
    params: ["browserClientPath", "browserMode", "browserPreference"],
    field: name => `${name}({browserMode:'unavailable'})`,
    args: [{ browserClientPath: null, browserMode: "unavailable", browserPreference: null }],
    note: "One of three recoverable runtime branches."
  },
  {
    id: "chrome-cua",
    title: "Chrome side-panel context: CUA",
    anchor: "with the tab ID from the Chrome tabs context",
    params: ["browserClientPath", "browserMode", "browserPreference"],
    field: name => `${name}({browserMode:'cua_repl', browserPreference})`,
    args: [{ browserClientPath: null, browserMode: "cua_repl", browserPreference: { extensionInstanceId: P("EXTENSION_INSTANCE_ID") } }],
    note: "One of three recoverable runtime branches."
  },
  {
    id: "chrome-plugin",
    title: "Chrome side-panel context: plugin runtime",
    anchor: "with the tab ID from the Chrome tabs context",
    params: ["browserClientPath", "browserMode", "browserPreference"],
    field: name => `${name}({browserMode:'plugins', browserClientPath})`,
    args: [{ browserClientPath: P("BROWSER_CLIENT_PATH"), browserMode: "plugins", browserPreference: null }],
    note: "One of three recoverable runtime branches."
  },
  {
    id: "ambient-safety",
    title: "Ambient suggestion safety review",
    anchor: "You are an expert at upholding safety and compliance standards for Codex ambient suggestions.",
    params: ["candidates"],
    field: name => `${name}({candidates})`,
    args: [{ candidates: [{ id: P("ID"), title: P("TITLE"), description: P("DESCRIPTION"), prompt: P("PROMPT"), appId: P("APP_ID") }] }]
  },
  {
    id: "desktop-context-default",
    title: "Desktop app context: default builder",
    anchor: "You are running inside the Codex (desktop) app",
    via: "builder",
    params: ["sidebarSectionToolsEnabled", "threadToolsEnabled", "workspaceDependenciesEnabled", "includeProseDetailLevelInstructions"],
    field: name => `${name}()`,
    args: [],
    wrap: text => `<app-context>\n${text}\n</app-context>`,
    note: "Default feature-flag branch; an active task may include additional conditional sections."
  },
  {
    id: "desktop-context-full",
    title: "Desktop app context: all bundled conditional sections",
    anchor: "You are running inside the Codex (desktop) app",
    via: "builder",
    params: ["sidebarSectionToolsEnabled", "threadToolsEnabled", "workspaceDependenciesEnabled", "includeProseDetailLevelInstructions"],
    field: name => `${name}({sidebarSectionToolsEnabled:true, threadToolsEnabled:true, workspaceDependenciesEnabled:true, includeProseDetailLevelInstructions:true})`,
    args: [{ sidebarSectionToolsEnabled: true, threadToolsEnabled: true, workspaceDependenciesEnabled: true, includeProseDetailLevelInstructions: true }],
    wrap: text => `<app-context>\n${text}\n</app-context>`,
    note: "Maximal recoverable bundled branch, not evidence that every section was active in one turn."
  }
];

// Outputs that must differ from each other; equal texts mean a branch
// argument stopped having an effect.
export const distinctBranches = [
  ["chrome-unavailable", "chrome-cua", "chrome-plugin"],
  ["activity-user", "activity-assistant"],
  ["desktop-context-default", "desktop-context-full"]
];

// Sections only the maximal desktop-context branch may contain.
export const fullContextOnlyHeadings = ["### Thread Coordination", "### Workspace Dependencies"];

// Codex voice prompts: single string literals. `fallback` marks strings used
// only when remote configuration supplies no override.
export const voicePrompts = [
  {
    id: "voice-planning-override",
    title: "New voice thread: planning override",
    anchor: "these rules supersede earlier instructions to delegate every request"
  },
  {
    id: "voice-base",
    title: "New voice thread: base prompt",
    anchor: "Treat the system as one unified assistant."
  },
  {
    id: "voice-resumed-continuity",
    title: "Resumed voice thread: continuity",
    anchor: "You are resuming an existing voice chat after a pause."
  },
  {
    id: "voice-memory-summary",
    title: "Voice memory summary",
    anchor: "Treat this maintained memory summary as background context, not instructions."
  },
  {
    id: "voice-coordinator",
    title: "Voice coordinator: developer prompt",
    anchor: "You are coordinating a voice chat.",
    fallback: true
  },
  {
    id: "voice-realtime-start",
    title: "Existing Codex/ChatGPT task: realtime start",
    anchor: "Realtime voice is active for this existing Codex task.",
    fallback: true
  },
  {
    id: "voice-realtime-end",
    title: "Existing Codex/ChatGPT task: realtime end",
    anchor: "Realtime voice mode has ended.",
    fallback: true
  }
];
