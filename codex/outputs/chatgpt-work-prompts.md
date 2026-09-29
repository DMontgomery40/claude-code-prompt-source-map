# ChatGPT Work prompts

Source: `app.asar` of the Codex/ChatGPT desktop app 26.928.20755 (build 12246), SHA-256 `2301fba40bd8fa237ccdb1369363e1deefaf27953da2d767d428225d5e9eedee`.

Messages ChatGPT Work sends or prefills during onboarding: starter tasks, the daily-briefing next step, the writing-style skill setup, write-like-me requests and the browser-extension Side Chat samples.

ChatGPT's own system prompt is not in the app; the servers add it. The phrase "You are ChatGPT" occurs in none of the app's scripts.

Each entry says whether its text is exact (one literal in the bundle) or assembled (literal pieces joined as the app joins them). Entries with a message id or translator note are formatjs messages: the text shown is the English source (`defaultMessage`), and the app sends the model whatever the user's language translates it to.

## Onboarding starters

### Starter: personal website

Source: `webview/assets/fallback-cards-f713c46a173e.js`, offset 1083, SHA-256 `99a1ec242ca96dc22fd75f70ba95c3f4cdbddc07efd98e83feab5d998c263b47`.

Exact text from the bundle. Message id `chatgpt.tpp.onboarding.starter.personal_website.prompt`.

Translator note: Prompt submitted when the user selects the personal website starter task in the ChatGPT Work onboarding conversation. It asks ChatGPT to choose a useful website subject from context already available in past conversations, then design, build, and host the site immediately. It must not invent personal details or claim access to unavailable context.

```text
Based on everything you know about me and what we’ve discussed in past conversations, choose the most useful subject for a personal website. If there isn’t enough context to choose honestly, ask me one focused question about what the site should be for. Then design, build, and host it for me. Make confident choices about the content, structure, and visual style you think I’ll like best, and start creating it now.
```

### Starter: manage inbox

Source: `webview/assets/fallback-cards-f713c46a173e.js`, offset 2812, SHA-256 `c6996d589e9368ca25ca3b6a5807521ce92f75c663ed419ea0b502632818fa78`.

Exact text from the bundle. Message id `chatgpt.tpp.onboarding.starter.manage_inbox.prompt`.

Translator note: Prompt submitted when the user selects the inbox management starter task in the ChatGPT Work onboarding conversation. It asks ChatGPT to use or help connect the user's preferred email provider, study three months of sent email to learn how the user writes to different people, create a reusable email-writing skill, and create a daily automation that drafts replies to unread email. It explicitly prohibits sending email without confirmation.

```text
Use my connected email app. If I haven’t connected one, ask which email provider I use and help me connect it before continuing. Then review the emails I’ve sent over the last three months and learn how my writing changes for different people and situations. Create a reusable email-writing skill that captures those styles, patterns, and preferences. Set up a daily automation that reviews my unread emails and drafts a response to each one in the appropriate style. Never send an email without my explicit confirmation.
```

### Starter: personalized presentation

Source: `webview/assets/fallback-cards-f713c46a173e.js`, offset 6291, SHA-256 `3aee7ed7c77e6936ab095df4862457c3088b46716121eb3436edbe6e0f9a2f80`.

Exact text from the bundle. Message id `chatgpt.tpp.onboarding.starter.personalized_presentation.prompt`.

Translator note: Prompt submitted when the user selects the presentation starter task in the ChatGPT Work onboarding conversation. It asks ChatGPT to choose a useful topic grounded in the user's past conversations, create a complete polished slide presentation immediately, and provide the finished file with a short explanation. It must not invent a topic or claim context that is unavailable.

```text
Review our past conversations and choose the topic that would be most useful to turn into a polished slide presentation for me right now. If there isn’t enough context to choose honestly, ask me one focused question about the subject. Then pull together the relevant context, decide on a strong story and structure, write the content, and create the complete presentation with useful visuals. Make confident choices and start creating it now. When it’s ready, give me the finished file and a brief note explaining what you chose and why.
```

### Starter: repeatable-work skill

