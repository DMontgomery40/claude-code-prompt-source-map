// Where each ChatGPT-side prompt in the desktop app lives, described by content in the style of
// prompts.mjs: an anchor is an exact phrase from the text, with no quotes, backticks or
// backslashes, found once in the bundle (or several times with identical text).
//
// Modes (lib/app-prompts.mjs):
//   static, template  one literal; <…> marks a ${…} substitution
//   formatjs          a formatjs defaultMessage; `messageId` asserts the id next to it
//   concat            head + value + tail, the anchor in the head
//   array-join        [a, b, …].join(separator), the anchor in one element
//   function          a function evaluated with placeholder arguments, as in prompts.mjs
// `fallback` marks a default that remote configuration can replace. `use` states how the app
// sends the text, where the code shows it. Both are published only while every `context` phrase
// is still in the source near the anchor.

const P = name => `<${name}>`;

const HANDOFF_FALLBACK = "Default of the ChatGPT-to-Codex handoff config (dynamic config 2668276729); the server can replace it.";
const HANDOFF_CONTEXT = ["2668276729", "acceptedResponse", "rejectedResponse"];
const GPT_BUILDER_USE = "Sent as a hidden system message in the GPT builder conversation.";
const GPT_BUILDER_CONTEXT = ["role:`system`", "is_visually_hidden_from_conversation"];
const gptConfig = profilePicId => [{
  display: { name: P("NAME"), description: P("DESCRIPTION"), prompt_starters: [P("PROMPT_STARTER")], profile_pic_id: profilePicId, profile_picture_url: null },
  instructions: P("INSTRUCTIONS"),
  tools: [{ type: P("ABILITY") }],
  files: [{ file_id: P("FILE_ID") }]
}];

