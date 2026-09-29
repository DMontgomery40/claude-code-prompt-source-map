# Codex/ChatGPT Dev Day surface triage

All 355 structural candidates were classified through OpenRouter using `typesafe/jev-1.13`; the served model was `typesafe/jev-1.13-20260917`. The classification used the existing scanner question and bundle evidence, with its normal 40-item cap lifted for this run. Reported request cost: $0.008346996.

287 candidates scored at least 0.5; 68 scored below it. Of the positives, 242 are endpoints. These are review priorities, not verified new features or proof of activation. Confidence is a signal, not proof.

Source build: ChatGPT desktop 26.928.20755 (12246). Baseline: the preceding committed app-surfaces inventory. Full evidence and raw probabilities remain in the local scanner work directory.

| Kind | Candidate | Probability | Triage |
| --- | --- | ---: | --- |
| i18n_namespaces | codeReviewPlugin | 0.92 | Review for coverage |
| i18n_namespaces | codeReview | 0.84 | Review for coverage |
| i18n_namespaces | gifEditor | 0.84 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/messages/{message_id}/elicitation/response | 0.84 | Review for coverage |
| enums | CHATGPT_WEB_ARTIFACT_KIND_ | 0.83 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/files | 0.83 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/messages/{message_id}/elicitation | 0.83 | Review for coverage |
| endpoints | /tbo/{tbo_id}/voice/calls | 0.83 | Review for coverage |
| endpoints | /tbo/{tbo_id}/voice/calls/{call_id}/stop | 0.83 | Review for coverage |
| endpoints | /agent/browser_context | 0.82 | Review for coverage |
| endpoints | /files/library/files/{library_file_id}/plan-summary | 0.82 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-comment | 0.82 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-pull-request | 0.82 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-revision-file | 0.82 | Review for coverage |
| endpoints | /messaging/plugin-suggestions/{reference}/continue | 0.81 | Review for coverage |
| endpoints | /tbo/{tbo_id}/voice/calls/{call_id}/attach | 0.81 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-merge | 0.81 | Review for coverage |
| i18n_subnamespaces | plugins.create | 0.80 | Review for coverage |
| endpoints | /conversation/{conversation_id}/executor/file | 0.80 | Review for coverage |
| endpoints | /dictation/upload-asset | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-diff | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-discussion | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-review-thread-update | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-reviews | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-search | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-submit-review | 0.80 | Review for coverage |
| endpoints | /wham/github/operations/gh-user-search | 0.80 | Review for coverage |
| endpoints | /wham/gitlab/operations/post-comment | 0.80 | Review for coverage |
| i18n_namespaces | space | 0.79 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/messages | 0.79 | Review for coverage |
| endpoints | /ps/orbit/{thread_id}/teams | 0.79 | Review for coverage |
| endpoints | /tbo/deletion-recovery | 0.79 | Review for coverage |
| endpoints | /tbo/{tbo_id}/misalignment-review | 0.79 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-revision-diff | 0.79 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-diff | 0.79 | Review for coverage |
| endpoints | /files/upload_reservations/{reservation_id}/claim_and_finish | 0.78 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/live | 0.78 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/messages/{message_id}/reactions | 0.78 | Review for coverage |
| endpoints | /service-accounts/{service_account_user_id}/plugins/{plugin_id}/install | 0.78 | Review for coverage |
| endpoints | /tbo/{tbo_id}/threads | 0.78 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-comment-update | 0.78 | Review for coverage |
| endpoints | /wham/github/operations/render-markdown | 0.78 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-discussions | 0.78 | Review for coverage |
| i18n_subnamespaces | localConversation.codexTool | 0.77 | Review for coverage |
| endpoints | /files/library/mounted/capabilities/onedrive | 0.77 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/aeon/prepare | 0.77 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/files/{file_id} | 0.77 | Review for coverage |
| endpoints | /tbo/{tbo_id}/root-thread | 0.77 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-revision-file | 0.77 | Review for coverage |
| endpoints | /wham/gitlab/operations/delete-comment | 0.77 | Review for coverage |
| endpoints | /wham/gitlab/operations/reply-comment | 0.77 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-comment | 0.77 | Review for coverage |
| i18n_subnamespaces | workOnboarding.writingStyle | 0.76 | Review for coverage |
| endpoints | /chat/frontend/v1/business-profiles/{business_profile_id}/insights | 0.76 | Review for coverage |
| endpoints | /cloud-aeons/by-thread/{thread_id}/doctor/check-in | 0.76 | Review for coverage |
| endpoints | /messaging/rooms/{room_id} | 0.76 | Review for coverage |
| endpoints | /record/pages/{page_id}/transcript-window | 0.76 | Review for coverage |
| endpoints | /spaces/{space_id}/restore | 0.76 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-mention-suggestions | 0.76 | Review for coverage |
| endpoints | /wham/gitlab/operations/search-pull-requests | 0.76 | Review for coverage |
| endpoints | /wham/gitlab/operations/submit-review | 0.76 | Review for coverage |
| i18n_namespaces | teams | 0.75 | Review for coverage |
| endpoints | /messaging/plugin-suggestions/{reference} | 0.75 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/messages/{message_id}/email | 0.75 | Review for coverage |
| endpoints | /pages/suggestions/{suggestion_id}/create | 0.75 | Review for coverage |
| endpoints | /pages/{page_id}/files | 0.75 | Review for coverage |
| endpoints | /service-accounts/{service_account_user_id}/plugins/{plugin_id}/uninstall | 0.75 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/share-submissions/{submission_id} | 0.75 | Review for coverage |
| endpoints | /tbo/{tbo_id}/messaging-room | 0.75 | Review for coverage |
| endpoints | /tbo/{tbo_id}/threads/{thread_id} | 0.75 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-reaction-update | 0.75 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-update | 0.75 | Review for coverage |
| endpoints | /wham/github/operations/summaries | 0.75 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-pull-requests-metadata | 0.75 | Review for coverage |
| i18n_subnamespaces | localConversation.pageToolActivity | 0.74 | Review for coverage |
| endpoints | /chat/frontend/v1/business-profiles/{business_profile_id}/verification-flows/{flow_id}/resume | 0.74 | Review for coverage |
| endpoints | /messaging/rooms/{room_id}/read | 0.74 | Review for coverage |
| endpoints | /pages/creation-capabilities | 0.74 | Review for coverage |
| endpoints | /pages/mentions/inbox | 0.74 | Review for coverage |
| endpoints | /pages/suggestions | 0.74 | Review for coverage |
| endpoints | /pages/{page_id}/automation-attachments | 0.74 | Review for coverage |
| endpoints | /pages/{page_id}/automation-attachments/{automation_id} | 0.74 | Review for coverage |
| endpoints | /pages/{page_id}/delete-forever | 0.74 | Review for coverage |
| endpoints | /pages/{page_id}/personal-move-admission | 0.74 | Review for coverage |
| endpoints | /spaces/new | 0.74 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-body | 0.74 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-review-snapshot | 0.74 | Review for coverage |
| endpoints | /wham/gitlab/operations/merge | 0.74 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-media | 0.74 | Review for coverage |
| enums | CHATGPT_WEB_ARTIFACT_INTERACTION_ACTION_ | 0.73 | Review for coverage |
| endpoints | /aip/ledger/files/download_zip | 0.73 | Review for coverage |
| endpoints | /cloud-aeons/primary | 0.73 | Review for coverage |
| endpoints | /files/upload_reservations | 0.73 | Review for coverage |
| endpoints | /pages/{page_id}/archive-operations | 0.73 | Review for coverage |
| endpoints | /pages/{page_id}/restore | 0.73 | Review for coverage |
| endpoints | /pages/{source_page_id}/link-resolutions | 0.73 | Review for coverage |
| endpoints | /password-managers/1password | 0.73 | Review for coverage |
| endpoints | /ps/orbit/{thread_id}/teams/{binding_id} | 0.73 | Review for coverage |
| endpoints | /spaces/{space_id}/pages | 0.73 | Review for coverage |
| endpoints | /tbo/{tbo_id}/automations | 0.73 | Review for coverage |
| endpoints | /tbo/{tbo_id}/runtime/resume | 0.73 | Review for coverage |
| endpoints | /websites | 0.73 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-reactions | 0.73 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-stack | 0.73 | Review for coverage |
| endpoints | /wham/github/operations/read-media | 0.73 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-mergeability | 0.73 | Review for coverage |
| endpoints | /wham/shared_threads/{share_id}/assets/{asset_id} | 0.73 | Review for coverage |
| i18n_namespaces | shopping | 0.72 | Review for coverage |
| endpoints | /automations/schedule_policy | 0.72 | Review for coverage |
| endpoints | /pages/sharing/recipients | 0.72 | Review for coverage |
| endpoints | /pages/{page_id}/archive | 0.72 | Review for coverage |
| endpoints | /service-accounts/{service_account_user_id}/plugins/installed | 0.72 | Review for coverage |
| endpoints | /tbo/by-thread/{thread_id} | 0.72 | Review for coverage |
| endpoints | /wham/github/operations/gh-pr-metadata | 0.72 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-snapshot | 0.72 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-title | 0.72 | Review for coverage |
| endpoints | /accounts/{account_id}/teams/{team_id}/activities | 0.71 | Review for coverage |
| endpoints | /cloud-aeons/by-thread/{thread_id}/doctor/setup | 0.71 | Review for coverage |
| endpoints | /pages/{page_id}/delete | 0.71 | Review for coverage |
| endpoints | /pins/pages | 0.71 | Review for coverage |
| endpoints | /spaces/v2/{space_id} | 0.71 | Review for coverage |
| endpoints | /tbo/{tbo_id}/activity | 0.71 | Review for coverage |
| endpoints | /tbo/{tbo_id}/channels/email | 0.71 | Review for coverage |
| endpoints | /wham/github/operations/searches | 0.71 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-stack | 0.71 | Review for coverage |
| enums | CODEX_ARTIFACT_EDIT_CATEGORY_ | 0.70 | Review for coverage |
| endpoints | /aeon-messaging/phone | 0.70 | Review for coverage |
| endpoints | /aeon-messaging/texting/activate | 0.70 | Review for coverage |
| endpoints | /aip/connectors/service_accounts/links/list | 0.70 | Review for coverage |
| endpoints | /flora/cca/executor | 0.70 | Review for coverage |
| endpoints | /pages/{page_id}/invitation | 0.70 | Review for coverage |
| endpoints | /pins/pages/{page_id} | 0.70 | Review for coverage |
| endpoints | /spaces/v2 | 0.70 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/access-requests/for-others | 0.70 | Review for coverage |
| endpoints | /spaces/{space_id} | 0.70 | Review for coverage |
| endpoints | /tbo/primary | 0.70 | Review for coverage |
| endpoints | /tbo/{tbo_id}/runtime/pause | 0.70 | Review for coverage |
| endpoints | /wham/github/connections | 0.70 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-checks | 0.70 | Review for coverage |
| endpoints | /wham/user-rules | 0.70 | Review for coverage |
| endpoints | /accounts/{account_id}/teams/{team_id}/spaces | 0.69 | Review for coverage |
| endpoints | /aeon-messaging/phone/verify | 0.69 | Review for coverage |
| endpoints | /pages/archived | 0.69 | Review for coverage |
| endpoints | /pages/link-workspace | 0.69 | Review for coverage |
| endpoints | /pages/{page_id}/access-requests/for-others | 0.69 | Review for coverage |
| endpoints | /pages/{page_id}/archive-operations/{operation_id} | 0.69 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/access-requests | 0.69 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/access-requests/{request_id}/approve | 0.69 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/shares | 0.69 | Review for coverage |
| endpoints | /tbo/{tbo_id} | 0.69 | Review for coverage |
| endpoints | /tbo/{tbo_id}/activity/stream | 0.69 | Review for coverage |
| endpoints | /tbo/{tbo_id}/computers/{environment_id}/connect-and-replace | 0.69 | Review for coverage |
| endpoints | /tbo/{tbo_id}/environment/recreate | 0.69 | Review for coverage |
| endpoints | /wham/github/operations/account | 0.69 | Review for coverage |
| endpoints | /wham/gitlab/operations/read-reviewers | 0.69 | Review for coverage |
| content_reference_categories | visualization | 0.68 | Review for coverage |
| i18n_namespaces | scheduled | 0.68 | Review for coverage |
| endpoints | /aip/connectors/service_accounts/links/{link_id} | 0.68 | Review for coverage |
| endpoints | /cloud-aeons/{aeon_id} | 0.68 | Review for coverage |
| endpoints | /messaging/connector-auth/{reference}/connect | 0.68 | Review for coverage |
| endpoints | /pages/catalog | 0.68 | Review for coverage |
| endpoints | /pages/{page_id} | 0.68 | Review for coverage |
| endpoints | /pages/{page_id}/access-requests/{request_id}/approve | 0.68 | Review for coverage |
| endpoints | /password-managers/1password/enrollment | 0.68 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/invitation | 0.68 | Review for coverage |
| endpoints | /students/2026 | 0.68 | Review for coverage |
| endpoints | /tbo/{tbo_id}/channels/email/claim | 0.68 | Review for coverage |
| endpoints | /websites/{project_id} | 0.68 | Review for coverage |
| endpoints | /wham/github/operations/initial-detail | 0.68 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-resolution | 0.68 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-reviewer-assignment | 0.68 | Review for coverage |
| endpoints | /wham/models | 0.68 | Review for coverage |
| enums | CODEX_ARTIFACT_PERSISTENCE_OPERATION_KIND_ | 0.67 | Review for coverage |
| endpoints | /accounts/{account_id}/teams/{team_id}/join | 0.67 | Review for coverage |
| endpoints | /chat/frontend/v1/business-profiles/{business_profile_id}/manager/fields/{field_key} | 0.67 | Review for coverage |
| endpoints | /pages/{page_id}/access-requests | 0.67 | Review for coverage |
| endpoints | /pages/{page_id}/library-files/{library_file_id}/shares | 0.67 | Review for coverage |
| endpoints | /pages/{page_id}/versions | 0.67 | Review for coverage |
| endpoints | /record/pages/{page_id} | 0.67 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/shares/{share_id} | 0.67 | Review for coverage |
| endpoints | /tbo/onboarding/greeting | 0.67 | Review for coverage |
| endpoints | /websites/{project_id}/metadata | 0.67 | Review for coverage |
| endpoints | /wham/gitlab/operations/configure-auto-merge | 0.67 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-body | 0.67 | Review for coverage |
| endpoints | /admin-requests | 0.66 | Review for coverage |
| endpoints | /chat/frontend/v1/business-profiles/{business_profile_id}/verification-flows/{flow_id}/verifications/{verification_id}/resend | 0.66 | Review for coverage |
| endpoints | /cloud-aeons/avatar-snapshots | 0.66 | Review for coverage |
| endpoints | /files/library/files/{library_file_id}/content_redirect | 0.66 | Review for coverage |
| endpoints | /pages/{page_id}/access-requests/{request_id}/reject | 0.66 | Review for coverage |
| endpoints | /pages/{page_id}/mentions/access | 0.66 | Review for coverage |
| endpoints | /pages/{page_id}/metadata | 0.66 | Review for coverage |
| endpoints | /pages/{page_id}/versions/{checkpoint_id}/checkpoint-bootstrap | 0.66 | Review for coverage |
| endpoints | /shopping/home | 0.66 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/access-requests/for-self | 0.66 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/access-requests/requested | 0.66 | Review for coverage |
| endpoints | /tbo | 0.66 | Review for coverage |
| endpoints | /websites/{project_id}/preferred_live_url | 0.66 | Review for coverage |
| i18n_namespaces | spaces | 0.65 | Review for coverage |
| i18n_subnamespaces | sharing.invitation | 0.65 | Review for coverage |
| i18n_subnamespaces | chatgptConversations.readAloud | 0.65 | Review for coverage |
| endpoints | /accounts/{account_id}/teams | 0.65 | Review for coverage |
| endpoints | /accounts/{account_id}/teams/{team_id}/members | 0.65 | Review for coverage |
| endpoints | /accounts/{account_id}/teams/{team_id}/members/batch | 0.65 | Review for coverage |
| endpoints | /pages/{page_id}/shares | 0.65 | Review for coverage |
| endpoints | /ps/v2/service_accounts/{account_user_id}/workspace_connections | 0.65 | Review for coverage |
| endpoints | /saved-credentials | 0.65 | Review for coverage |
| endpoints | /saved-credentials/{credential_id} | 0.65 | Review for coverage |
| endpoints | /shopping/merchant-agreement/status | 0.65 | Review for coverage |
| endpoints | /tbo/{tbo_id}/computers | 0.65 | Review for coverage |
| endpoints | /tbo/{tbo_id}/onboarding/initialize | 0.65 | Review for coverage |
| endpoints | /wham/gitlab/operations/search-reviewer-candidates | 0.65 | Review for coverage |
| i18n_subnamespaces | defenseFactory.editors | 0.64 | Review for coverage |
| endpoints | /aip/connectors/{connector_id}/mfa_requirement | 0.64 | Review for coverage |
| endpoints | /messaging/connector-auth/{reference} | 0.64 | Review for coverage |
| endpoints | /messaging/connector-auth/{reference}/complete | 0.64 | Review for coverage |
| endpoints | /messaging/connector-auth/{reference}/start | 0.64 | Review for coverage |
| endpoints | /pages/{page_id}/access-policy | 0.64 | Review for coverage |
| endpoints | /pages/{page_id}/access-requests/for-self | 0.64 | Review for coverage |
| endpoints | /ps/v2/service_accounts/{account_user_id}/workspace_connections/{link_id} | 0.64 | Review for coverage |
| endpoints | /spaces/v2/{space_id}/access-requests/{request_id}/reject | 0.64 | Review for coverage |
| endpoints | /websites/{project_id}/slug/availability | 0.64 | Review for coverage |
| endpoints | /wham/github/operations/review-metadata | 0.64 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-reaction | 0.64 | Review for coverage |
| endpoints | /wham/gitlab/operations/update-status | 0.64 | Review for coverage |
| i18n_subnamespaces | avatarOverlay.transcript | 0.63 | Review for coverage |
| endpoints | /accounts/{account_id}/teams/{team_id} | 0.63 | Review for coverage |
| endpoints | /flora/browser/cookies | 0.63 | Review for coverage |
| endpoints | /onboarding/aeon-initialization | 0.63 | Review for coverage |
| endpoints | /pages | 0.63 | Review for coverage |
| endpoints | /shopping/business-profiles/{business_profile_id}/feeds/{feed_id}/hosted-url | 0.63 | Review for coverage |
| endpoints | /shopping/merchant-agreement/domain/accept | 0.63 | Review for coverage |
| endpoints | /tbo/{tbo_id}/computer/sessions | 0.63 | Review for coverage |
| endpoints | /websites/{project_id}/access_request | 0.63 | Review for coverage |
| endpoints | /websites/{project_id}/custom_domains | 0.63 | Review for coverage |
| endpoints | /wham/sites/space/{page_id} | 0.63 | Review for coverage |
| i18n_namespaces | restricted | 0.62 | Review for coverage |
| i18n_subnamespaces | settings.userRules | 0.62 | Review for coverage |
| i18n_namespaces | edu | 0.62 | Review for coverage |
| endpoints | /automation/{automation_id}/execution_threads | 0.62 | Review for coverage |
| endpoints | /flora/browser/cookies/{hostname} | 0.62 | Review for coverage |
| endpoints | /pages/mentions/inbox/{notification_id}/read | 0.62 | Review for coverage |
| endpoints | /pages/{page_id}/realtime-token | 0.62 | Review for coverage |
| endpoints | /pages/{page_id}/shares/{share_id} | 0.62 | Review for coverage |
| endpoints | /tbo/{tbo_id}/channels/email/options | 0.62 | Review for coverage |
| i18n_namespaces | k12 | 0.61 | Review for coverage |
| enums | CHATGPT_VOICE_READ_ALOUD_PLAYBACK_STATE_ | 0.61 | Review for coverage |
| endpoints | /automation/{automation_id}/backing_runs | 0.61 | Review for coverage |
| endpoints | /tbo/{tbo_id}/computers/{environment_id}/disconnect | 0.61 | Review for coverage |
| endpoints | /websites/{project_id}/environment | 0.61 | Review for coverage |
| endpoints | /websites/{project_id}/share_access | 0.61 | Review for coverage |
| i18n_subnamespaces | chatgptConversations.businessAgent | 0.60 | Review for coverage |
| i18n_subnamespaces | appgenPage.filePreview | 0.60 | Review for coverage |
| endpoints | /wham/config/agent-bundle | 0.60 | Review for coverage |
| endpoints | /wham/sites/projects/{project_id}/owner | 0.60 | Review for coverage |
| endpoints | /shopping/business-profiles/{business_profile_id}/feeds/{feed_id}/uploads | 0.59 | Review for coverage |
| endpoints | /tbo/{tbo_id}/environment/status | 0.59 | Review for coverage |
| i18n_subnamespaces | chatgpt.tasks | 0.58 | Review for coverage |
| enums | CODEX_SPACES_TEMPLATE_GALLERY_ACTION_ | 0.58 | Review for coverage |
| enums | CHATGPT_WEB_BILLING_MANDATE_AUTHORIZATION_OPERATION_ | 0.58 | Review for coverage |
| endpoints | /pages/{page_id}/access-requests/requested | 0.58 | Review for coverage |
| i18n_namespaces | automations | 0.57 | Review for coverage |
| endpoints | /files/library/files/{library_file_id}/download_redirect | 0.57 | Review for coverage |
| endpoints | /flora/browser/passkeys | 0.57 | Review for coverage |
| endpoints | /settings/codex-cloud | 0.57 | Review for coverage |
| endpoints | /shopping/business-profiles/{business_profile_id}/feeds/{feed_id}/hosted-url/runs | 0.57 | Review for coverage |
| i18n_namespaces | mattressFinanceHeader | 0.56 | Review for coverage |
| endpoints | /aip/connectors/oauth/callback_id | 0.56 | Review for coverage |
| endpoints | /shopping/business-profiles/{business_profile_id}/feeds/{feed_id}/uploads/{upload_id} | 0.56 | Review for coverage |
| endpoints | /websites/{project_id}/custom_domains/{custom_domain_id} | 0.56 | Review for coverage |
| endpoints | /wham/config/agent-enterprise-managed | 0.56 | Review for coverage |
| i18n_subnamespaces | workspaceOnboarding.apps | 0.55 | Review for coverage |
| endpoints | /cloud-aeons/primary/reboot | 0.55 | Review for coverage |
| i18n_namespaces | environmentSetup | 0.54 | Review for coverage |
| endpoints | /flora/browser/passkeys/{credential_id} | 0.54 | Review for coverage |
| endpoints | /shopping/business-profiles/{business_profile_id}/feeds/{feed_id}/hosted-url/schedule/disable | 0.54 | Review for coverage |
| enums | CHATGPT_SITES_OPERATION_TYPE_ | 0.52 | Review for coverage |
| i18n_subnamespaces | chatgpt.orbit | 0.52 | Review for coverage |
| asset_families | webview/assets/tab.js | 0.52 | Review for coverage |
| i18n_subnamespaces | browserAuth.qrCode | 0.52 | Review for coverage |
| endpoints | /settings/worktrees | 0.52 | Review for coverage |
| i18n_namespaces | aeon | 0.51 | Review for coverage |
| i18n_namespaces | artifactHandoff | 0.51 | Review for coverage |
| i18n_subnamespaces | chatgpt.promotion | 0.51 | Review for coverage |
| endpoints | /websites/{project_id}/custom_domains/{custom_domain_id}/refresh | 0.51 | Review for coverage |
| i18n_subnamespaces | multiplayer.image | 0.50 | Review for coverage |
| i18n_namespaces | fileViewer | 0.50 | Review for coverage |
| enums | CHATGPT_VOICE_READ_ALOUD_TRANSITION_REASON_ | 0.50 | Review for coverage |
| asset_families | webview/assets/view.js | 0.49 | Lower priority |
| endpoints | /pages/{page_id}/views | 0.49 | Lower priority |
| endpoints | /wham/profiles/username/check | 0.49 | Lower priority |
| endpoints | /gizmos/business-agents/disclosures/viewed | 0.48 | Lower priority |
| i18n_namespaces | paymentMethodNames | 0.47 | Lower priority |
| enums | CODEX_ARTIFACT_SESSION_OUTCOME_ | 0.47 | Lower priority |
| i18n_namespaces | messageActions | 0.45 | Lower priority |
| asset_families | webview/assets/file.js | 0.45 | Lower priority |
| endpoints | /accounts/{account_id}/teams/avatars | 0.45 | Lower priority |
| i18n_subnamespaces | spreadsheetEditor.validation | 0.44 | Lower priority |
| asset_families | webview/assets/card.js | 0.44 | Lower priority |
| i18n_namespaces | codex | 0.43 | Lower priority |
| i18n_subnamespaces | composer.atMentionTabs | 0.43 | Lower priority |
| enums | CODEX_SPACES_ONBOARDING_ACTION_ | 0.42 | Lower priority |
| i18n_namespaces | cardBrandNames | 0.41 | Lower priority |
| i18n_subnamespaces | browserPluginSettings.permission | 0.41 | Lower priority |
| endpoints | /wham/work/settings | 0.41 | Lower priority |
| enums | CHATGPT_WEB_BILLING_MANDATE_AUTHORIZATION_STATUS_ | 0.40 | Lower priority |
| endpoints | /spaces/v2/{space_id}/appearance | 0.40 | Lower priority |
| asset_families | webview/assets/panel.js | 0.39 | Lower priority |
| i18n_subnamespaces | settings.cloudEnvironments | 0.38 | Lower priority |
| enums | CHATGPT_TBO_ROOM_SOURCE_ | 0.38 | Lower priority |
| i18n_subnamespaces | appgenPage.ownership | 0.38 | Lower priority |
| endpoints | /messaging/rooms/{room_id}/responding_heartbeat | 0.38 | Lower priority |
| enums | ACCESS_FLOW_FIELD_ | 0.37 | Lower priority |
| enums | CODEX_ARTIFACT_PERSISTENCE_OUTCOME_ | 0.36 | Lower priority |
| asset_families | webview/assets/api.js | 0.36 | Lower priority |
| i18n_namespaces | orbit | 0.34 | Lower priority |
| i18n_subnamespaces | libraryNext.restore | 0.34 | Lower priority |
| asset_families | webview/assets/editor.js | 0.33 | Lower priority |
| i18n_subnamespaces | apps.connectMfa | 0.31 | Lower priority |
| i18n_namespaces | mini | 0.30 | Lower priority |
| enums | CODEX_PROFILE_SIGNED_OUT_ACTION_TYPE_ | 0.30 | Lower priority |
| i18n_subnamespaces | settings.codeReviewPlugin | 0.30 | Lower priority |
| asset_families | webview/assets/tab-content.js | 0.30 | Lower priority |
| i18n_subnamespaces | profile.usernameAvailability | 0.29 | Lower priority |
| i18n_namespaces | pages | 0.28 | Lower priority |
| i18n_namespaces | cancelSubscriptionByTheNumbersModal | 0.28 | Lower priority |
| i18n_subnamespaces | dil.modelWrittenV2 | 0.28 | Lower priority |
| enums | CODEX_APP_SETTINGS_TAB_ | 0.27 | Lower priority |
| i18n_subnamespaces | cloudV2.savedConfigs | 0.26 | Lower priority |
| enums | CHATGPT_TBO_ONBOARDING_ACTION_ | 0.25 | Lower priority |
| asset_families | webview/assets/actions.js | 0.25 | Lower priority |
| enums | CHATGPT_CODEX_USAGE_ANALYTICS_CHART_ | 0.23 | Lower priority |
| i18n_subnamespaces | settings.legacyCodexCloud | 0.23 | Lower priority |
| enums | CHATGPT_SITES_OPERATION_RESULT_ | 0.23 | Lower priority |
| asset_families | webview/assets/images.js | 0.23 | Lower priority |
| asset_families | webview/assets/runtime.js | 0.23 | Lower priority |
| i18n_subnamespaces | sidebar.recents | 0.23 | Lower priority |
| i18n_subnamespaces | wham.usageDashboard | 0.22 | Lower priority |
| i18n_subnamespaces | elicitation.page | 0.22 | Lower priority |
| i18n_subnamespaces | merchantSettings.agreement | 0.22 | Lower priority |
| i18n_namespaces | businessProfiles | 0.21 | Lower priority |
| i18n_namespaces | workPreferences | 0.21 | Lower priority |
| i18n_subnamespaces | settings.teams | 0.20 | Lower priority |
| asset_families | webview/assets/layout.js | 0.20 | Lower priority |
| i18n_subnamespaces | cancelSubscriptionModal.hasDiscount | 0.19 | Lower priority |
| enums | CHATGPT_CODEX_USAGE_ANALYTICS_SELECTION_ | 0.18 | Lower priority |
| enums | CHATGPT_WEB_BILLING_MANDATE_AUTHORIZATION_ACTION_TYPE_ | 0.17 | Lower priority |
| asset_families | webview/assets/preload.js | 0.17 | Lower priority |
| i18n_subnamespaces | symbolPicker.teamIcons | 0.16 | Lower priority |
| i18n_namespaces | appgenSettings | 0.15 | Lower priority |
| asset_families | webview/assets/section.js | 0.15 | Lower priority |
| asset_families | webview/assets/shell.js | 0.15 | Lower priority |
| enums | CHATGPT_COOKIE_CONSENT_PREFERENCES_ACTION_ | 0.15 | Lower priority |
| i18n_subnamespaces | profile.editUsername | 0.15 | Lower priority |
| i18n_subnamespaces | settings.fileTypeHandlers | 0.13 | Lower priority |
| i18n_subnamespaces | settingsModal.walletBalance | 0.13 | Lower priority |