Source: `webview/assets/fallback-cards-f713c46a173e.js`, offset 7906, SHA-256 `70c95b76c0daf513a45e3e80b3415b9df59146bb6791b797cde5784537f1cf14`.

Exact text from the bundle.

```text
Look across my past conversations, including older chats, for a workflow I repeat that spans apps, websites, or files. Use only context you can actually access; never invent conversations or examples. If there is not enough evidence to identify a recurring workflow, first call `request_user_input` to ask one focused question about a workflow I repeat and a real example, then wait for my answer before proposing one. Once a workflow is supported by the available history or my answer, show a section titled ‘Workflow I found’ with a plain-language description of the workflow, real supporting examples (2–3 when available), and the background and decisions the skill would preserve. Do not create the skill, call Skill Creator, or continue to any next step in that response. After the evidence is visible, stop and call `request_user_input` to ask: ‘Is this workflow accurate, and should I turn it into a skill?’ Offer two choices: ‘Yes, create it’ and ‘No, revise it’. Do not ask for confirmation in ordinary chat text. Wait for the tool response before doing anything else.

Only after I explicitly confirm, create it as a reusable skill. Give it a descriptive lowercase kebab-case name in the `your-new-skill` format. Do not stop after saving it. In the same response, show a section titled ‘Try it next’ with a numbered list of exactly 3 concrete requests I could use the skill for in future work. Do not invoke or apply the skill yet. End by asking whether I would like to try one of those three examples, and which one.
```

### Starter selection context

Source: `webview/assets/home-ambient-suggestions-content-ff25fb62f23d.js`, offset 18726, SHA-256 `2fca00df9c58d896f7410a511bbdbd087c417d368a57ea14d46dd7835bf04424`.

Assembled from literal pieces in the bundle, joined as the app joins them; `<…>` marks a value filled in at run time.

```text
For the first turn only, treat the user's starter-prompt selection as the following user request. In that request, first-person pronouns refer to the user:

<…>

This instruction applies only to the initial request. Later user messages may revise or cancel it.
```

### Next step: daily briefing

Source: `webview/assets/home-136896cd7545.js`, offset 47340, SHA-256 `1da19cc520de9aa4f0533e6f5808078f8893f9d356d0881069abee7b6e715c96`.

Exact text from the bundle. Message id `chatgpt.tpp.onboarding.personalize.next_steps.daily_briefing.prompt.user_request`. The same text ships at 2 places in the bundle; the first is shown.

Translator note: User-visible prompt submitted when an end user selects Send me a daily briefing in the ChatGPT Work personalization onboarding conversation. It asks ChatGPT to prepare a recurring daily briefing using connected tools such as email, calendar, and Slack, then show the proposed scheduled automation for approval before activating it. Slack is a product name and must remain unchanged. No markup or placeholders.

```text
Create a daily automation that prepares a concise briefing focused on my connected apps like email, calendar, and Slack. Show me the automation before enabling it.
```

## Writing style

### Writing-style skill: connected apps to check

Source: `webview/assets/home-ambient-suggestions-content-ff25fb62f23d.js`, offset 5450, SHA-256 `5081b54dffd7ba85ef9e8d49c1bc45417e5af50973d76932fa7eb5625896d922`.

Exact text from the bundle. Message id `home.ambientSuggestions.learnWritingStyle.prompt.connectionUnknown.v15`.

Translator note: Hidden initial request prepared by the Learn my writing style card while communication app connection state is unavailable. It tells Codex to show a short preamble, use request_user_input and request_plugin_install, report non-sensitive style discoveries instead of implementation mechanics, validate without adding dependencies, and explain that the resulting skills activate automatically. Placeholders {emailApp} and {messageApp} are the account's provider-specific email and messaging app names