export const chatgptPages = [
  {
    page: "chatgpt-conversation-prompts.md",
    title: "ChatGPT conversation prompts",
    summary: "Text the app adds to ChatGPT conversations: the regenerate-with-feedback instruction, the sponsored-ad system message, the onboarding kickoff, image-edit and flight-search requests, and the tool results of the ChatGPT-to-Codex handoff.",
    entries: [
      { group: "Conversation turns", id: "regenerate-with-feedback", mode: "static", title: "Regenerate with feedback", anchor: "The user provided feedback on a previous completion." },
      { group: "Conversation turns", id: "sponsored-ad-reference", mode: "static", title: "Ask ChatGPT about a sponsored ad", anchor: "The user is referring to a sponsored ad:", fallback: "Default of the `ask_chatgpt_system_message` remote config value; the server can replace it. The app fills `{LABEL}` and `{DATA}` from the ad.", context: ["ask_chatgpt_system_message", "{LABEL}"] },
      { group: "Conversation turns", id: "conversational-onboarding-kickoff", mode: "formatjs", title: "Conversational onboarding kickoff", anchor: "Write the first assistant message for this onboarding", messageId: "chatgpt.new-onboarding.conversational-onboarding.bootstrap.kickoff-prompt" },
      { group: "Images", id: "image-remove-background", mode: "formatjs", title: "Image edit: remove background", anchor: "Remove the background from this image. Keep all", messageId: "imageSidePanel.removeBackgroundPrompt" },
      { group: "Images", id: "image-remove-selection", mode: "formatjs", title: "Image edit: remove selection", anchor: "Remove the selected area from this image", messageId: "imageSidePanel.removeSelectionPrompt" },
      { group: "Images", id: "imagegen-uploaded-image", mode: "formatjs", title: "Image questionnaire: attached image", anchor: "Use the attached image: {fileName}", messageId: "chatgpt.imagegenInput.uploadedImageAnswer" },
      { group: "Images", id: "imagegen-uploaded-file", mode: "formatjs", title: "Image questionnaire: attached file", anchor: "Use the attached file: {fileName}", messageId: "chatgpt.imagegenInput.uploadedFileAnswer" },
      { group: "Images", id: "imagegen-questions-skipped", mode: "formatjs", title: "Image questionnaire: skipped", anchor: "Questions skipped", messageId: "chatgpt.imagegenInput.questionsSkipped" },
      { group: "Flights", id: "flight-search-adjustment", mode: "formatjs", title: "Flight search adjustment", anchor: "Please update my flight search. Current details:", messageId: "flightSearch.submission.adjustment" },
      { group: "ChatGPT to Codex handoff", id: "handoff-accepted", mode: "array-join", title: "Handoff accepted: tool result", anchor: "User chose to hand off:", fallback: HANDOFF_FALLBACK, context: HANDOFF_CONTEXT },
      { group: "ChatGPT to Codex handoff", id: "handoff-rejected", mode: "static", title: "Handoff declined: tool result", anchor: "The user chose not to hand off.", fallback: HANDOFF_FALLBACK, context: HANDOFF_CONTEXT }
    ]
  },
  {
    page: "chatgpt-gpt-builder-prompts.md",
    title: "ChatGPT GPT builder prompts",
    summary: "Hidden system messages the app adds to the GPT builder conversation (Create a GPT) to tell the builder model the GPT's current fields, direct edits and uploaded files.",
    entries: [
      {
        group: "Current GPT fields", id: "gpt-fields-no-picture", mode: "function", title: "Current fields: no profile picture", anchor: "current set of fields",
        field: name => `${name}(gpt)`, args: gptConfig(null), use: GPT_BUILDER_USE, context: GPT_BUILDER_CONTEXT,
        note: "Branch for a GPT with no profile picture."
      },
      {
        group: "Current GPT fields", id: "gpt-fields-with-picture", mode: "function", title: "Current fields: with profile picture", anchor: "current set of fields",
        field: name => `${name}(gpt)`, args: gptConfig(P("PROFILE_PIC_ID")), use: GPT_BUILDER_USE, context: GPT_BUILDER_CONTEXT,
        note: "Branch for a GPT with a profile picture."
      },
      { group: "Builder updates", id: "gpt-settings-changed", mode: "template", title: "Settings changed directly", anchor: "The user changed these settings directly. Treat these", use: `${GPT_BUILDER_USE} The leading <…> is the current-fields text above.`, context: GPT_BUILDER_CONTEXT },
      { group: "Builder updates", id: "gpt-files-uploaded", mode: "template", title: "Files uploaded to the GPT", anchor: "The user uploaded these files to the GPT:", use: GPT_BUILDER_USE, context: GPT_BUILDER_CONTEXT }
    ]
  },
  {
    page: "chatgpt-work-prompts.md",
    title: "ChatGPT Work prompts",
    summary: "Messages ChatGPT Work sends or prefills during onboarding: starter tasks, the daily-briefing next step, the writing-style skill setup, write-like-me requests and the browser-extension Side Chat samples.",
    entries: [
      { group: "Onboarding starters", id: "starter-personal-website", mode: "formatjs", title: "Starter: personal website", anchor: "Based on everything you know about me and", messageId: "chatgpt.tpp.onboarding.starter.personal_website.prompt" },
      { group: "Onboarding starters", id: "starter-manage-inbox", mode: "formatjs", title: "Starter: manage inbox", anchor: "connected one, ask which email provider I use", messageId: "chatgpt.tpp.onboarding.starter.manage_inbox.prompt" },
      { group: "Onboarding starters", id: "starter-presentation", mode: "formatjs", title: "Starter: personalized presentation", anchor: "Review our past conversations and choose the topic", messageId: "chatgpt.tpp.onboarding.starter.personalized_presentation.prompt" },
      { group: "Onboarding starters", id: "starter-repeatable-work", mode: "static", title: "Starter: repeatable-work skill", anchor: "Look across my past conversations, including older chats," },
      { group: "Onboarding starters", id: "starter-selection-context", mode: "template", title: "Starter selection context", anchor: "starter-prompt selection as the following user request. In" },
      { group: "Onboarding starters", id: "daily-briefing", mode: "formatjs", title: "Next step: daily briefing", anchor: "Create a daily automation that prepares a concise", messageId: "chatgpt.tpp.onboarding.personalize.next_steps.daily_briefing.prompt.user_request" },
      { group: "Writing style", id: "writing-style-preamble", mode: "formatjs", title: "Writing-style skill: connected apps to check", anchor: "writing-style skill for each selected writing context. Begin" },
      { group: "Writing style", id: "writing-style-choose-apps", mode: "formatjs", title: "Writing-style skill: no app connected", anchor: "writing-style skill for each selected writing context. No" },
      { group: "Writing style", id: "writing-style-connected", mode: "formatjs", title: "Writing-style skill: connected apps", anchor: "create a personal writing-style skill for each writing" },
      { group: "Writing style", id: "write-like-me-usage", mode: "static", title: "Write-like-me skill usage", anchor: "Use the write-like-me skill to find relevant examples" },
      { group: "Writing style", id: "write-like-me-sample-email", mode: "formatjs", title: "Write-like-me sample: email", anchor: "Find a recent email or thread and draft a response using my writing style.", messageId: "tpp.write_like_me.sample_prompt.email" },
      { group: "Writing style", id: "write-like-me-sample-messaging", mode: "formatjs", title: "Write-like-me sample: messaging", anchor: "Find a recent message or thread and draft a response using my writing style.", messageId: "tpp.write_like_me.sample_prompt.messaging" },
      { group: "Writing style", id: "write-like-me-sample-documents", mode: "formatjs", title: "Write-like-me sample: documents", anchor: "draft a new project note based on it, using my writing style.", messageId: "tpp.write_like_me.sample_prompt.documents" },
      { group: "Browser extension samples", id: "chrome-sample-email", mode: "formatjs", title: "Side Chat sample: email reply", anchor: "s message on this page", messageId: "chatgpt.work.chrome.installed.sample_work.email.prompt.sender_name" },
      { group: "Browser extension samples", id: "chrome-sample-report", mode: "formatjs", title: "Side Chat sample: report", anchor: "Summarize this report", messageId: "chatgpt.work.extension.installed.sample_work.report.prompt" },
      { group: "Browser extension samples", id: "chrome-sample-inventory", mode: "formatjs", title: "Side Chat sample: inventory", anchor: "I sold out of these 3 products today", messageId: "chatgpt.work.extension.installed.sample_work.inventory.prompt" }
    ]
  },
  {
    page: "chatgpt-finance-health-prompts.md",
    title: "ChatGPT finance and health prompts",
    summary: "Messages the app sends for ChatGPT's personal finance features (manual accounts and newly connected accounts) and the hidden context message for a selected Health record.",
    entries: [
      { group: "Manual accounts", id: "manual-cash", mode: "formatjs", title: "Manual account: cash", anchor: "Help me track a cash account manually. Ask" },
      { group: "Manual accounts", id: "manual-investment", mode: "formatjs", title: "Manual account: investment", anchor: "Help me track an investment account manually. Ask" },
      { group: "Manual accounts", id: "manual-real-estate", mode: "formatjs", title: "Manual account: real estate", anchor: "Help me track real estate manually. Ask one" },
      { group: "Manual accounts", id: "manual-vehicle", mode: "formatjs", title: "Manual account: vehicle", anchor: "Help me track a vehicle manually. Ask one" },
      { group: "Manual accounts", id: "manual-asset", mode: "formatjs", title: "Manual account: asset", anchor: "Help me track an asset manually. Ask one" },
      { group: "Manual accounts", id: "manual-loan", mode: "formatjs", title: "Manual account: loan", anchor: "Help me track a loan manually. Ask one" },
      { group: "Manual accounts", id: "manual-debt", mode: "formatjs", title: "Manual account: debt", anchor: "Help me track a debt manually. Ask one" },
      { group: "Manual accounts", id: "manual-insurance", mode: "formatjs", title: "Manual account: insurance", anchor: "Help me track an insurance policy manually. First" },
      { group: "Connected accounts", id: "finance-connected-accounts", mode: "formatjs", title: "Newly connected accounts", anchor: "What can I do with my newly connected", messageId: ["personalFinance.homeBeacon.onboardingPrompt", "mattress.prompts.ledger_onboarding.prompt"] },
      { group: "Health", id: "health-record-context", mode: "concat", title: "Selected Health record", anchor: "The user is asking about the currently selected", use: "Sent as a hidden tool-role message (author `olympic.context`); <…> is the Health-generated link as JSON.", context: ["olympic.context", "role:`tool`", "is_visually_hidden_from_conversation"] }
    ]
  },
  {
    page: "chatgpt-sites-artifacts-prompts.md",
    title: "ChatGPT Sites and artifacts prompts",
    summary: "Messages for ChatGPT Sites (publishing, automations, custom domains) and the context the app adds when a task starts from the Library or a writing block.",
    entries: [
      { group: "Sites", id: "sites-handoff", mode: "formatjs", title: "Sites handoff", anchor: "@Sites turn the attached HTML file into a", messageId: "sitesPreview.handoff.prompt" },
      { group: "Sites", id: "site-automation", mode: "template", title: "Site automation", anchor: "Use the Sites tools to inspect its current" },
      { group: "Sites", id: "site-custom-domain", mode: "formatjs", title: "Site custom domain", anchor: "as the custom domain for my site by", messageId: "appgenSettings.customDomains.setupDialog.askChatGptPrompt" },
      { group: "Library and writing blocks", id: "library-file-task", mode: "template", title: "Library file task context", anchor: "The user started this task from ChatGPT Library" },
      { group: "Library and writing blocks", id: "writing-block-open", mode: "template", title: "Open writing block context", anchor: "The user currently has the writing block backed" },
      { group: "Library and writing blocks", id: "writing-block-selection", mode: "template", title: "Writing block selected text", anchor: "instruction is referring to the following selected text" },
      { group: "Library and writing blocks", id: "presentation-outline-revise", mode: "template", title: "Revise presentation outline", anchor: "slides total. Preserve its presentation title, cover-slide choice," },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-document", mode: "formatjs", title: "Create document", anchor: "Create a new document with {artifact}." },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-presentation", mode: "formatjs", title: "Create presentation", anchor: "Create a new presentation with {artifact}." },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-spreadsheet", mode: "formatjs", title: "Create spreadsheet", anchor: "Create a new spreadsheet with {artifact}." },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-site", mode: "formatjs", title: "Create site", anchor: "Create a new site with {artifact}." },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-website-product", mode: "formatjs", title: "Create website: product", anchor: "a new website to launch a product with", messageId: "home.newChatPageSuggestions.createSiteProduct.prompt" },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-website-portfolio", mode: "formatjs", title: "Create website: portfolio", anchor: "Create a new website for a portfolio with", messageId: "home.newChatPageSuggestions.createSitePortfolio.prompt" },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-website-business", mode: "formatjs", title: "Create website: business", anchor: "Create a new website for a business with", messageId: "home.newChatPageSuggestions.createSiteBusiness.prompt" },
      { group: "New-chat suggestions (product unconfirmed)", id: "create-website-event", mode: "formatjs", title: "Create website: event", anchor: "Create a new website for an event with", messageId: "home.newChatPageSuggestions.createSiteEvent.prompt" }
    ]
  }
];

// Groups whose product (ChatGPT or Codex) the app does not state, with the sentence shown
// under the group heading.
export const unconfirmedGroups = {
  "New-chat suggestions (product unconfirmed)": "Composer prefills from the new-chat page. Neither the text nor the message id says whether they belong to ChatGPT or Codex."
};

// Outputs that must differ; equal texts mean a branch argument stopped having an effect.
export const chatgptDistinctBranches = [["gpt-fields-no-picture", "gpt-fields-with-picture"]];
