# ChatGPT Sites and artifacts prompts

Source: `app.asar` of the Codex/ChatGPT desktop app 26.924.22138 (build 11645), SHA-256 `d0ba973179d2f717affd39e012b64a095464a54a51c6bccb7bc6b3d2a1cfba80`.

Messages for ChatGPT Sites (publishing, automations, custom domains) and the context the app adds when a task starts from the Library or a writing block.

ChatGPT's own system prompt is not in the app; the servers add it. The phrase "You are ChatGPT" occurs in none of the app's scripts.

Each entry says whether its text is exact (one literal in the bundle) or assembled (literal pieces joined as the app joins them). Entries with a message id or translator note are formatjs messages: the text shown is the English source (`defaultMessage`), and the app sends the model whatever the user's language translates it to.

## Sites

### Sites handoff

Source: `webview/assets/sites-handoff-d9f3468bebb3.js`, offset 1710, SHA-256 `ed257996ff58851e27fda3e054b8d506df4c08768f58ece31d7a4c621b609341`.

Exact text from the bundle. Message id `sitesPreview.handoff.prompt`.

Translator note: First message sent after confirming the Sites checkout-return dialog. The saved HTML file is attached to a new Work task. Keep @Sites literal as the plugin name.

```text
@Sites turn the attached HTML file into a working website, preserving its layout, styling, content, and interactions as closely as possible. Make only the changes necessary for it to function and be hosted.
```

### Site automation

Source: `webview/assets/site-automation-create-panel-21df48d90257.js`, offset 3998, SHA-256 `edd8ff616b74c924f5ffe71a2c264ee50bfbefebf8f6e9de622c856dc83067cb`.

Assembled from literal pieces in the bundle, joined as the app joins them; `<…>` marks a value filled in at run time.

```text
<…>

Work on the existing Site with project_id <…>. Use the Sites tools to inspect its current implementation before making changes.
```

### Site custom domain

Source: `webview/assets/appgen-settings-page-ca1da3a967d1.js`, offset 9430, SHA-256 `f8101b99aa1f993b2feabe7435b9dbae7d6c83054b794d588105a761605087fc`.

Exact text from the bundle. Message id `appgenSettings.customDomains.setupDialog.askChatGptPrompt`.

Translator note: Prefilled prompt for a new Sites thread opened from custom-domain DNS setup. It asks Sites to help finish registration at the user's domain provider, using the in-app browser when useful. {hostname} is the exact custom hostname and {dnsRecords} is a newline-separated list of DNS record type, host name, and value.

```text
Help me register {hostname} as the custom domain for my site by adding these DNS records at my domain provider. Use the in-app browser if needed.
{dnsRecords}
```

## Library and writing blocks

### Library file task context

Source: `webview/assets/app-primary-cca0c1a58f0f.js`, offset 831685, SHA-256 `547c8b02467fcade54e6d31d6b42f9ff3d2df1bbbc82d8f6bdf0c8721146e644`.

Exact text from the bundle. The same text ships at 2 places in the bundle; the first is shown.

```text
The user started this task from ChatGPT Library to create a file. Use the available Library skill or Library access method to save each completed user-facing document, spreadsheet, presentation, or PDF to their ChatGPT Library. Create one Library file for each new deliverable. If the same deliverable is edited later, preserve its Library file identity and update the existing file instead of creating a duplicate.
```

### Open writing block context

Source: `webview/assets/app-primary-cca0c1a58f0f.js`, offset 1188393, SHA-256 `b5ffc18bcb8263bf946b0d12790d933f5389a7b1b905ad8a2bf15c82e77213dd`.

Assembled from literal pieces in the bundle, joined as the app joins them; `<…>` marks a value filled in at run time.

```text
The user currently has the writing block backed by library_file_id <…> open in the writing block editor. Treat the user's current request as referring to this exact writing block. For any requested edits, target that exact Library file.
```

### Writing block selected text

Source: `webview/assets/app-primary-cca0c1a58f0f.js`, offset 790568, SHA-256 `180c8c4922fc7f72e1eb4960bac516b4158029ee9833cf8b2b92eb0773c16fce`.

Assembled from literal pieces in the bundle, joined as the app joins them; `<…>` marks a value filled in at run time.

```text
The user's instruction is referring to the following selected text from writing block with ID [<…>]. Apply the user's edit to the selection, and include the complete revised draft in your response.
```

### Revise presentation outline