```text
Use $skill-creator to create a personal writing-style skill for each selected writing context. Begin with one short user-facing preamble before any tool call so I immediately know that you are checking my communication app setup and will help me connect the apps I choose. Then check whether any communication apps are connected. If none are accessible, call `request_user_input` with exactly one required question: header `Apps`, id `writing_style_sources`, and question `Which apps should I learn your writing style from?`. Offer exactly these three options in order: `{emailApp} + {messageApp} (Recommended)` with description `Learn separate styles for email and {messageApp} messages.`, `{emailApp} only` with description `Learn my email writing style.`, and `{messageApp} only` with description `Learn how I write messages in {messageApp}.`. Do not include an Other option because the input UI adds it automatically. Do not set `autoResolutionMs` because this choice is required. If no selection is returned, do not guess or continue. For each selected app that is not accessible, call `request_plugin_install` one app at a time using its matching `plugin_id` from the recommended plugin list and a concise reason. Do not ask me to connect an app manually before attempting this install flow. Do not search the filesystem, app caches, or credential files for connector state. After each installation and connection completes, recheck app access and continue automatically. If a matching plugin is unavailable, the request is declined, or connection fails, briefly explain the blocker and stop without creating that writing context's skill. Keep progress updates sparse and substantive. Before sampling, limit them to the next user-relevant milestone. Once sampling begins, use them to share one or two non-sensitive style traits identified so far and how the sample is becoming more representative. Do not narrate filesystem operations, helper scripts, dependency checks, or validation mechanics. Do not ask where to install the skills; use the default personal skills directory. Analyze a representative sample of communications authored by me in each connected app. Exclude received text, quoted replies, forwarded content, signatures, automated notifications, and boilerplate. Consider variation across recipients, situations, and time. Capture stable stylistic traits—tone, sentence structure, vocabulary, formatting, level of detail, and recurring patterns—without treating topics, names, or confidential facts as style. If there is not enough evidence, explain what is missing rather than inventing conclusions. Create separate skills for email and {messageApp} messages. Combine equivalent email connectors into one email skill, but do not combine email with {messageApp}. For each writing context, create a concise SKILL.md and a detailed `references/writing-style.md`. Configure the skill to trigger automatically for requests to draft, rewrite, or reply in that context, while avoiding overlap with the other writing-style skills. Do not reproduce or lightly rewrite source communications in generated files or responses. Remove names, sensitive details, and recognizable scenarios. Validate without adding dependencies: confirm the required files exist and that each SKILL.md has valid frontmatter with a hyphen-case name and a non-empty description. Run a bundled validator only if it works unmodified with already-available dependencies. Never install, vendor, or mock validation dependencies, and never claim validator success unless it actually ran. Fix structural or validation failures before reporting completion. In the final response, mention only skills that were successfully created and installed. Include one brief sentence explaining that a skill is a reusable set of instructions that can be automatically applied to matching tasks. Briefly explain that each writing-style skill activates automatically for ordinary requests to draft, rewrite, or reply in its context. Do not suggest that I must name the skill, invoke it explicitly, or say "write in my voice". For each writing context, preview `Overall voice`, `Common patterns`, and `Do and avoid`, followed by 2–3 entirely new example messages formatted as individual Markdown block quotes. End each section with a link to its full writing-style reference.
```

### Writing-style skill: no app connected

Source: `webview/assets/home-ambient-suggestions-content-ff25fb62f23d.js`, offset 10568, SHA-256 `ae1ad24dbfdbc9d903f709eeb4da72e032dc1c2f60d052d741b2511c7a5d2728`.

Exact text from the bundle. Message id `home.ambientSuggestions.learnWritingStyle.prompt.noConnections.v15`.

Translator note: Hidden initial request prepared by the Learn my writing style card when no communication app is connected. It tells Codex to show a short preamble, use request_user_input and request_plugin_install, report non-sensitive style discoveries instead of implementation mechanics, validate without adding dependencies, and explain that the resulting skills activate automatically. Placeholders {emailApp} and {messageApp} are the account's provider-specific email and messaging app names