Source: `webview/assets/writing-block-app-capabilities-8c6d1841254d.js`, offset 80397, SHA-256 `1b96fe0ff0263e54d73637874ad340f53546f195256a8a0e095c6b88d16a03ea`.

Assembled from literal pieces in the bundle, joined as the app joins them; `<…>` marks a value filled in at run time.

```text
Revise this presentation outline to exactly <…> slides total. Preserve its presentation title, cover-slide choice, topic, key facts, and logical flow. Number slides consecutively using "## Slide N: <slide title>" headings. If a title slide is present, label it "## Slide 1 (Title): <presentation title>", keep it to the title and optional subtitle, and include it in the total. Give each content slide one clear focus and concise dash bullets. Combine closely related ideas when reducing slides; split complex ideas or add meaningful sections when expanding. Do not add filler or invent facts.
```

## New-chat suggestions (product unconfirmed)

Composer prefills from the new-chat page. Neither the text nor the message id says whether they belong to ChatGPT or Codex.

### Create document

Source: `webview/assets/app-initial-d817715f10a0.js`, offset 2698594, SHA-256 `36d08f702ce4f26179f8d4b6f6b07233336f6b7ace03bc48f5edf67c499b6adb`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createDocument.prompt.v5`.

Translator note: Composer prefill for creating a document

```text
Create a new document with {artifact}. Start by asking me what it should be about.
```

### Create presentation

Source: `webview/assets/app-initial-d817715f10a0.js`, offset 2698826, SHA-256 `c354f8edcd9c45d0e5eb4cd5d17f670fdc12c9609830ee6719f15869bd3c71e6`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createPresentation.prompt.v5`.

Translator note: Composer prefill for creating a presentation

```text
Create a new presentation with {artifact}. Start by asking me what it should be about.
```

### Create spreadsheet

Source: `webview/assets/app-initial-d817715f10a0.js`, offset 2699272, SHA-256 `4a39abc79643e962f44c0e4df50a272def7f1bb3bf084368c2fd0c2c948c807f`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createSpreadsheet.prompt.v5`.

Translator note: Composer prefill for creating a spreadsheet

```text
Create a new spreadsheet with {artifact}. Start by asking me what it should be about.
```

### Create site

Source: `webview/assets/app-initial-d817715f10a0.js`, offset 2699050, SHA-256 `e1424780919ff14c5910ff90e6245f9e74a7a82d6077ffc688279f8e4c87e46d`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createSite.prompt.v5`.

Translator note: Composer prefill for creating a site

```text
Create a new site with {artifact}. Start by asking me what it should be about.
```

### Create website: product

Source: `webview/assets/home-ambient-suggestions-content-2014aee9e3b2.js`, offset 27663, SHA-256 `cdfd6a036d7e84992f1ad44b674e63214179fc543af913d4acaf10d6cad9fd92`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createSiteProduct.prompt`.

Translator note: Composer prefill for creating a product website

```text
Create a new website to launch a product with {artifact}. Start by asking me about the product, its audience, and the main action visitors should take.
```

### Create website: portfolio

Source: `webview/assets/home-ambient-suggestions-content-2014aee9e3b2.js`, offset 28237, SHA-256 `bde0b7be93891a5510476ff39e33e80bdd2edb7331763334a63ba6758210f651`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createSitePortfolio.prompt`.

Translator note: Composer prefill for creating a portfolio website

```text
Create a new website for a portfolio with {artifact}. Start by asking me whose work it should showcase and what projects to include.
```

### Create website: business

Source: `webview/assets/home-ambient-suggestions-content-2014aee9e3b2.js`, offset 28792, SHA-256 `639bbab4904bb194d6b2c6e2c4f33c20b46634e9a8c7195731d271a2439b3c64`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createSiteBusiness.prompt`.

Translator note: Composer prefill for creating a business website

```text
Create a new website for a business with {artifact}. Start by asking me about the business, its customers, and what the website should help them do.
```

### Create website: event

Source: `webview/assets/home-ambient-suggestions-content-2014aee9e3b2.js`, offset 29353, SHA-256 `3d55bc572ebabd0272a5b6665a6e8c04c0c75ff6486ee1883bba1430861559b1`.

Exact text from the bundle. Message id `home.newChatPageSuggestions.createSiteEvent.prompt`.

Translator note: Composer prefill for creating an event website

```text
Create a new website for an event with {artifact}. Start by asking me about the event and what attendees need to know or do.
```