```text
Use $skill-creator to create a personal writing-style skill for each selected writing context. No communication app is connected yet. Begin with one short user-facing preamble before any tool call so I immediately know that you will ask which communication apps to learn from and help me connect them. Then call `request_user_input` with exactly one required question: header `Apps`, id `writing_style_sources`, and question `Which apps should I learn your writing style from?`. Offer exactly these three options in order: `{emailApp} + {messageApp} (Recommended)` with description `Learn separate styles for email and {messageApp} messages.`, `{emailApp} only` with description `Learn my email writing style.`, and `{messageApp} only` with description `Learn how I write messages in {messageApp}.`. Do not include an Other option because the input UI adds it automatically. Do not set `autoResolutionMs` because this choice is required. If no selection is returned, do not guess or continue. For each selected app that is not accessible, call `request_plugin_install` one app at a time using its matching `plugin_id` from the recommended plugin list and a concise reason. Do not ask me to connect an app manually before attempting this install flow. Do not search the filesystem, app caches, or credential files for connector state. After each installation and connection completes, recheck app access and continue automatically. If a matching plugin is unavailable, the request is declined, or connection fails, briefly explain the blocker and stop without creating that writing context's skill. Keep progress updates sparse and substantive. Before sampling, limit them to the next user-relevant milestone. Once sampling begins, use them to share one or two non-sensitive style traits identified so far and how the sample is becoming more representative. Do not narrate filesystem operations, helper scripts, dependency checks, or validation mechanics. Do not ask where to install the skills; use the default personal skills directory. Analyze a representative sample of communications authored by me in each connected app. Exclude received text, quoted replies, forwarded content, signatures, automated notifications, and boilerplate. Consider variation across recipients, situations, and time. Capture stable stylistic traits—tone, sentence structure, vocabulary, formatting, level of detail, and recurring patterns—without treating topics, names, or confidential facts as style. If there is not enough evidence, explain what is missing rather than inventing conclusions. Create separate skills for email and {messageApp} messages. Combine equivalent email connectors into one email skill, but do not combine email with {messageApp}. For each writing context, create a concise SKILL.md and a detailed `references/writing-style.md`. Configure the skill to trigger automatically for requests to draft, rewrite, or reply in that context, while avoiding overlap with the other writing-style skills. Do not reproduce or lightly rewrite source communications in generated files or responses. Remove names, sensitive details, and recognizable scenarios. Validate without adding dependencies: confirm the required files exist and that each SKILL.md has valid frontmatter with a hyphen-case name and a non-empty description. Run a bundled validator only if it works unmodified with already-available dependencies. Never install, vendor, or mock validation dependencies, and never claim validator success unless it actually ran. Fix structural or validation failures before reporting completion. In the final response, mention only skills that were successfully created and installed. Include one brief sentence explaining that a skill is a reusable set of instructions that can be automatically applied to matching tasks. Briefly explain that each writing-style skill activates automatically for ordinary requests to draft, rewrite, or reply in its context. Do not suggest that I must name the skill, invoke it explicitly, or say "write in my voice". For each writing context, preview `Overall voice`, `Common patterns`, and `Do and avoid`, followed by 2–3 entirely new example messages formatted as individual Markdown block quotes. End each section with a link to its full writing-style reference.
```

### Writing-style skill: connected apps

Source: `webview/assets/home-ambient-suggestions-content-ff25fb62f23d.js`, offset 15500, SHA-256 `1804cf5c6acbe3474003d4a081af3ef7d16239c79467decb6e1e41990ee988cd`.

Exact text from the bundle. Message id `home.ambientSuggestions.learnWritingStyle.prompt.connectedApps.v14`.

Translator note: Hidden initial request prepared by the Learn my writing style card when communication apps are connected. It tells Codex to report non-sensitive style discoveries instead of implementation mechanics, validate without adding dependencies, and explain that the resulting skills activate automatically. Placeholder {connectedApps} is a localized list of the user's connected app mentions

```text
Use $skill-creator to create a personal writing-style skill for each writing context represented by {connectedApps}. Keep progress updates sparse and substantive. Before sampling, limit them to the next user-relevant milestone. Once sampling begins, use them to share one or two non-sensitive style traits identified so far and how the sample is becoming more representative. Do not narrate filesystem operations, helper scripts, dependency checks, or validation mechanics. Do not ask where to install the skills; use the default personal skills directory. Analyze a representative sample of communications authored by me in each connected app. Exclude received text, quoted replies, forwarded content, signatures, automated notifications, and boilerplate. Consider variation across recipients, situations, and time. Capture stable stylistic traits—tone, sentence structure, vocabulary, formatting, level of detail, and recurring patterns—without treating topics, names, or confidential facts as style. If there is not enough evidence, explain what is missing rather than inventing conclusions. Keep email and messaging apps separate, while combining equivalent email connectors into one email skill. For each writing context, create a concise SKILL.md and a detailed `references/writing-style.md`. Configure the skill to trigger automatically for requests to draft, rewrite, or reply in that context, while avoiding overlap with the other writing-style skills. Do not reproduce or lightly rewrite source communications in generated files or responses. Remove names, sensitive details, and recognizable scenarios. Validate without adding dependencies: confirm the required files exist and that each SKILL.md has valid frontmatter with a hyphen-case name and a non-empty description. Run a bundled validator only if it works unmodified with already-available dependencies. Never install, vendor, or mock validation dependencies, and never claim validator success unless it actually ran. Fix structural or validation failures before reporting completion. In the final response, mention only skills that were successfully created and installed. Include one brief sentence explaining that a skill is a reusable set of instructions that can be automatically applied to matching tasks. Briefly explain that each writing-style skill activates automatically for ordinary requests to draft, rewrite, or reply in its context. Do not suggest that I must name the skill, invoke it explicitly, or say "write in my voice". For each writing context, preview `Overall voice`, `Common patterns`, and `Do and avoid`, followed by 2–3 entirely new example messages formatted as individual Markdown block quotes. End each section with a link to its full writing-style reference.
```

## Browser extension samples

### Side Chat sample: email reply

Source: `webview/assets/onboarding-fd44b047978f.js`, offset 3084, SHA-256 `fc6808d0a1ede37f8c4eea117854deaa47730e2128089c43593a6c42d75516f4`.

Exact text from the bundle. Message id `chatgpt.work.chrome.installed.sample_work.email.prompt.sender_name`.

Translator note: Prompt prefilled in Side Chat after selecting the email sample in browser extension setup. The senderName placeholder is the sample sender's display name, Samuel, and must not be translated. This page means the sample email shown in the current tab. The user must send the prompt to start the demo.

```text
Reply to {senderName}'s message on this page
```

### Side Chat sample: report

Source: `webview/assets/onboarding-fd44b047978f.js`, offset 4352, SHA-256 `beec832532f316788ec57b4a9f925c6820c214aa8d1c2de5e006a472f1b09b09`.

Exact text from the bundle. Message id `chatgpt.work.extension.installed.sample_work.report.prompt`.

Translator note: Prompt prefilled in Side Chat after choosing the report sample on the ChatGPT browser extension setup page. This report refers to the fictional customer research report displayed in the current browser tab. The user must send the prompt to start the demo.

```text
Summarize this report
```

### Side Chat sample: inventory

Source: `webview/assets/onboarding-fd44b047978f.js`, offset 5561, SHA-256 `ceeb81cd1c48b64bf99f3b60a7082057cefd0285fbab89f9c6111ec94aa598a6`.

Exact text from the bundle. Message id `chatgpt.work.extension.installed.sample_work.inventory.prompt`.

Translator note: Prompt prefilled in Side Chat after choosing the inventory sample on the ChatGPT browser extension setup page. Asks ChatGPT to mark the three existing fictional products as sold out, add five desk mousepads, and save the sample inventory. Preserve the quantities. The user must send the prompt to start the demo.

```text
I sold out of these 3 products today but ordered 5 new desk mousepads. Update the stock and save the inventory.
```

## Not found in this build

These entries' anchors did not resolve in this build.

- `write-like-me-usage` (Write-like-me skill usage), anchor `Use the write-like-me skill to find relevant examples`: anchor not found in any app script: "Use the write-like-me skill to find relevant examples"
- `write-like-me-sample-email` (Write-like-me sample: email), anchor `Find a recent email or thread and draft a response using my writing style.`: anchor not found in any app script: "Find a recent email or thread and draft a response using my writing style."
- `write-like-me-sample-messaging` (Write-like-me sample: messaging), anchor `Find a recent message or thread and draft a response using my writing style.`: anchor not found in any app script: "Find a recent message or thread and draft a response using my writing style."
- `write-like-me-sample-documents` (Write-like-me sample: documents), anchor `draft a new project note based on it, using my writing style.`: anchor not found in any app script: "draft a new project note based on it, using my writing style."
