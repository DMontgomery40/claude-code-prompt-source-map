# Environment variables read by Claude Code

Claude Code reads 1125 environment variables by name, plus 5 name patterns built at run time. 386 of the named variables are documented at code.claude.com and 739 are not. It also sets 487 variables for its own process, tools, hooks and other child processes; these are listed in their own section.

A name counts as read when code reads it from `process.env`, through the typed env accessor, through a helper that takes the name, or by iterating a list of names into `process.env`. Names that only appear as strings, or are only written for child processes, are excluded. Documented means the name appears on the env-vars docs page or in a table row on another docs page.

Prompt caching: DISABLE_PROMPT_CACHING* decide whether requests get cache markers, and the TTL resolves in this order: FORCE_PROMPT_CACHING_5M, then the *_PROMPT_CACHE_TTL variables, then settings, then agent frontmatter, then ENABLE_PROMPT_CACHING_1H. See the first section for details.

## Undocumented variables

These names are read in code but do not appear on the env-vars docs page or in any docs table.

**Prompt caching** (2): `CLAUDE_CODE_SUBAGENT_CACHE_EVICT`, `DISABLE_PROMPT_CACHING_MYTHOS`

**Claude Code and Anthropic** (444): `_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL`, `AI_AGENT`, `ANTHROPIC_CONFIG_DIR`, `ANTHROPIC_ENVIRONMENT_ID`, `ANTHROPIC_ENVIRONMENT_KEY`, `ANTHROPIC_IDENTITY_TOKEN`, `ANTHROPIC_IDENTITY_TOKEN_FILE`, `ANTHROPIC_LOG`, `ANTHROPIC_SCOPE`, `ANTHROPIC_SERVICE_ACCOUNT_ID`, `ANTHROPIC_SESSION_ID`, `ANTHROPIC_UNIX_SOCKET`, `ANTHROPIC_WEBHOOK_SIGNING_KEY`, `ANTHROPIC_WORK_ID`, `AUTOMODE_DECISION_LOG`, `BUGHUNTER_DEV_BUNDLE_B64`, `BUGHUNTER_FLEET_SIZE`, `CCR_ENABLE_BUNDLE`, `CCR_ON_BRANCH_DEFAULT_GUARD`, `CCR_SESSION_PROFILE`, `CCR_SHR_SSE_HINTS`, `CCR_SPAWN_TIMESTAMP_MS`, `CLAUBBIT`, `CLAUDE_AFTER_LAST_COMPACT`, `CLAUDE_AGENT_SDK_CLIENT_APP`, `CLAUDE_AGENT_SDK_VERSION`, `CLAUDE_AGENTS_AUTO_RELAUNCHED_AT`, `CLAUDE_AGENTS_SELECT`, `CLAUDE_ARTIFACT_HOST_GRANT`, `CLAUDE_BG_AUTH_SNAPSHOT_PATH`, `CLAUDE_BG_BACKEND`, `CLAUDE_BG_CLAIM_AUTH`, `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`, `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`, `CLAUDE_BG_ISOLATION`, `CLAUDE_BG_MEMORY_TOGGLED_OFF`, `CLAUDE_BG_POST_CLEAR_RESPAWN`, `CLAUDE_BG_PTY_AUTH`, `CLAUDE_BG_RENDEZVOUS_SOCK`, `CLAUDE_BG_RV_AUTH`, `CLAUDE_BG_SESSION_PERMISSION_RULES`, `CLAUDE_BG_SOCKET_TOKENS_PATH`, `CLAUDE_BG_SOURCE`, `CLAUDE_BG_STARTUP_WEDGE_MS`, `CLAUDE_BG_TCC_DISCLAIMED`, `CLAUDE_BRIDGE_BASE_URL`, `CLAUDE_BRIDGE_REATTACH_GROUPING`, `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`, `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`, `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`, `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`, `CLAUDE_BRIDGE_REATTACH_SEQ`, `CLAUDE_BRIDGE_REATTACH_SESSION`, `CLAUDE_CHROME_CLASSIFIER_FLOOR`, `CLAUDE_CHROME_PAIRED_DEVICE_ID`, `CLAUDE_CHROME_PERMISSION_MODE`, `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`, `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`, `CLAUDE_CODE_ACCOUNT_TAGGED_ID`, `CLAUDE_CODE_ACCOUNT_UUID`, `CLAUDE_CODE_ACT_DONT_REDERIVE`, `CLAUDE_CODE_ACTION`, `CLAUDE_CODE_ADDITIONAL_PROTECTION`, `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`, `CLAUDE_CODE_AGENT`, `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`, `CLAUDE_CODE_ALTGR_AS_TEXT`, `CLAUDE_CODE_AMBER_ASTROLABE`, `CLAUDE_CODE_API_BASE_URL`, `CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR`, `CLAUDE_CODE_ARTIFACT`, `CLAUDE_CODE_ARTIFACT_ASSETS`, `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK`, `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK_FIXED`, `CLAUDE_CODE_ARTIFACT_COMMENT_RESPONDER`, `CLAUDE_CODE_ARTIFACT_DB`, `CLAUDE_CODE_ARTIFACT_DB_STR_REPLACE`, `CLAUDE_CODE_ARTIFACT_DELETE`, `CLAUDE_CODE_ARTIFACT_FRESH_READ`, `CLAUDE_CODE_ARTIFACT_HOT`, `CLAUDE_CODE_ARTIFACT_MULTI_FILE`, `CLAUDE_CODE_ARTIFACT_OPEN_ACTION`, `CLAUDE_CODE_ARTIFACT_OPENING_PREFETCH`, `CLAUDE_CODE_ARTIFACT_PATH_PIN`, `CLAUDE_CODE_ARTIFACT_PIN`, `CLAUDE_CODE_ARTIFACT_PRESENCE`, `CLAUDE_CODE_ARTIFACT_PREVIEW`, `CLAUDE_CODE_ARTIFACT_QUICKSTART`, `CLAUDE_CODE_ARTIFACT_START_KIT`, `CLAUDE_CODE_ARTIFACT_TOOLSET`, `CLAUDE_CODE_ARTIFACT_TYPE_CATALOG`, `CLAUDE_CODE_ARTIFACT_TYPE_CLOUD_CREATE`, `CLAUDE_CODE_ARTIFACT_TYPES`, `CLAUDE_CODE_ARTIFACT_VERIFY`, `CLAUDE_CODE_ARTIFACTS_API_TOKEN`, `CLAUDE_CODE_ATTRIBUTION_ANNOUNCEMENT`, `CLAUDE_CODE_AUTH_FAIL_EXIT_MS`, `CLAUDE_CODE_BASALT_COVE`, `CLAUDE_CODE_BASE_REF`, `CLAUDE_CODE_BASE_REFS`, `CLAUDE_CODE_BASH_OUTPUT_AUDIENCE_NOTE`, `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR`, `CLAUDE_CODE_BENCH_LIVE_COUNTS`, `CLAUDE_CODE_BISON_CAIRN`, `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`, `CLAUDE_CODE_BREEZY_HORIZON`, `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`, `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`, `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`, `CLAUDE_CODE_BRIDGE_MCP_CARRIER`, `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`, `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`, `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`, `CLAUDE_CODE_BRIEF`, `CLAUDE_CODE_BRIEF_UPLOAD`, `CLAUDE_CODE_BUBBLEWRAP`, `CLAUDE_CODE_CCR_EARLY_HYDRATE_PREFETCH`, `CLAUDE_CODE_CCR_SURFACE`, `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`, `CLAUDE_CODE_CLASSIFIER_SUMMARY`, `CLAUDE_CODE_COLD_COMPACT`, `CLAUDE_CODE_CONTAINER_ID`, `CLAUDE_CODE_COORDINATOR_EXTRA_TOOLS`, `CLAUDE_CODE_COORDINATOR_FORCE_WORKER_INHERIT_MODEL`, `CLAUDE_CODE_COORDINATOR_MODE`, `CLAUDE_CODE_COORDINATOR_WORKER_CHECKIN_SECONDS`, `CLAUDE_CODE_COWORK_FRAME_ARTIFACTS`, `CLAUDE_CODE_COZY_TEAPOT`, `CLAUDE_CODE_CUSTOM_OAUTH_URL`, `CLAUDE_CODE_DAEMON_COLD_START`, `CLAUDE_CODE_DD_ERROR_TRACKING_FLUSH_INTERVAL_MS`, `CLAUDE_CODE_DEBUG_REPAINTS`, `CLAUDE_CODE_DECSTBM`, `CLAUDE_CODE_DESIGN_OAUTH_CLIENT_ID`, `CLAUDE_CODE_DESKTOP_APP_VERSION`, `CLAUDE_CODE_DIAGNOSTICS_FILE`, `CLAUDE_CODE_DIR_SYNC_CHAIN`, `CLAUDE_CODE_DIR_SYNC_DISABLE_ANCHORING`, `CLAUDE_CODE_DIR_SYNC_ENGINE`, `CLAUDE_CODE_DIR_SYNC_FFWD`, `CLAUDE_CODE_DIR_SYNC_GIT`, `CLAUDE_CODE_DIR_SYNC_STREAM`, `CLAUDE_CODE_DISABLE_AWAITING_USER_IDLE`, `CLAUDE_CODE_DISABLE_CLAUDE_API_SKILL`, `CLAUDE_CODE_DISABLE_CLAUDE_CODE_SKILL`, `CLAUDE_CODE_DISABLE_DIR_SYNC`, `CLAUDE_CODE_DISABLE_EXPLORE_INHERIT_CAP`, `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`, `CLAUDE_CODE_DISABLE_MEMORY_BULK_INFLATE`, `CLAUDE_CODE_DISABLE_MEMORY_MASS_DELETE_HOLD`, `CLAUDE_CODE_DISABLE_MEMORY_PERIODIC_RESYNC`, `CLAUDE_CODE_DISABLE_MEMORY_RO_UNSAVED_NOTICE`, `CLAUDE_CODE_DISABLE_MEMORY_STREAM_LIST`, `CLAUDE_CODE_DISABLE_NESTED_CHAIN_IDLE`, `CLAUDE_CODE_DISABLE_NESTED_USER_REPAIR`, `CLAUDE_CODE_DISABLE_ORG_MEMORY`, `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`, `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP`, `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK`, `CLAUDE_CODE_DISABLE_TURN_HANDOFF`, `CLAUDE_CODE_DISABLE_VITALS_EMITTER`, `CLAUDE_CODE_DISABLE_WORKING_SYNC`, `CLAUDE_CODE_DONT_INHERIT_ENV`, `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`, `CLAUDE_CODE_EAGER_FLUSH`, `CLAUDE_CODE_EDITOR_CODELIVERY`, `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`, `CLAUDE_CODE_EMIT_STARTUP_TIMING`, `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`, `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`, `CLAUDE_CODE_ENABLE_CFC`, `CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL`, `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`, `CLAUDE_CODE_ENABLE_MENU_KIND_LANES`, `CLAUDE_CODE_ENABLE_NARRATION`, `CLAUDE_CODE_ENABLE_REFRESH_MCP_TOOLS`, `CLAUDE_CODE_ENABLE_REMOTE_RECAP`, `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING`, `CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT`, `CLAUDE_CODE_ENABLE_XAA`, `CLAUDE_CODE_ENTRYPOINT`, `CLAUDE_CODE_ENVIRONMENT_KIND`, `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`, `CLAUDE_CODE_EVAL_CONFINED`, `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`, `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`, `CLAUDE_CODE_EXPERIMENTAL_OBSERVER_AGENTS`, `CLAUDE_CODE_EXTRA_METADATA`, `CLAUDE_CODE_FEDERATION_CACHE_DIR`, `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`, `CLAUDE_CODE_FLEETVIEW_SIMPLE`, `CLAUDE_CODE_FOOTER_INDICATOR`, `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`, `CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM`, `CLAUDE_CODE_FORCE_TERMINAL_IMAGES`, `CLAUDE_CODE_FORCE_WINDOWS_CREDMAN`, `CLAUDE_CODE_FORWARD_USER_INTENT`, `CLAUDE_CODE_FRAME_TIMING_LOG`, `CLAUDE_CODE_FRAME_TIMING_SAMPLE_EVERY`, `CLAUDE_CODE_GORSE_PLOVER`, `CLAUDE_CODE_GZIP_CCR_REQUEST_BODIES`, `CLAUDE_CODE_GZIP_REQUEST_BODIES`, `CLAUDE_CODE_HARBOR_KITE`, `CLAUDE_CODE_HARBOR_KITE_CLOUD`, `CLAUDE_CODE_HARBOR_KITE_PACING_OFF`, `CLAUDE_CODE_HIDE_SETTINGS_HINT`, `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`, `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`, `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`, `CLAUDE_CODE_HOOKS_SAME_THREAD`, `CLAUDE_CODE_HOST_AUTH_ENV_VAR`, `CLAUDE_CODE_HOST_AUTH_REFRESH_TIMEOUT_MS`, `CLAUDE_CODE_HOST_CREDS_FILE`, `CLAUDE_CODE_HOST_PLATFORM`, `CLAUDE_CODE_HOST_SCHEDULED_RUN`, `CLAUDE_CODE_HOST_SESSION_ID`, `CLAUDE_CODE_HOVER_REST`, `CLAUDE_CODE_HUMBLE_HAMMOCK`, `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`, `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`, `CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES`, `CLAUDE_CODE_INLINE_TOOLS`, `CLAUDE_CODE_INTRO_FRAME`, `CLAUDE_CODE_IS_COWORK`, `CLAUDE_CODE_JUNIPER_SUNDIAL`, `CLAUDE_CODE_KB_COHESION_FIXES`, `CLAUDE_CODE_LANTERN_PRISM`, `CLAUDE_CODE_LARCH_CISTERN`, `CLAUDE_CODE_LEGACY_BUNDLE`, `CLAUDE_CODE_LOOP_KEEPALIVE`, `CLAUDE_CODE_LOOP_PERSISTENT`, `CLAUDE_CODE_MAX_EFFORT_REMINDER`, `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`, `CLAUDE_CODE_MCP_MEMORY_CGROUP`, `CLAUDE_CODE_MEMORY_PUSH_DELETE_MODE`, `CLAUDE_CODE_MODEL_CAPABILITIES`, `CLAUDE_CODE_MODEL_CATALOG`, `CLAUDE_CODE_MODEL_CATALOG_URL`, `CLAUDE_CODE_NANKEEN_KESTREL`, `CLAUDE_CODE_NO_MODEL_FALLBACK`, `CLAUDE_CODE_OAUTH_401_WAIT_MS`, `CLAUDE_CODE_OAUTH_CLIENT_ID`, `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`, `CLAUDE_CODE_OCHRE_KITE`, `CLAUDE_CODE_ORGANIZATION_UUID`, `CLAUDE_CODE_PARCHMENT_FERN`, `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`, `CLAUDE_CODE_PARKED_STOP_RETIRES`, `CLAUDE_CODE_PARSED_WILLOW`, `CLAUDE_CODE_PEWTER_OWL`, `CLAUDE_CODE_PEWTER_OWL_TOOL`, `CLAUDE_CODE_PLAN_MODE_REQUIRED`, `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`, `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`, `CLAUDE_CODE_PLUGIN_ATTRIBUTION`, `CLAUDE_CODE_PLUGIN_BINARY_ASSETS`, `CLAUDE_CODE_PLUGIN_DIR_WATCH`, `CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE`, `CLAUDE_CODE_POLISHED_DEWDROP`, `CLAUDE_CODE_POLL_EVENTS`, `CLAUDE_CODE_POST_TURN_MEMORY`, `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`, `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`, `CLAUDE_CODE_POWERUP_ONBOARDING`, `CLAUDE_CODE_PROACTIVE`, `CLAUDE_CODE_PROFILE_STARTUP`, `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`, `CLAUDE_CODE_QUESTION_EXTENDED`, `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`, `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`, `CLAUDE_CODE_RATE_LIMIT_TIER`, `CLAUDE_CODE_REFUSAL_FALLBACK_CATCH_ALL`, `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`, `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`, `CLAUDE_CODE_REMOTE_HERMETIC_MODE`, `CLAUDE_CODE_REMOTE_MEMORY_DIR`, `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`, `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`, `CLAUDE_CODE_REPL`, `CLAUDE_CODE_REPO_CHECKOUTS`, `CLAUDE_CODE_REPORT_FINDINGS`, `CLAUDE_CODE_RESUME_FROM_SESSION`, `CLAUDE_CODE_RESUME_REASON`, `CLAUDE_CODE_RESUME_SOURCE_ALIVE`, `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`, `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`, `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`, `CLAUDE_CODE_RUSTLING_PIXEL`, `CLAUDE_CODE_SANDBOXED`, `CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH`, `CLAUDE_CODE_SDK_HAS_OAUTH_REFRESH`, `CLAUDE_CODE_SESSION_ATTENDED`, `CLAUDE_CODE_SESSION_KIND`, `CLAUDE_CODE_SESSION_LOG`, `CLAUDE_CODE_SESSION_NAME`, `CLAUDE_CODE_SESSION_ORIGIN`, `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`, `CLAUDE_CODE_SILENT_TURN_REMINDER`, `CLAUDE_CODE_SILENT_TURN_REMINDER_TEXT`, `CLAUDE_CODE_SILENT_TURN_REMINDER_TURNS`, `CLAUDE_CODE_SKILL_ATTRIBUTION`, `CLAUDE_CODE_SKILL_PROPOSALS`, `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS`, `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS_EXCEPT`, `CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS`, `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`, `CLAUDE_CODE_SSE_PORT`, `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`, `CLAUDE_CODE_STELLAR_DRIFT`, `CLAUDE_CODE_SUBSCRIPTION_TYPE`, `CLAUDE_CODE_SUPERVISED`, `CLAUDE_CODE_SUPPRESS_SESSION_ATTRIBUTION`, `CLAUDE_CODE_SYNC_PLUGINS`, `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`, `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`, `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`, `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`, `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`, `CLAUDE_CODE_SYNC_SESSION_REFS`, `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`, `CLAUDE_CODE_TAGS`, `CLAUDE_CODE_TEE_SDK_STDOUT`, `CLAUDE_CODE_TERMINAL_MCP_TOOLS`, `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`, `CLAUDE_CODE_TEST_FIXTURES_ROOT`, `CLAUDE_CODE_THINKING_DISPLAY_UPDATES`, `CLAUDE_CODE_THISTLE_GREBE`, `CLAUDE_CODE_THRIFTY_SONIC`, `CLAUDE_CODE_TMUX_PREFIX`, `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`, `CLAUDE_CODE_TMUX_SESSION`, `CLAUDE_CODE_TODO_REMINDER_MODE`, `CLAUDE_CODE_TOTAL_TOKENS_REMINDER`, `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_AFTER_USER_TURN`, `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET`, `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC`, `CLAUDE_CODE_TRIGGER_ID`, `CLAUDE_CODE_TUI_JUST_SWITCHED`, `CLAUDE_CODE_TUI_TRIAL`, `CLAUDE_CODE_TURN_UPDATES`, `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`, `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`, `CLAUDE_CODE_USE_COWORK_PLUGINS`, `CLAUDE_CODE_USER_EMAIL`, `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`, `CLAUDE_CODE_WEB_FETCH_AGENT`, `CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR`, `CLAUDE_CODE_WILLOW_TERN`, `CLAUDE_CODE_WISE_COMET`, `CLAUDE_CODE_WORKER_EPOCH`, `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_AGENTS`, `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_TOKENS`, `CLAUDE_CODE_WORKFLOWS`, `CLAUDE_CODE_WORKSPACE_HOST_PATHS`, `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`, `CLAUDE_COWORK_MEMORY_GUIDELINES`, `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`, `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`, `CLAUDE_DEBUG`, `CLAUDE_FORCE_DISPLAY_SURVEY`, `CLAUDE_IMPORT_CONVERSATIONS`, `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`, `CLAUDE_INTERNAL_FC_OVERRIDES`, `CLAUDE_LOCAL_OAUTH_API_BASE`, `CLAUDE_LOCAL_OAUTH_APPS_BASE`, `CLAUDE_LOCAL_OAUTH_CONSOLE_BASE`, `CLAUDE_MEMORY_STORES`, `CLAUDE_PROJECT_UUID`, `CLAUDE_PTY_HEARTBEAT_MS`, `CLAUDE_PTY_HOST_EXEC`, `CLAUDE_PTY_ORPHAN_CHECK_MS`, `CLAUDE_PTY_RECORD`, `CLAUDE_REMOTE_WORKFLOW_ARGS`, `CLAUDE_REMOTE_WORKFLOW_SCRIPT`, `CLAUDE_RUNNER_ACTIVITY_FD`, `CLAUDE_RUNNER_DISABLE_AWAITING_ACTION_OVERRIDE`, `CLAUDE_SECURESTORAGE_CONFIG_DIR`, `CLAUDE_SLOW_FIRST_BYTE_MS`, `CLAUDE_STAGE_FILE_ROOT`, `CLAUDE_TMPDIR`, `CLAUDE_TRUSTED_DEVICE_TOKEN`, `CLAUDE_WORKFLOW_NAME_ONLY`, `CLIPBOARD_NAPI_NODE_PATH`, `CONTAINER_SANDBOX_MOUNT_POINT`, `DEBUG_CLAUDE_AGENT_SDK`, `DEBUG_SDK`, `DEMO_VERSION`, `DISABLE_BRIEF_MODE_STOP_HOOK`, `ENABLE_MCP_LARGE_OUTPUT_FILES`, `IS_SANDBOX`, `LOCAL_BRIDGE`, `MCP_OAUTH_CLIENT_METADATA_URL`, `MCP_TRUNCATION_PROMPT_OVERRIDE`, `MCP_XAA_IDP_CLIENT_SECRET`, `RUNNER_ENVIRONMENT`, `RUNNER_OS`, `RUNNER_RELEASE_IDLE_SESSION_MIN`, `SAFEUSER`, `SDK_NATIVE_BIN`, `SELF_HOSTED_RUNNER_BASE_DIR`, `SELF_HOSTED_RUNNER_CLIENT_LABEL`, `SELF_HOSTED_RUNNER_CONFIGURE_GIT`, `SELF_HOSTED_RUNNER_CONFINE_REPO_SETTINGS`, `SELF_HOSTED_RUNNER_DEBUG_DIR`, `SELF_HOSTED_RUNNER_DEBUG_TOKEN_DIR`, `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`, `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`, `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`, `SELF_HOSTED_RUNNER_DRAIN_WAIT_BG_TASKS_MS`, `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`, `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`, `SELF_HOSTED_RUNNER_EXEC_PATH`, `SELF_HOSTED_RUNNER_HEALTH_PORT`, `SELF_HOSTED_RUNNER_HOOKS_DIR`, `SELF_HOSTED_RUNNER_HOST_CONFIG_SNAPSHOT`, `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`, `SELF_HOSTED_RUNNER_LOCK_TO_ACCOUNT`, `SELF_HOSTED_RUNNER_LOG_FILE`, `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`, `SELF_HOSTED_RUNNER_POOL_SECRET`, `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`, `SELF_HOSTED_RUNNER_PUSH_OUTCOME_ON_RELEASE`, `SELF_HOSTED_RUNNER_RELEASE_IDLE_SESSION_MIN`, `SELF_HOSTED_RUNNER_REMOVE_SESSION_STATE`, `SELF_HOSTED_RUNNER_RETIRE_AT`, `SELF_HOSTED_RUNNER_SESSION_IDLE_MIN`, `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`, `SELF_HOSTED_RUNNER_SESSION_IDLE_SEC`, `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`, `SELF_HOSTED_RUNNER_SIGKILL_TIMEOUT_MS`, `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`, `SELF_HOSTED_RUNNER_TRUST_WORKSPACE`, `SESSION_INGRESS_URL`, `SRT_DEBUG`, `SWE_BENCH_INSTANCE_ID`, `SWE_BENCH_RUN_ID`, `SWE_BENCH_TASK_ID`, `SYSTEM_REMINDER_MEMORY_CONTEXT`, `TEST_ENABLE_SESSION_PERSISTENCE`, `USE_API_CONTEXT_MANAGEMENT`, `USE_LOCAL_OAUTH`, `USE_STAGING_OAUTH`, `VITALS_EMITTER_BIN`, `VOICE_STREAM_BASE_URL`

**Providers: Amazon Bedrock and AWS** (16): `AWS_ACCESS_KEY_ID`, `AWS_CONFIG_FILE`, `AWS_CONTAINER_CREDENTIALS_FULL_URI`, `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`, `AWS_DEFAULT_REGION`, `AWS_ENDPOINT_URL`, `AWS_ENDPOINT_URL_STS`, `AWS_EXECUTION_ENV`, `AWS_LAMBDA_FUNCTION_NAME`, `AWS_PROFILE`, `AWS_REGION`, `AWS_ROLE_ARN`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_SHARED_CREDENTIALS_FILE`, `AWS_WEB_IDENTITY_TOKEN_FILE`

**Providers: Google Vertex AI and Google Cloud** (15): `ANTHROPIC_GOOGLE_CLOUD_BASE_URL`, `ANTHROPIC_GOOGLE_CLOUD_LOCATION`, `ANTHROPIC_GOOGLE_CLOUD_PROJECT`, `ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID`, `CLAUDE_CODE_SKIP_ANTHROPIC_GOOGLE_CLOUD_AUTH`, `CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD`, `CLOUD_ML_REGION`, `CLOUDSDK_CONFIG`, `gcloud_project`, `GCLOUD_PROJECT`, `google_application_credentials`, `GOOGLE_APPLICATION_CREDENTIALS`, `google_cloud_project`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_WORKSTATIONS`

**Providers: Microsoft Foundry and Azure** (1): `AZURE_FUNCTIONS_ENVIRONMENT`

**Providers: gateways** (6): `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`, `CLAUDE_CODE_USE_GATEWAY`, `CLAUDE_GATEWAY_ALLOW_LOOPBACK`, `CLAUDE_GATEWAY_DRAIN_TIMEOUT_MS`, `CLAUDE_GATEWAY_LOG_LEVEL`, `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY`

**Telemetry and observability** (6): `CLAUDE_CODE_BYOC_ENABLE_DATADOG`, `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS`, `CLAUDE_CODE_GB_DISK_CACHE_WHEN_TELEMETRY_OFF`, `CLAUDE_CODE_PERFETTO_TRACE`, `ENABLE_ENHANCED_TELEMETRY_BETA`, `TRACESTATE`

**Network, proxy and TLS** (33): `AGENT_PROXY_AUTH_TOKEN`, `AGENT_PROXY_URL`, `all_proxy`, `ALL_PROXY`, `CCR_AGENT_PROXY_ENABLED`, `CCR_AGENT_PROXY_FRAME_HOSTS`, `CCR_AGENT_PROXY_INCLUDE_HOSTS`, `CCR_AGENT_PROXY_NO_PROXY_LOCAL_ONLY`, `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`, `CCR_AGENT_PROXY_RELAY_MODE`, `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`, `CLAUDE_CODE_AGENT_PROXY_GH_SHIM`, `CLAUDE_CODE_AGENT_PROXY_GIT_CONFIG`, `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER`, `CLAUDE_CODE_HTTP_PROXY`, `CLAUDE_CODE_HTTPS_PROXY`, `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS`, `CLAUDE_CODE_SIMULATE_PROXY_USAGE`, `CLAUDE_CODE_WEBFETCH_USE_CCR_PROXY`, `CLAUDE_CODE_WEBSEARCH_USE_CCR_PROXY`, `CLAUDE_RUNNER_USE_GIT_PROXY`, `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH`, `HOSTALIASES`, `http_proxy`, `https_proxy`, `LOCALDOMAIN`, `no_proxy`, `NODE_EXTRA_CA_CERTS`, `NODE_TLS_REJECT_UNAUTHORIZED`, `RES_OPTIONS`, `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`, `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`, `SSL_CERT_FILE`

**Shell, terminal, OS and CI environment** (153): `__CFBundleIdentifier`, `ALACRITTY_LOG`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `APP_URL`, `APPDATA`, `BROWSER`, `BUILDKITE`, `BUN_CHROME_PATH`, `BUN_INSTALL`, `C9_PID`, `C9_USER`, `CF_PAGES`, `CI`, `CIRCLECI`, `CODER`, `CODER_WORKSPACE_NAME`, `CODESPACES`, `COLORFGBG`, `COLORTERM`, `ComSpec`, `COMSPEC`, `ConEmuANSI`, `ConEmuPID`, `ConEmuTask`, `CURSOR_TRACE_ID`, `DAYTONA_WS_ID`, `DENO_DEPLOYMENT_ID`, `DEVPOD`, `DEVPOD_WORKSPACE_UID`, `DISPLAY`, `DYNO`, `EDITOR`, `FLY_APP_NAME`, `FLY_MACHINE_ID`, `FORCE_CODE_TERMINAL`, `FORCE_COLOR`, `GCM_INTERACTIVE`, `GH_ENTERPRISE_TOKEN`, `GH_HOST`, `GH_TOKEN`, `GIT_ASKPASS`, `GIT_CONFIG_COUNT`, `GIT_CONFIG_GLOBAL`, `GIT_CONFIG_NOSYSTEM`, `GIT_CONFIG_PARAMETERS`, `GIT_CONFIG_SYSTEM`, `GIT_NO_LAZY_FETCH`, `GIT_SSH_COMMAND`, `GIT_TERMINAL_PROMPT`, `GITHUB_ACTION_INPUTS`, `GITHUB_ACTION_PATH`, `GITHUB_ACTIONS`, `GITHUB_ACTOR`, `GITHUB_ACTOR_ID`, `GITHUB_ENTERPRISE_TOKEN`, `GITHUB_ENV`, `GITHUB_EVENT_NAME`, `GITHUB_EVENT_PATH`, `GITHUB_REPOSITORY`, `GITHUB_REPOSITORY_ID`, `GITHUB_REPOSITORY_OWNER`, `GITHUB_REPOSITORY_OWNER_ID`, `GITHUB_TOKEN`, `GITHUB_WORKSPACE`, `GITLAB_CI`, `GITPOD_WORKSPACE_ID`, `GNOME_TERMINAL_SERVICE`, `HISTFILE`, `HOME`, `HOMEDRIVE`, `HOMEPATH`, `HOSTNAME`, `INK_SCREEN_READER`, `INTELLIJ_TERMINAL_COMMAND_BLOCKS`, `INTELLIJ_TERMINAL_COMMAND_BLOCKS_REWORKED`, `ITERM_SESSION_ID`, `JAVA_HOME`, `JAVA_TOOL_OPTIONS`, `K_SERVICE`, `KITTY_WINDOW_ID`, `KONSOLE_VERSION`, `KUBERNETES_SERVICE_HOST`, `LANG`, `LC_ALL`, `LC_TERMINAL`, `LC_TIME`, `LOCALAPPDATA`, `MSYSTEM`, `NETLIFY`, `NO_COLOR`, `NODE_DEBUG`, `NODE_OPTIONS`, `P4PORT`, `PATHEXT`, `PREFIX`, `ProgramData`, `PROGRAMDATA`, `ProgramFiles`, `PROJECT_DOMAIN`, `PWD`, `RAILWAY_ENVIRONMENT_NAME`, `RAILWAY_SERVICE_NAME`, `RENDER`, `REPL_ID`, `REPL_SLUG`, `SESSIONNAME`, `SHELL`, `SPACE_CREATOR_USER_ID`, `SSH_AUTH_SOCK`, `SSH_CLIENT`, `SSH_CONNECTION`, `SSH_TTY`, `STY`, `SUDO_GID`, `SUDO_UID`, `SUDO_USER`, `SystemRoot`, `SYSTEMROOT`, `TEAMCITY_VERSION`, `TERM_PROGRAM_VERSION`, `TERMINAL`, `TERMINAL_EMULATOR`, `TERMINATOR_UUID`, `TERMUX_VERSION`, `TILIX_ID`, `TMPDIR`, `TMUX`, `TMUX_PANE`, `USER`, `USERNAME`, `USERPROFILE`, `UV_THREADPOOL_SIZE`, `VERCEL`, `VISUAL`, `VisualStudioVersion`, `VSCODE_GIT_ASKPASS_MAIN`, `VTE_VERSION`, `WAYLAND_DISPLAY`, `WEBSITE_SITE_NAME`, `WEBSITE_SKU`, `WINDIR`, `WSL_DISTRO_NAME`, `WSL_INTEROP`, `WT_SESSION`, `XDG_CACHE_HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`, `XDG_RUNTIME_DIR`, `XDG_STATE_HOME`, `XTERM_VERSION`, `ZED_TERM`, `ZELLIJ`

**Read only by bundled third-party libraries** (63): `_X_AMZN_TRACE_ID`, `AWS_ACCOUNT_ID`, `AWS_CONTAINER_AUTHORIZATION_TOKEN`, `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`, `AWS_CREDENTIAL_EXPIRATION`, `AWS_CREDENTIAL_SCOPE`, `AWS_EC2_METADATA_DISABLED`, `AWS_LAMBDA_BENCHMARK_MODE`, `AWS_LAMBDA_MAX_CONCURRENCY`, `AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA`, `AWS_LOGIN_CACHE_DIRECTORY`, `AWS_ROLE_SESSION_NAME`, `AZURE_ADDITIONALLY_ALLOWED_TENANTS`, `AZURE_AUTHORITY_HOST`, `AZURE_CLIENT_CERTIFICATE_PASSWORD`, `AZURE_CLIENT_CERTIFICATE_PATH`, `AZURE_CLIENT_SECRET`, `AZURE_CLIENT_SEND_CERTIFICATE_CHAIN`, `AZURE_FEDERATED_TOKEN_FILE`, `AZURE_IDENTITY_DISABLE_MULTITENANTAUTH`, `AZURE_PASSWORD`, `AZURE_POD_IDENTITY_AUTHORITY_HOST`, `AZURE_REGIONAL_AUTHORITY_NAME`, `AZURE_TOKEN_CREDENTIALS`, `AZURE_USERNAME`, `BUF_BIGINT_DISABLE`, `CHOKIDAR_INTERVAL`, `CHOKIDAR_USEPOLLING`, `CLOUD_RUN_JOB`, `DEBUG_AUTH`, `DETECT_GCP_RETRIES`, `FUNCTION_NAME`, `FUNCTION_TARGET`, `GAE_MODULE_NAME`, `GAE_SERVICE`, `GCE_METADATA_HOST`, `GCE_METADATA_IP`, `GIT_PROXY_COMMAND`, `GOOGLE_CLOUD_QUOTA_PROJECT`, `GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES`, `GRACEFUL_FS_PLATFORM`, `GRPC_EXPERIMENTAL_ENABLE_OUTLIER_DETECTION`, `GRPC_NODE_TRACE`, `GRPC_NODE_USE_ALTERNATIVE_RESOLVER`, `GRPC_NODE_VERBOSITY`, `grpc_proxy`, `GRPC_SSL_CIPHER_SUITES`, `GRPC_TRACE`, `GRPC_VERBOSITY`, `K_CONFIGURATION`, `LRU_CACHE_IGNORE_AC_WARNING`, `METADATA_SERVER_DETECTION`, `MSAL_FORCE_REGION`, `no_grpc_proxy`, `OSTYPE`, `OTEL_EXPORTER_OTLP_CERTIFICATE`, `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`, `OTEL_EXPORTER_OTLP_CLIENT_KEY`, `OTEL_EXPORTER_OTLP_INSECURE`, `OTEL_EXPORTER_PROMETHEUS_HOST`, `OTEL_EXPORTER_PROMETHEUS_PORT`, `REGION_NAME`, `TEST_GRACEFUL_FS_GLOBAL_PATCH`

## Prompt caching

The request path makes two decisions from code. The first is whether a request gets `cache_control` markers, which the DISABLE_PROMPT_CACHING* variables control. The second is the TTL those markers carry.

When caching is on, system-prompt blocks that have a cache scope carry `cache_control: {type: "ephemeral"}`, plus `ttl: "1h"` when the resolved TTL is 1 hour; a 5-minute TTL sends no `ttl` field, and globally scoped blocks also carry `scope: "global"`. Message cache markers use the same enable check and the same resolved TTL.

TTL resolution, first match wins:

1. FORCE_PROMPT_CACHING_5M sets 5m.
2. CLAUDE_CODE_PROMPT_CACHE_TTL for main-conversation requests, or CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL for all other requests (`5m` or `1h` only).
3. The settings `promptCacheTtl` / `subagentPromptCacheTtl`.
4. The agent's frontmatter TTL. A `1h` value is skipped while a subscriber is using overage.
5. ENABLE_PROMPT_CACHING_1H, or ENABLE_PROMPT_CACHING_1H_BEDROCK when the provider is Bedrock, sets 1h.
6. Otherwise, non-subscribers and subscribers using overage get 5m. Subscribers get 1h when the request's source is on a remotely configured allowlist, which defaults to the main-conversation sources, and 5m otherwise.

Only step 5's BEDROCK variant depends on the provider. The per-model disables compare against resolved model IDs, as noted per variable.

### `CLAUDE_CODE_PROMPT_CACHE_TTL`

Source: `chunk-dt8bvbsd.js` · offset 179239230 · sha256 `ac07578b…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for main-conversation requests: the interactive main thread, SDK, auto-mode and memory-relevance requests. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the promptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for the main conversation: your interactive, `-p`, and SDK turns, plus the helpers that run inline with them.

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_CACHE_EVICT`

Source: `chunk-dt8bvbsd.js` · offset 179305213 · sha256 `3f7f893f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, and two internal capability checks pass, a request that asks to evict its cache on completion gets the prompt-caching evict beta. Its cache_control marker then carries evict_on_complete: true. When unset, a remote feature flag decides.

**Undocumented**

### `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL`

Source: `chunk-dt8bvbsd.js` · offset 179239261 · sha256 `48e6265c…`

Read as: enum (compared against fixed values). Values: `5m`, `1h`.

From code: Step 2 of TTL resolution, for every request that is not a main-conversation request, such as subagents and background work. Only "5m" and "1h" are accepted, after trimming. Any other value is treated as unset. It wins over the subagentPromptCacheTtl setting, agent frontmatter and ENABLE_PROMPT_CACHING_1H, and loses to FORCE_PROMPT_CACHING_5M.

From docs: Set `5m` or `1h`, the only values Claude Code accepts, to choose the prompt cache TTL for requests outside the main conversation, such as subagents, workflows, and background work.

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_PREFIX_STAGGER_MS`

Source: `chunk-3fxxabdq.js` · offset 188527699 · sha256 `ccab5fa7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From code: Read as an integer. The stagger wait is 0 when DISABLE_PROMPT_CACHING is truthy.

From docs: Upper bound in milliseconds on how long a workflow agent waits for a same-prefix sibling's first response to begin before sending its own first request.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING`

Source: `chunk-dt8bvbsd.js` · offset 179295915 · sha256 `61aa29e3…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false for every model. It is checked before the per-model variables, so it overrides them. That check applies whenever a caller does not pass its own caching flag. No caller in this build passes a literal true; several internal side requests pass a literal false, and a few forward a value that this reference does not trace. It also sets the workflow same-prefix stagger wait to 0. When it or the HAIKU, OPUS, SONNET or FABLE variable is truthy, a warning notice reads "Prompt caching off ({{DISABLED_CACHE_VARS}}), requests will be slower and cost more · unset it to re-enable". {{DISABLED_CACHE_VARS}} is the set variables from that list of five, joined with ", ".

From docs: Set to `1` to disable prompt caching for all models (takes precedence over per-model settings)

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_FABLE`

Source: `chunk-dt8bvbsd.js` · offset 179296217 · sha256 `421b6e33…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-fable-" or equals ANTHROPIC_DEFAULT_FABLE_MODEL after normalization.

From docs: Set to `1` to disable prompt caching for Fable models

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_HAIKU`

Source: `chunk-dt8bvbsd.js` · offset 179295966 · sha256 `3c3759c0…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only for a request whose model equals the resolved small/fast model. That model must also differ from the main-loop model. The check runs only when a small/fast model applies: ANTHROPIC_SMALL_FAST_MODEL or ANTHROPIC_DEFAULT_HAIKU_MODEL is set, or an internal provider/login condition holds.

From docs: Set to `1` to disable prompt caching for Haiku models

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_MYTHOS`

Source: `chunk-dt8bvbsd.js` · offset 179296289 · sha256 `def68dd6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Typed boolean. When truthy, the check that decides whether a request gets prompt-cache markers returns false when the model ID contains "claude-mythos-". The "Prompt caching off" warning notice does not list it.

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

**Undocumented**

### `DISABLE_PROMPT_CACHING_OPUS`

Source: `chunk-dt8bvbsd.js` · offset 179296140 · sha256 `2d455dce…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Opus model: ANTHROPIC_DEFAULT_OPUS_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Opus models", but this check does not match other Opus model IDs.

From docs: Set to `1` to disable prompt caching for Opus models

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_PROMPT_CACHING_SONNET`

Source: `chunk-dt8bvbsd.js` · offset 179296061 · sha256 `f8d4b25c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: When truthy, the check that decides whether a request gets prompt-cache markers returns false only when the request's model ID equals the resolved default Sonnet model: ANTHROPIC_DEFAULT_SONNET_MODEL if set, otherwise the built-in default. The comparison is strict equality. The docs say "for Sonnet models", but this check does not match other Sonnet model IDs.

From docs: Set to `1` to disable prompt caching for Sonnet models

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H`

Source: `chunk-dt8bvbsd.js` · offset 179239518 · sha256 `2c1b2543…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. When truthy, requests with no FORCE_PROMPT_CACHING_5M, no TTL variable, no TTL setting and no agent-frontmatter TTL get the 1-hour TTL. The resolver does not restrict it by provider or model. It is evaluated before the subscriber and overage fallback, so it also applies to non-subscribers and during overage.

From docs: Set to `1` to request a 1-hour prompt cache TTL instead of the default 5 minutes.

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_PROMPT_CACHING_1H_BEDROCK`

Source: `chunk-dt8bvbsd.js` · offset 179239564 · sha256 `805c531a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 5 of TTL resolution. Has the same effect as ENABLE_PROMPT_CACHING_1H, but only when the provider is Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK).

From docs: Deprecated.

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_PROMPT_CACHING_5M`

Source: `chunk-dt8bvbsd.js` · offset 179239148 · sha256 `7e522f80…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From code: Step 1 of TTL resolution. When truthy, every request resolved through the TTL resolver gets the 5-minute TTL, ahead of all TTL variables, settings and agent frontmatter.

From docs: Set to `1` to force the 5-minute prompt cache TTL even when 1-hour TTL would otherwise apply.

Evidence (offsets): caching off notice `chunk-57gge8cv.js` @ 195670199 · cache control builder `chunk-dt8bvbsd.js` @ 179296350 · ttl resolver `chunk-dt8bvbsd.js` @ 179239122 · cache enable check `chunk-dt8bvbsd.js` @ 179295893

Documented: https://code.claude.com/docs/en/env-vars

## Claude Code and Anthropic

### `_CLAUDE_CODE_ASSUME_FIRST_PARTY_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176012743 · sha256 `141c63d2…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 176012743.

**Undocumented**

### `AI_AGENT`

Source: `chunk-0zmst6z2.js` · offset 169932956 · sha256 `53cd51cc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-0zmst6z2.js` offset 169932956.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-j5961fgw.js` · offset 175457455 · sha256 `15d71a5f…` · 26 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 9 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key sent as `X-Api-Key` header.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-j5961fgw.js` · offset 175457516 · sha256 `3298dcb6…` · 18 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176021600 · sha256 `7e406881…` · 47 read sites

Read as: string (trimmed; empty is treated as unset). Values: `https://api-staging.anthropic.com`. Default (from code): `https://api.anthropic.com`.

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the API endpoint to route requests through a proxy or gateway.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BETAS`

Source: `chunk-bjmhhyed.js` · offset 186011308 · sha256 `7f59f23c…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Comma-separated list of additional `anthropic-beta` header values to include in API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-2yxmcerc.js` · offset 198796525 · sha256 `da1f3b83…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198796525.

**Undocumented**

### `ANTHROPIC_CUSTOM_HEADERS`

Source: `chunk-7kwd28ae.js` · offset 176015124 · sha256 `251d5fb7…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Custom headers to add to requests (`Name: Value` format, newline-separated for multiple headers).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION`

Source: `chunk-7kwd28ae.js` · offset 175986022 · sha256 `365f3ebd…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID to add as a custom entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_DESCRIPTION`

Source: `chunk-7kwd28ae.js` · offset 175986168 · sha256 `9a56865d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CUSTOM_MODEL_OPTION_NAME`

Source: `chunk-7kwd28ae.js` · offset 175986108 · sha256 `e9d17412…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the custom model entry in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL`

Source: `chunk-1watee42.js` · offset 192696754 · sha256 `bab142cc…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Model ID that the `fable` alias resolves to, and the ID Claude Code recognizes as a Fable model for automatic model fallback on third-party providers.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_DESCRIPTION`

Source: `chunk-7kwd28ae.js` · offset 175972984 · sha256 `a2a27d85…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Fable model`.

From docs: Display description for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_FABLE_MODEL_NAME`

Source: `chunk-7kwd28ae.js` · offset 175972947 · sha256 `c1c1562e…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Fable model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-1watee42.js` · offset 192696716 · sha256 `bcacaca2…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION`

Source: `chunk-7kwd28ae.js` · offset 175977545 · sha256 `a6617ffb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `Custom Haiku model`.

From docs: Display description for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`

Source: `chunk-7kwd28ae.js` · offset 175977508 · sha256 `ede3ae9d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Haiku model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_MODEL`

Source: `chunk-bjmhhyed.js` · offset 186014524 · sha256 `5f40fa89…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model that new sessions start on by default.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-1watee42.js` · offset 192696679 · sha256 `bc028f5f…` · 18 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-7kwd28ae.js` · offset 175974374 · sha256 `3929d889…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-7kwd28ae.js` · offset 175974338 · sha256 `d8c31deb…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Opus model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-1watee42.js` · offset 192696641 · sha256 `f81df586…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION`

Source: `chunk-7kwd28ae.js` · offset 175972184 · sha256 `061abab4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Display description for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`

Source: `chunk-7kwd28ae.js` · offset 175972146 · sha256 `3fb9026d…`

Read as: string (trimmed; empty is treated as unset).

From docs: Display name for the pinned Sonnet model in the `/model` picker.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ENVIRONMENT_ID`

Source: `chunk-yn3me4dk.js` · offset 170047927 · sha256 `043c3045…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 170047927.

**Undocumented**

### `ANTHROPIC_ENVIRONMENT_KEY`

Source: `chunk-yn3me4dk.js` · offset 170048041 · sha256 `1f95ee13…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 170048041.

**Undocumented**

### `ANTHROPIC_FEDERATION_RULE_ID`

Source: `chunk-yrp3en1n.js` · offset 172356138 · sha256 `3c95f8b4…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Federation rule ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_IDENTITY_TOKEN`

Source: `chunk-psnfk08g.js` · offset 175450183 · sha256 `620af437…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-psnfk08g.js` offset 175450183.

**Undocumented**

### `ANTHROPIC_IDENTITY_TOKEN_FILE`

Source: `chunk-psnfk08g.js` · offset 175449566 · sha256 `7393e7a8…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-psnfk08g.js` offset 175449566.

**Undocumented**

### `ANTHROPIC_LOG`

Source: `chunk-yn3me4dk.js` · offset 169997152 · sha256 `06f2d8cc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 169997152.

**Undocumented**

### `ANTHROPIC_MODEL`

Source: `chunk-bjmhhyed.js` · offset 186104383 · sha256 `9effd817…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Name of the model setting to use (see Model Configuration)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_ORGANIZATION_ID`

Source: `chunk-yrp3en1n.js` · offset 172356080 · sha256 `cf9ebbc1…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Organization ID for Workload Identity Federation.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_PROFILE`

Source: `chunk-2yxmcerc.js` · offset 198796712 · sha256 `f029bb2b…` · 11 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

From docs: Name of the Anthropic profile to authenticate with, such as one created by `ant auth login` or by signing in to a Console account without an API key.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SCOPE`

Source: `chunk-psnfk08g.js` · offset 175449866 · sha256 `b8f45612…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-psnfk08g.js` offset 175449866.

**Undocumented**

### `ANTHROPIC_SERVICE_ACCOUNT_ID`

Source: `chunk-psnfk08g.js` · offset 175449779 · sha256 `1edce0a3…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-psnfk08g.js` offset 175449779.

**Undocumented**

### `ANTHROPIC_SESSION_ID`

Source: `chunk-yn3me4dk.js` · offset 170047973 · sha256 `170b48e3…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 170047973.

**Undocumented**

### `ANTHROPIC_SMALL_FAST_MODEL`

Source: `chunk-dt8bvbsd.js` · offset 178427243 · sha256 `263f23ef…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: \[DEPRECATED] Name of Haiku-class model for background tasks

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_UNIX_SOCKET`

Source: `chunk-j5961fgw.js` · offset 175457784 · sha256 `cd7cb418…` · 32 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 21 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-j5961fgw.js` offset 175457784.

**Undocumented**

### `ANTHROPIC_WEBHOOK_SIGNING_KEY`

Source: `chunk-yn3me4dk.js` · offset 170109105 · sha256 `86416245…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 170109105.

**Undocumented**

### `ANTHROPIC_WORK_ID`

Source: `chunk-yn3me4dk.js` · offset 170047884 · sha256 `fcabfb50…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 170047884.

**Undocumented**

### `ANTHROPIC_WORKSPACE_ID`

Source: `chunk-yrp3en1n.js` · offset 172356008 · sha256 `21f00b3c…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Workspace ID for workload identity federation.

Documented: https://code.claude.com/docs/en/env-vars

### `API_FORCE_IDLE_TIMEOUT`

Source: `chunk-s79sfps3.js` · offset 171817559 · sha256 `a01398ac…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the 5-minute body idle timeout that aborts a streaming model response when no bytes arrive.

Documented: https://code.claude.com/docs/en/env-vars

### `API_TIMEOUT_MS`

Source: `chunk-7kwd28ae.js` · offset 176015837 · sha256 `a888de25…` · 6 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Timeout for API requests in milliseconds (default: 600000, or 10 minutes; maximum: 2147483647).

Documented: https://code.claude.com/docs/en/env-vars

### `AUTOMODE_DECISION_LOG`

Source: `chunk-dt8bvbsd.js` · offset 179785959 · sha256 `1e7c0dc0…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 179785959.

**Undocumented**

### `BASH_DEFAULT_TIMEOUT_MS`

Source: `chunk-nrvavt8a.js` · offset 175412815 · sha256 `553fd156…`

Read as: string (raw value; further parsing not traced).

From docs: Default timeout for long-running bash commands (default: 120000, or 2 minutes)

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-bk6zh9t3.js` · offset 177015702 · sha256 `0e7a1c0d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_TIMEOUT_MS`

Source: `chunk-nrvavt8a.js` · offset 175412929 · sha256 `b63207f0…`

Read as: string (raw value; further parsing not traced).

From docs: Maximum timeout the model can set for long-running bash commands (default: 600000, or 10 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `BUGHUNTER_DEV_BUNDLE_B64`

Source: `chunk-4b9m8jd6.js` · offset 188933318 · sha256 `9dd8b661…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-4b9m8jd6.js` offset 188933318.

**Undocumented**

### `BUGHUNTER_FLEET_SIZE`

Source: `chunk-0t5x1phh.js` · offset 184389854 · sha256 `73c58ba3…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-0t5x1phh.js` offset 184389854.

**Undocumented**

### `CCR_ENABLE_BUNDLE`

Source: `chunk-858j3az7.js` · offset 192537663 · sha256 `19d54f8c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-858j3az7.js` offset 192537663.

**Undocumented**

### `CCR_FORCE_BUNDLE`

Source: `chunk-858j3az7.js` · offset 192537547 · sha256 `3071d65d…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force `claude --cloud` to bundle and upload your local repository instead of cloning from its remote

Documented: https://code.claude.com/docs/en/env-vars

### `CCR_ON_BRANCH_DEFAULT_GUARD`

Source: `chunk-dt8bvbsd.js` · offset 180269128 · sha256 `2763e2c9…` · 2 read sites

Read as: enum (compared against fixed values). Values: `enforce`, `observe`, `off`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 180269128.

**Undocumented**

### `CCR_SESSION_PROFILE`

Source: `chunk-9436rtsm.js` · offset 200578683 · sha256 `4ea4f741…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9436rtsm.js` offset 200578683.

**Undocumented**

### `CCR_SHR_SSE_HINTS`

Source: `chunk-z62nk1ek.js` · offset 181726729 · sha256 `927ca514…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62nk1ek.js` offset 181726729.

**Undocumented**

### `CCR_SPAWN_TIMESTAMP_MS`

Source: `chunk-1meqveg3.js` · offset 171261097 · sha256 `628d65dc…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-1meqveg3.js` offset 171261097.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-c6w8b82y.js` · offset 186501724 · sha256 `d6342530…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-c6w8b82y.js` offset 186501724.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-ad1vsmtp.js` · offset 197399064 · sha256 `2959d146…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-ad1vsmtp.js` · offset 197399018 · sha256 `3d44032d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-dt8bvbsd.js` · offset 177347072 · sha256 `0da64453…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177347072.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-7kwd28ae.js` · offset 176014582 · sha256 `eab56788…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176014582.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-dt8bvbsd.js` · offset 178707875 · sha256 `763e9be8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-4jbzqc2f.js` · offset 203015655 · sha256 `af756a02…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-7w9ds1e8.js` · offset 184298992 · sha256 `8c91e3c2…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unknown`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7w9ds1e8.js` offset 184298992.

**Undocumented**

### `CLAUDE_AGENTS_AUTO_RELAUNCHED_AT`

Source: `chunk-zyckxzm1.js` · offset 186908975 · sha256 `f44615b2…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-zyckxzm1.js` offset 186908975.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-rd03gc9h.js` · offset 177210075 · sha256 `05b80a80…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-rd03gc9h.js` offset 177210075.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-p96ker9q.js` · offset 176625336 · sha256 `bd85f0b2…` · 6 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-p96ker9q.js` offset 176625336.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-wyjryvm7.js` · offset 183685087 · sha256 `159c9a8a…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true.

From docs: Stall timeout in milliseconds for subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-7x0th3b7.js` · offset 183924433 · sha256 `ddd26c0c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-dt8bvbsd.js` · offset 178330852 · sha256 `0e787485…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_PREPARK_MS`

Source: `chunk-m200zvyg.js` · offset 172588440 · sha256 `7763481a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `50`.

From docs: In screen reader mode, how many milliseconds Claude Code waits, with the cursor at the start of the line, before it writes a new or changed line.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_SCREEN_READER`

Source: `chunk-m200zvyg.js` · offset 172587076 · sha256 `e9ec58b6…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to render screen-reader friendly output: flat text without decorative borders or animations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AX_STARTUP_QUIET_MS`

Source: `chunk-m200zvyg.js` · offset 172588313 · sha256 `c9ed3776…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

From docs: In screen reader mode, how many milliseconds Claude Code holds the first interface render after the startup confirmation line, so your screen reader can speak the line in full before new output interrupts it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-b1tfggtv.js` · offset 170272571 · sha256 `5509dbb8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-8snes1yz.js` · offset 172385841 · sha256 `b23ee675…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8snes1yz.js` offset 172385841.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-jf0crvfg.js` · offset 199072945 · sha256 `761beb70…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `daemon`.

Undocumented; read at `chunk-jf0crvfg.js` offset 199072945.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-322ff997.js` · offset 182664152 · sha256 `b9127893…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-322ff997.js` offset 182664152.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-yrp3en1n.js` · offset 172360841 · sha256 `479c8291…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172360841.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-yrp3en1n.js` · offset 172360778 · sha256 `75c57711…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172360778.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-dt8bvbsd.js` · offset 177978659 · sha256 `4c46686e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `worktree`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 177978659.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-bjmhhyed.js` · offset 186000066 · sha256 `09901b5e…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-bjmhhyed.js` offset 186000066.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-bjmhhyed.js` · offset 186050030 · sha256 `e616699a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-bjmhhyed.js` offset 186050030.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-n6mmnfpy.js` · offset 186963019 · sha256 `dbda7267…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n6mmnfpy.js` offset 186963019.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-c1pb53de.js` · offset 195784158 · sha256 `5cac6c16…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c1pb53de.js` offset 195784158.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-c1pb53de.js` · offset 195784374 · sha256 `47f681f8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c1pb53de.js` offset 195784374.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-bjmhhyed.js` · offset 185999831 · sha256 `76fa2fb1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-bjmhhyed.js` offset 185999831.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-n6mmnfpy.js` · offset 186963094 · sha256 `1fcb7e87…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n6mmnfpy.js` offset 186963094.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-ad1vsmtp.js` · offset 197638434 · sha256 `2c2da5b5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `spare`.

Undocumented; read at `chunk-ad1vsmtp.js` offset 197638434.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-c1pb53de.js` · offset 195783121 · sha256 `4fcf9acc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `45000`.

Undocumented; read at `chunk-c1pb53de.js` offset 195783121.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-n6mmnfpy.js` · offset 186962187 · sha256 `d9c55f29…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-n6mmnfpy.js` offset 186962187.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-k7pkve2r.js` · offset 190746362 · sha256 `733dae68…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-k7pkve2r.js` offset 190746362.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-eenpqsaj.js` · offset 203875510 · sha256 `76f29ce6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-eenpqsaj.js` offset 203875510.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-eenpqsaj.js` · offset 203875634 · sha256 `3d9adfbe…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-eenpqsaj.js` offset 203875634.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-zasza72r.js` · offset 186398373 · sha256 `2876ad7c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zasza72r.js` offset 186398373.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-eenpqsaj.js` · offset 203875557 · sha256 `03171b60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-eenpqsaj.js` offset 203875557.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-eenpqsaj.js` · offset 203875596 · sha256 `4103eaa4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-eenpqsaj.js` offset 203875596.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-eenpqsaj.js` · offset 203875468 · sha256 `78c12cd2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-eenpqsaj.js` offset 203875468.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-eenpqsaj.js` · offset 203875413 · sha256 `0ed49f22…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 5 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-eenpqsaj.js` offset 203875413.

**Undocumented**

### `CLAUDE_BYTE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-7kwd28ae.js` · offset 176024783 · sha256 `08bc2317…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for the byte-level streaming idle watchdog; when set, it takes precedence over `CLAUDE_STREAM_IDLE_TIMEOUT_MS` for that watchdog and leaves the event-level watchdog unchanged.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CHROME_CLASSIFIER_FLOOR`

Source: `chunk-vtw55p3q.js` · offset 183564800 · sha256 `115bb892…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-vtw55p3q.js` offset 183564800.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-xr7xn5z8.js` · offset 187302851 · sha256 `9ab1f9d7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187302851.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-xr7xn5z8.js` · offset 187302658 · sha256 `d8cf5ff5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187302658.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-z9fk3sy2.js` · offset 195998210 · sha256 `ceff9aca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-29hpxtvj.js` · offset 183987891 · sha256 `8ebd36d8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-29hpxtvj.js` offset 183987891.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-29hpxtvj.js` · offset 183987847 · sha256 `303f0d24…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-29hpxtvj.js` offset 183987847.

**Undocumented**

### `CLAUDE_CODE_ACCESSIBILITY`

Source: `chunk-qbx8et3j.js` · offset 183087130 · sha256 `78c0f256…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `0`.

From docs: Set to `1` to keep the native terminal cursor visible and disable the inverted-text cursor indicator.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ACCOUNT_TAGGED_ID`

Source: `chunk-rv11zjj6.js` · offset 174135967 · sha256 `755576cb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rv11zjj6.js` offset 174135967.

**Undocumented**

### `CLAUDE_CODE_ACCOUNT_UUID`

Source: `chunk-xr7xn5z8.js` · offset 187305759 · sha256 `6e8b00aa…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187305759.

**Undocumented**

### `CLAUDE_CODE_ACT_DONT_REDERIVE`

Source: `chunk-dt8bvbsd.js` · offset 178756293 · sha256 `61dc2948…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178756293.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-m200zvyg.js` · offset 172807992 · sha256 `bccfb10f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172807992.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-dt8bvbsd.js` · offset 177925663 · sha256 `ecdc6b1d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-7kwd28ae.js` · offset 176015233 · sha256 `619e15d7…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 176015233.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-z825d7fd.js` · offset 193598921 · sha256 `c893ec8f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193598921.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-m200zvyg.js` · offset 172786025 · sha256 `dcf206a0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172786025.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-rd03gc9h.js` · offset 177210122 · sha256 `2ed724a7…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-rd03gc9h.js` offset 177210122.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-cdkwzv6s.js` · offset 185098386 · sha256 `2650615c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ALTGR_AS_TEXT`

Source: `chunk-qbx8et3j.js` · offset 183027647 · sha256 `43919966…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-qbx8et3j.js` offset 183027647.

**Undocumented**

### `CLAUDE_CODE_ALWAYS_ENABLE_EFFORT`

Source: `chunk-7gbsnfct.js` · offset 173562546 · sha256 `47ef8a02…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the effort parameter with every request, even when Claude Code does not recognize the model ID as effort-capable.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AMBER_ASTROLABE`

Source: `chunk-8p6r0vhj.js` · offset 173588622 · sha256 `8e2e5701…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173588622.

**Undocumented**

### `CLAUDE_CODE_API_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176156977 · sha256 `ffa9d202…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176156977.

**Undocumented**

### `CLAUDE_CODE_API_KEY_FILE_DESCRIPTOR`

Source: `chunk-j5961fgw.js` · offset 175457634 · sha256 `571c81f2…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-j5961fgw.js` offset 175457634.

**Undocumented**

### `CLAUDE_CODE_API_KEY_HELPER_TTL_MS`

Source: `chunk-m200zvyg.js` · offset 172999245 · sha256 `99a8a679…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval in milliseconds at which credentials should be refreshed (when using `apiKeyHelper`)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-2f6s2wyb.js` · offset 176768767 · sha256 `e42ef07b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2f6s2wyb.js` offset 176768767.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSETS`

Source: `chunk-2f6s2wyb.js` · offset 176769114 · sha256 `f6d17a02…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-2f6s2wyb.js` offset 176769114.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-44v385xj.js` · offset 199439785 · sha256 `775a16f7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK`

Source: `chunk-1de0ztpn.js` · offset 184107819 · sha256 `745c4305…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1de0ztpn.js` offset 184107819.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_FAST_ACK_FIXED`

Source: `chunk-1de0ztpn.js` · offset 184108360 · sha256 `9a7789ac…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1de0ztpn.js` offset 184108360.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENT_RESPONDER`

Source: `chunk-1de0ztpn.js` · offset 184096392 · sha256 `782008f7…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-1de0ztpn.js` offset 184096392.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_COMMENTS`

Source: `chunk-a0prsjbb.js` · offset 183489694 · sha256 `83d5f67c…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude reading and replying to comments on an artifact.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_COMMENTS_AUTOREACT`

Source: `chunk-1de0ztpn.js` · offset 184107718 · sha256 `84cec711…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to stop Claude replying on its own to comments sent to it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_DB`

Source: `chunk-m0rn3jqw.js` · offset 185277621 · sha256 `46958bfd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-m0rn3jqw.js` offset 185277621.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DB_STR_REPLACE`

Source: `chunk-m0rn3jqw.js` · offset 185277681 · sha256 `246859d1…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-m0rn3jqw.js` offset 185277681.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_DELETE`

Source: `chunk-77sjvqp3.js` · offset 185475987 · sha256 `c864f413…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-77sjvqp3.js` offset 185475987.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_FRESH_READ`

Source: `chunk-0y82eag8.js` · offset 190274314 · sha256 `18d08d8c…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-0y82eag8.js` offset 190274314.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_HOT`

Source: `chunk-p96ker9q.js` · offset 176585039 · sha256 `6f57a8ce…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-p96ker9q.js` offset 176585039.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_MULTI_FILE`

Source: `chunk-p96ker9q.js` · offset 176584727 · sha256 `2cf3d5b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-p96ker9q.js` offset 176584727.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPEN_ACTION`

Source: `chunk-h3wy8ja5.js` · offset 185490043 · sha256 `e90603dd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-h3wy8ja5.js` offset 185490043.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_OPENING_PREFETCH`

Source: `chunk-dt8bvbsd.js` · offset 180413956 · sha256 `568a00a5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180413956.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PATH_PIN`

Source: `chunk-h3wy8ja5.js` · offset 185491990 · sha256 `9e1bd820…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-h3wy8ja5.js` offset 185491990.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PIN`

Source: `chunk-77sjvqp3.js` · offset 185481437 · sha256 `2693918e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-77sjvqp3.js` offset 185481437.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PRESENCE`

Source: `chunk-7h79fvx3.js` · offset 184220358 · sha256 `0303b2b0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-7h79fvx3.js` offset 184220358.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_PREVIEW`

Source: `chunk-39zdd00d.js` · offset 185316159 · sha256 `713c0eb8…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185316159.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_QUICKSTART`

Source: `chunk-39zdd00d.js` · offset 185337770 · sha256 `2b007556…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185337770.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_START_KIT`

Source: `chunk-dtgthb8j.js` · offset 188265918 · sha256 `e7c123b9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dtgthb8j.js` offset 188265918.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TOOLSET`

Source: `chunk-scmzrf2t.js` · offset 176439524 · sha256 `9f5b8208…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-scmzrf2t.js` offset 176439524.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CATALOG`

Source: `chunk-39zdd00d.js` · offset 185337703 · sha256 `9ec5c026…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185337703.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPE_CLOUD_CREATE`

Source: `chunk-39zdd00d.js` · offset 185328193 · sha256 `2ddf902e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185328193.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_TYPES`

Source: `chunk-39zdd00d.js` · offset 185328134 · sha256 `d3757745…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185328134.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VERIFY`

Source: `chunk-39zdd00d.js` · offset 185313672 · sha256 `835f81cd…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185313672.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-m200zvyg.js` · offset 172765944 · sha256 `c569a74f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172765944.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_ANNOUNCEMENT`

Source: `chunk-dt8bvbsd.js` · offset 178249232 · sha256 `4d5b229d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178249232.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_HEADER`

Source: `chunk-q2t02exe.js` · offset 173396247 · sha256 `0ccadf30…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to omit the attribution block, which carries the client version and a prompt fingerprint, from the start of the system prompt.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTH_FAIL_EXIT_MS`

Source: `chunk-m200zvyg.js` · offset 173023462 · sha256 `46d1eca9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-m200zvyg.js` offset 173023462.

**Undocumented**

### `CLAUDE_CODE_AUTO_BACKGROUND_WORKER_CHECKIN_SECONDS`

Source: `chunk-dt8bvbsd.js` · offset 180820271 · sha256 `0cbb69ce…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 86400, digitsOnly true.

From docs: When `CLAUDE_AUTO_BACKGROUND_TASKS` is enabled, seconds between reminders to Claude to check on background subagents that are still running.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-dt8bvbsd.js` · offset 178328571 · sha256 `042de733…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_CONNECT_IDE`

Source: `chunk-c2fy6cgt.js` · offset 176851187 · sha256 `5bc23d1b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Override automatic IDE connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-dt8bvbsd.js` · offset 178660643 · sha256 `a472a5b1…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASALT_COVE`

Source: `chunk-8p6r0vhj.js` · offset 173587555 · sha256 `38275e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173587555.

**Undocumented**

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-7kwd28ae.js` · offset 175931128 · sha256 `b0ab3da3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175931128.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-7kwd28ae.js` · offset 175823140 · sha256 `eb4dddf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175823140.

**Undocumented**

### `CLAUDE_CODE_BASH_EDIT_DIFF`

Source: `chunk-dt8bvbsd.js` · offset 180879579 · sha256 `9d0ca4a0…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off the diff of the files that changed while a Bash command ran, or `1` to record it in every permission mode.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASH_OUTPUT_AUDIENCE_NOTE`

Source: `chunk-dt8bvbsd.js` · offset 178714571 · sha256 `83e24132…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178714571.

**Undocumented**

### `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR`

Source: `chunk-dt8bvbsd.js` · offset 180927247 · sha256 `5fd05623…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180927247.

**Undocumented**

### `CLAUDE_CODE_BENCH_LIVE_COUNTS`

Source: `chunk-qbx8et3j.js` · offset 183151626 · sha256 `bb39fa45…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qbx8et3j.js` offset 183151626.

**Undocumented**

### `CLAUDE_CODE_BG_TASKS_REPORT_RUNNING`

Source: `chunk-z825d7fd.js` · offset 193479622 · sha256 `daf2d2c7…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to make a non-interactive session report an idle status to its host at every turn end, even while background work is still running.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BISON_CAIRN`

Source: `chunk-8p6r0vhj.js` · offset 173588709 · sha256 `a636f61b…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173588709.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-dt8bvbsd.js` · offset 178330898 · sha256 `deb6881a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178330898.

**Undocumented**

### `CLAUDE_CODE_BREEZY_HORIZON`

Source: `chunk-8p6r0vhj.js` · offset 173590478 · sha256 `20ed664c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173590478.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-2f6s2wyb.js` · offset 176768852 · sha256 `8e5b73c3…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2f6s2wyb.js` offset 176768852.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-yrp3en1n.js` · offset 172369817 · sha256 `30df26bd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yrp3en1n.js` offset 172369817.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-7kwd28ae.js` · offset 175656683 · sha256 `07c79987…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175656683.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-wdstsrd6.js` · offset 172347570 · sha256 `4dc7d695…`

Read as: enum (compared against fixed values). Values: `1`, `spent`.

Undocumented; read at `chunk-wdstsrd6.js` offset 172347570.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-z825d7fd.js` · offset 193882257 · sha256 `6bc37768…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z825d7fd.js` offset 193882257.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-z825d7fd.js` · offset 193882413 · sha256 `c1baf9db…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z825d7fd.js` offset 193882413.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-dt8bvbsd.js` · offset 177706624 · sha256 `a0321c61…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177706624.

**Undocumented**

### `CLAUDE_CODE_BRIEF`

Source: `chunk-6b2yytep.js` · offset 193212337 · sha256 `dfd2bbc1…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-6b2yytep.js` offset 193212337.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-gjvcnwpw.js` · offset 184498417 · sha256 `fbf235f3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gjvcnwpw.js` offset 184498417.

**Undocumented**

### `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE`

Source: `chunk-qbx8et3j.js` · offset 183027304 · sha256 `172bb7ad…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `0` to make Claude Code read the `0x08` byte, also written `^H`, as plain Backspace, or `1` to read it as Ctrl+Backspace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BUBBLEWRAP`

Source: `chunk-jf0crvfg.js` · offset 199078285 · sha256 `cebdad4c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-jf0crvfg.js` offset 199078285.

**Undocumented**

### `CLAUDE_CODE_CCR_EARLY_HYDRATE_PREFETCH`

Source: `chunk-bjmhhyed.js` · offset 186066051 · sha256 `74fe0821…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-bjmhhyed.js` offset 186066051.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-ccz3kqt0.js` · offset 175261615 · sha256 `54105beb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `tag`.

Undocumented; read at `chunk-ccz3kqt0.js` offset 175261615.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-2yxmcerc.js` · offset 198961940 · sha256 `0bb57284…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-xr7xn5z8.js` · offset 187307437 · sha256 `a2951440…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187307437.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-0t5x1phh.js` · offset 184390707 · sha256 `20834deb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0t5x1phh.js` offset 184390707.

**Undocumented**

### `CLAUDE_CODE_COLD_COMPACT`

Source: `chunk-dt8bvbsd.js` · offset 179201660 · sha256 `f38286b5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179201660.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-7kwd28ae.js` · offset 176014499 · sha256 `31dd4973…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176014499.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_EXTRA_TOOLS`

Source: `chunk-6b2yytep.js` · offset 193212105 · sha256 `689a77c0…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-6b2yytep.js` offset 193212105.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_FORCE_WORKER_INHERIT_MODEL`

Source: `chunk-4e7z6rdh.js` · offset 176787299 · sha256 `072440a5…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4e7z6rdh.js` offset 176787299.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-fgqfhckb.js` · offset 176776355 · sha256 `0483ada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-fgqfhckb.js` offset 176776355.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_WORKER_CHECKIN_SECONDS`

Source: `chunk-dt8bvbsd.js` · offset 180820181 · sha256 `43b64778…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 86400, digitsOnly true.

Undocumented; read at `chunk-dt8bvbsd.js` offset 180820181.

**Undocumented**

### `CLAUDE_CODE_COWORK_FRAME_ARTIFACTS`

Source: `chunk-h9fx0tjr.js` · offset 170547021 · sha256 `61849089…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-h9fx0tjr.js` offset 170547021.

**Undocumented**

### `CLAUDE_CODE_COZY_TEAPOT`

Source: `chunk-8p6r0vhj.js` · offset 173588182 · sha256 `227ab582…`

Read as: enum (compared against fixed values). Values: `strict`, `relaxed`.

Undocumented; read at `chunk-8p6r0vhj.js` offset 173588182.

**Undocumented**

### `CLAUDE_CODE_CUSTOM_OAUTH_URL`

Source: `chunk-nfwnrvq3.js` · offset 170358378 · sha256 `fd19aaca…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nfwnrvq3.js` offset 170358378.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-m200zvyg.js` · offset 172878280 · sha256 `920d06cc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172878280.

**Undocumented**

### `CLAUDE_CODE_DD_ERROR_TRACKING_FLUSH_INTERVAL_MS`

Source: `chunk-trdrkg7h.js` · offset 173431049 · sha256 `edc9c0e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-trdrkg7h.js` offset 173431049.

**Undocumented**

### `CLAUDE_CODE_DEBUG_LOG_LEVEL`

Source: `chunk-brafns17.js` · offset 170309675 · sha256 `38902a64…`

Read as: string (trimmed; empty is treated as unset).

From docs: Minimum log level written to the debug log file.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_LOGS_DIR`

Source: `chunk-brafns17.js` · offset 170310807 · sha256 `55275582…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the debug log file path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DEBUG_REPAINTS`

Source: `chunk-qbx8et3j.js` · offset 183153316 · sha256 `8e87d2bc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qbx8et3j.js` offset 183153316.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-qbx8et3j.js` · offset 183194961 · sha256 `a88756b2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qbx8et3j.js` offset 183194961.

**Undocumented**

### `CLAUDE_CODE_DESIGN_OAUTH_CLIENT_ID`

Source: `chunk-qy31x6h6.js` · offset 189129285 · sha256 `27ea3afb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-qy31x6h6.js` offset 189129285.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-h9fx0tjr.js` · offset 170542968 · sha256 `d9749d38…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-h9fx0tjr.js` offset 170542968.

**Undocumented**

### `CLAUDE_CODE_DIAGNOSTICS_FILE`

Source: `chunk-5hwzts03.js` · offset 170540689 · sha256 `b7d882f2…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5hwzts03.js` offset 170540689.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_CHAIN`

Source: `chunk-7kwd28ae.js` · offset 176087517 · sha256 `56bfb40a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 176087517.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_DISABLE_ANCHORING`

Source: `chunk-v2rtz32c.js` · offset 189540567 · sha256 `7387b96c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-v2rtz32c.js` offset 189540567.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_ENGINE`

Source: `chunk-7kwd28ae.js` · offset 176086784 · sha256 `989cc745…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176086784.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_FFWD`

Source: `chunk-7kwd28ae.js` · offset 176087410 · sha256 `13bc5703…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176087410.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_GIT`

Source: `chunk-9yybzjm7.js` · offset 184641615 · sha256 `d2f8f14c…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yybzjm7.js` offset 184641615.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_STREAM`

Source: `chunk-7kwd28ae.js` · offset 176087464 · sha256 `1e3d7295…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176087464.

**Undocumented**

### `CLAUDE_CODE_DISABLE_1M_CONTEXT`

Source: `chunk-m200zvyg.js` · offset 172715330 · sha256 `22034a03…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable 1M context window support.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING`

Source: `chunk-m200zvyg.js` · offset 172722229 · sha256 `d1bbe95e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable adaptive reasoning on Opus 4.6 and Sonnet 4.6 and fall back to the fixed thinking budget controlled by `MAX_THINKING_TOKENS`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADMIN_ENV_UNION`

Source: `chunk-cd3sgqch.js` · offset 171022293 · sha256 `7409366c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from merging managed settings `env` blocks per key across admin sources, so only the highest-priority source's whole `env` block applies, as before v2.1.223.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ADVISOR_TOOL`

Source: `chunk-7kwd28ae.js` · offset 175802350 · sha256 `31f9f385…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the advisor tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AGENT_VIEW`

Source: `chunk-rd03gc9h.js` · offset 177209006 · sha256 `94319e32…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off background agents and agent view: `claude agents`, `--bg`, `/background`, and the on-demand supervisor.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN`

Source: `chunk-2p1kp6xr.js` · offset 173443878 · sha256 `52146969…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fullscreen rendering and use the classic main-screen renderer.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ATTACHMENTS`

Source: `chunk-7kwd28ae.js` · offset 176032986 · sha256 `2730825f…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable attachment processing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AUTO_MEMORY`

Source: `chunk-m200zvyg.js` · offset 172846170 · sha256 `e9ae94aa…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable auto memory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_AWAITING_USER_IDLE`

Source: `chunk-cg1cda1q.js` · offset 177024003 · sha256 `17da4fb8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cg1cda1q.js` offset 177024003.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS`

Source: `chunk-vszf2vnh.js` · offset 176365077 · sha256 `8e9ee151…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all background task functionality, including the `run_in_background` parameter on Bash and subagent tools, auto-backgrounding, and the Ctrl+B shortcut

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_EXIT_HANDOFF`

Source: `chunk-4wxgmy12.js` · offset 184409263 · sha256 `e35978cf…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop a background session's running background shell commands, dynamic workflows, and, as of v2.1.198, background subagents when the supervisor stops, restarts, or updates that session's process, instead of handing them to the session's next process.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-dt8bvbsd.js` · offset 180859977 · sha256 `c60d8030…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BUNDLED_SKILLS`

Source: `chunk-0czesz5f.js` · offset 176760221 · sha256 `53652e84…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the skills and workflows included with Claude Code: bundled skills and workflows are removed entirely, while built-in commands like `/init` stay typable but are hidden from the model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CFC_PROMPT`

Source: `chunk-7kwd28ae.js` · offset 175670417 · sha256 `6abbe374…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to keep the Claude in Chrome browser tools available while omitting the Chrome section of the system prompt and the `/claude-in-chrome` bundled skill.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_API_SKILL`

Source: `chunk-daa108e6.js` · offset 185816897 · sha256 `e1894d50…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-daa108e6.js` offset 185816897.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_CODE_SKILL`

Source: `chunk-daa108e6.js` · offset 185817040 · sha256 `caa69eea…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-daa108e6.js` offset 185817040.

**Undocumented**

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-dt8bvbsd.js` · offset 177929228 · sha256 `a80ab294…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CRON`

Source: `chunk-a8v33bcs.js` · offset 176375300 · sha256 `d2e34e85…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable scheduled tasks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_DIR_SYNC`

Source: `chunk-z825d7fd.js` · offset 193701688 · sha256 `a91765c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193701688.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-6b5jn77e.js` · offset 172326552 · sha256 `47a42445…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_EXPLORE_INHERIT_CAP`

Source: `chunk-dt8bvbsd.js` · offset 177397177 · sha256 `f82982b0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177397177.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPLORE_PLAN_AGENTS`

Source: `chunk-dt8bvbsd.js` · offset 177369782 · sha256 `25884f10…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the built-in Explore and Plan subagents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FAST_MODE`

Source: `chunk-9yybzjm7.js` · offset 184619351 · sha256 `8b097ca8…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable fast mode

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY`

Source: `chunk-ad1vsmtp.js` · offset 197248975 · sha256 `eceb5df5…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the "How is Claude doing?" session quality surveys.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING`

Source: `chunk-6xecmjq7.js` · offset 189219714 · sha256 `1bb2cf49…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable file checkpointing.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS`

Source: `chunk-dt8bvbsd.js` · offset 177932566 · sha256 `af2da406…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to remove built-in commit and PR workflow instructions and the git status snapshot from Claude's context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-2pwfszmk.js` · offset 196098885 · sha256 `854713d6…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2pwfszmk.js` offset 196098885.

**Undocumented**

### `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP`

Source: `chunk-m200zvyg.js` · offset 173121679 · sha256 `1434b3f7…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent automatic remapping of Opus 4.0 and 4.1 to the current Opus version on the Anthropic API.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MEMORY_BULK_INFLATE`

Source: `chunk-7kwd28ae.js` · offset 175592850 · sha256 `57a2e9bf…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175592850.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_MASS_DELETE_HOLD`

Source: `chunk-7kwd28ae.js` · offset 175555991 · sha256 `c98731a8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175555991.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_PERIODIC_RESYNC`

Source: `chunk-7kwd28ae.js` · offset 175615601 · sha256 `a88b554a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175615601.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_RO_UNSAVED_NOTICE`

Source: `chunk-7kwd28ae.js` · offset 175606750 · sha256 `b8e2136b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175606750.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MEMORY_STREAM_LIST`

Source: `chunk-7kwd28ae.js` · offset 175583140 · sha256 `e80a215c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175583140.

**Undocumented**

### `CLAUDE_CODE_DISABLE_MOUSE`

Source: `chunk-2p1kp6xr.js` · offset 173446579 · sha256 `8824ecb6…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable mouse tracking in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MOUSE_CLICKS`

Source: `chunk-2p1kp6xr.js` · offset 173446667 · sha256 `5298f3d5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to disable click, drag, and hover handling in fullscreen rendering while keeping mouse-wheel scrolling.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NESTED_CHAIN_IDLE`

Source: `chunk-7gpc8xx0.js` · offset 177214580 · sha256 `49b1d93e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7gpc8xx0.js` offset 177214580.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NESTED_USER_REPAIR`

Source: `chunk-pbbkgscm.js` · offset 193119043 · sha256 `0a5b4502…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-pbbkgscm.js` offset 193119043.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`

Source: `chunk-nj6jrnt8.js` · offset 170349858 · sha256 `b476ef4e…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to disable nonessential network traffic: auto-updates, telemetry, error reporting, the `/feedback` command, Claude-drafted feedback, release notes, the PR and MR status badge checks, and availability checks such as the fast mode check.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK`

Source: `chunk-dt8bvbsd.js` · offset 179390885 · sha256 `d463271c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the non-streaming fallback when a streaming request fails mid-stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_NOTIFICATION_PRESENCE_CHECK`

Source: `chunk-6wavg10a.js` · offset 200612254 · sha256 `4e0eb81d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to send the `PushNotification` tool's desktop notification even while you are typing in or focused on the terminal.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL`

Source: `chunk-ad1vsmtp.js` · offset 197796559 · sha256 `effc4341…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic registration of the official plugin marketplace.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_ORG_MEMORY`

Source: `chunk-gfcfehhw.js` · offset 173469978 · sha256 `a35b3841…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gfcfehhw.js` offset 173469978.

**Undocumented**

### `CLAUDE_CODE_DISABLE_PERMISSION_PROMPT_NOTIFY_HOOKS`

Source: `chunk-pbbkgscm.js` · offset 193094361 · sha256 `6e09c748…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from running your `Notification` hooks for unanswered permission requests in sessions where Claude Code sends them to the Agent SDK's `canUseTool` callback, which is how Claude Desktop and the VS Code extension host Claude Code.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-ad1vsmtp.js` · offset 196636704 · sha256 `bc51a94c…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ad1vsmtp.js` offset 196636704.

**Undocumented**

### `CLAUDE_CODE_DISABLE_POLICY_SKILLS`

Source: `chunk-dt8bvbsd.js` · offset 179973351 · sha256 `557b868b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip loading skills from the system-wide managed skills directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP`

Source: `chunk-dt8bvbsd.js` · offset 181253114 · sha256 `f4d7781e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 181253114.

**Undocumented**

### `CLAUDE_CODE_DISABLE_REFUSAL_FALLBACK`

Source: `chunk-7kwd28ae.js` · offset 175998192 · sha256 `b7e1638f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175998192.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`

Source: `chunk-3py3f8x6.js` · offset 197922863 · sha256 `c9848df5…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic terminal title updates based on conversation context.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_THINKING`

Source: `chunk-dt8bvbsd.js` · offset 179336333 · sha256 `018f2e9c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to omit the `thinking` parameter from API requests entirely.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-z825d7fd.js` · offset 193700707 · sha256 `bab299da…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193700707.

**Undocumented**

### `CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT`

Source: `chunk-dt8bvbsd.js` · offset 178329433 · sha256 `e2af1b0f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip proactive auto-compaction when Claude Code doesn't recognize the model ID, such as an LLM gateway alias.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL`

Source: `chunk-57gge8cv.js` · offset 195733746 · sha256 `778468f5…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable virtual scrolling in fullscreen rendering and render every message in the transcript.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-4r5er76z.js` · offset 181467056 · sha256 `b123889b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4r5er76z.js` offset 181467056.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WINDOWS_SHELL_LAUNCHER`

Source: `chunk-dt8bvbsd.js` · offset 178150720 · sha256 `d36766ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start PowerShell tool commands on Windows directly instead of through the `cmd.exe` launcher.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKFLOWS`

Source: `chunk-8tzgmzf9.js` · offset 173558214 · sha256 `6a39bb51…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable workflows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-z825d7fd.js` · offset 193701173 · sha256 `e937cc38…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193701173.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-dt8bvbsd.js` · offset 178137320 · sha256 `6394fbc6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-dt8bvbsd.js` offset 178137320.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-dbv42v8q.js` · offset 181368199 · sha256 `1f00549c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dbv42v8q.js` offset 181368199.

**Undocumented**

### `CLAUDE_CODE_EAGER_FLUSH`

Source: `chunk-z825d7fd.js` · offset 193639007 · sha256 `099e9537…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193639007.

**Undocumented**

### `CLAUDE_CODE_EDITOR_CODELIVERY`

Source: `chunk-z825d7fd.js` · offset 193543048 · sha256 `7931744b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193543048.

**Undocumented**

### `CLAUDE_CODE_EFFORT_LEVEL`

Source: `chunk-33j5j2e5.js` · offset 188670988 · sha256 `a1418c04…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set the effort level for supported models.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-7gpc8xx0.js` · offset 177216153 · sha256 `87d54f3a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7gpc8xx0.js` offset 177216153.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-35m5m8yf.js` · offset 175158760 · sha256 `0c59bb0a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-35m5m8yf.js` offset 175158760.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-9yybzjm7.js` · offset 184619287 · sha256 `845bada0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yybzjm7.js` offset 184619287.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-wyjryvm7.js` · offset 183703677 · sha256 `f57deca3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wyjryvm7.js` offset 183703677.

**Undocumented**

### `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`

Source: `chunk-yxjjch8j.js` · offset 184393174 · sha256 `5fd6ac1f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Override session recap availability.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_BACKGROUND_PLUGIN_REFRESH`

Source: `chunk-z825d7fd.js` · offset 193521552 · sha256 `73d4e338…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to refresh plugin state at turn boundaries in non-interactive mode after a background install completes.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_CFC`

Source: `chunk-7kwd28ae.js` · offset 175668856 · sha256 `e1810825…` · 7 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175668856.

**Undocumented**

### `CLAUDE_CODE_ENABLE_EXPERIMENTAL_ADVISOR_TOOL`

Source: `chunk-7kwd28ae.js` · offset 175802469 · sha256 `ef13d50a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 175802469.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING`

Source: `chunk-dt8bvbsd.js` · offset 178270546 · sha256 `9635eb53…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether tool call inputs stream from the API as Claude generates them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`

Source: `chunk-zb1n6bd0.js` · offset 175471091 · sha256 `2f2cf7a8…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-zb1n6bd0.js` offset 175471091.

**Undocumented**

### `CLAUDE_CODE_ENABLE_MENU_KIND_LANES`

Source: `chunk-ad1vsmtp.js` · offset 196831526 · sha256 `a005df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ad1vsmtp.js` offset 196831526.

**Undocumented**

### `CLAUDE_CODE_ENABLE_NARRATION`

Source: `chunk-9yybzjm7.js` · offset 184541928 · sha256 `b785624e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9yybzjm7.js` offset 184541928.

**Undocumented**

### `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`

Source: `chunk-9yybzjm7.js` · offset 184582101 · sha256 `abb8b4cc…` · 5 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to turn off prompt suggestions, the grayed-out predictions that appear in your prompt input.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_REFRESH_MCP_TOOLS`

Source: `chunk-9yybzjm7.js` · offset 184830614 · sha256 `47eef022…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yybzjm7.js` offset 184830614.

**Undocumented**

### `CLAUDE_CODE_ENABLE_REMOTE_RECAP`

Source: `chunk-yxjjch8j.js` · offset 184393341 · sha256 `93e0e7e0…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-yxjjch8j.js` offset 184393341.

**Undocumented**

### `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING`

Source: `chunk-dt8bvbsd.js` · offset 177984496 · sha256 `162e231d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177984496.

**Undocumented**

### `CLAUDE_CODE_ENABLE_TASKS`

Source: `chunk-jf468axa.js` · offset 176954862 · sha256 `789e280c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Selects which task-tracking tools Claude Code provides in sessions that have them.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TODO_TOOLS`

Source: `chunk-dt8bvbsd.js` · offset 180360261 · sha256 `9e897733…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to get the task-tracking tools on every model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT`

Source: `chunk-dt8bvbsd.js` · offset 180449782 · sha256 `211e4580…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180449782.

**Undocumented**

### `CLAUDE_CODE_ENABLE_XAA`

Source: `chunk-cd3sgqch.js` · offset 170844739 · sha256 `a32876ef…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cd3sgqch.js` offset 170844739.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-0zmst6z2.js` · offset 169931796 · sha256 `7c476da1…` · 76 read sites

Read as: string (trimmed; empty is treated as unset). Values: `claude-vscode`, `remote`, `remote_baku`, `remote_cowork`, `remote_desktop`, `remote_mobile`, `claude-in-teams`, `sdk-cli`, `sdk-ts`, `sdk-py`, `mcp`, `claude-code-github-action`, `local-agent`, `claude_in_slack`, `claude-in-slack`, `cli`, `ssh-remote`, `claude-desktop`, `bench`, `local_agent`, `claude-desktop-3p`.

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0zmst6z2.js` offset 169931796.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-tpcgcc17.js` · offset 174050872 · sha256 `86b4d664…` · 24 read sites

Read as: string (trimmed; empty is treated as unset). Values: `bridge`, `byoc`.

Undocumented; read at `chunk-tpcgcc17.js` offset 174050872.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-wsczm39n.js` · offset 193157019 · sha256 `e1654a9a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-wsczm39n.js` offset 193157019.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-44v385xj.js` · offset 199469547 · sha256 `fa5f0a3f…` · 26 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-44v385xj.js` offset 199469547.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-2yxmcerc.js` · offset 198956826 · sha256 `ee624a73…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-2yxmcerc.js` offset 198956826.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-89n5rmmv.js` · offset 185033508 · sha256 `3f1dcc43…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-89n5rmmv.js` offset 185033508.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-z825d7fd.js` · offset 193654681 · sha256 `72bb31e0…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`

Source: `chunk-pn9109w0.js` · offset 176829120 · sha256 `25d9e31b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable agent teams.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXPERIMENTAL_OBSERVER_AGENTS`

Source: `chunk-15e3fgjc.js` · offset 183723707 · sha256 `6b66f048…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-15e3fgjc.js` offset 183723707.

**Undocumented**

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-dt8bvbsd.js` · offset 179294660 · sha256 `c34fb80c…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: JSON object to merge into the top level of every API request body.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_METADATA`

Source: `chunk-dt8bvbsd.js` · offset 178290949 · sha256 `1e7f6a5b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178290949.

**Undocumented**

### `CLAUDE_CODE_FEDERATION_CACHE_DIR`

Source: `chunk-yrp3en1n.js` · offset 172360209 · sha256 `c06c4761…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172360209.

**Undocumented**

### `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`

Source: `chunk-nphfgajv.js` · offset 173129460 · sha256 `1dca00c6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the default token limit for file reads.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-yw87grs4.js` · offset 184496607 · sha256 `19b816d5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `3000`.

Undocumented; read at `chunk-yw87grs4.js` offset 184496607.

**Undocumented**

### `CLAUDE_CODE_FLEETVIEW_SIMPLE`

Source: `chunk-zyckxzm1.js` · offset 186902834 · sha256 `fec9df94…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zyckxzm1.js` offset 186902834.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-9yybzjm7.js` · offset 184859332 · sha256 `85294805…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-9yybzjm7.js` offset 184859332.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-ad1vsmtp.js` · offset 196513354 · sha256 `1a35ec20…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ad1vsmtp.js` offset 196513354.

**Undocumented**

### `CLAUDE_CODE_FORCE_MID_CONVERSATION_SYSTEM`

Source: `chunk-m200zvyg.js` · offset 172724768 · sha256 `4374665e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172724768.

**Undocumented**

### `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE`

Source: `chunk-76w2zwnr.js` · offset 172452403 · sha256 `fd59f454…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force transcript persistence, prompt history, and `claude agents` registration even when this `claude` was launched from inside another Claude Code session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_STRIKETHROUGH`

Source: `chunk-gtq4j5ex.js` · offset 182513609 · sha256 `a62ccdc5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force strikethrough rendering for `~~text~~` in Claude's responses when your terminal supports it but is not auto-detected, such as over SSH without `TERM_PROGRAM` forwarded.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_SYNC_OUTPUT`

Source: `chunk-7rn4mcxd.js` · offset 182804550 · sha256 `c543d0ff…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force-enable DEC private mode 2026 synchronized output when your terminal supports it but is not auto-detected.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORCE_TERMINAL_IMAGES`

Source: `chunk-vsanpa5a.js` · offset 182796689 · sha256 `0a85c469…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-vsanpa5a.js` offset 182796689.

**Undocumented**

### `CLAUDE_CODE_FORCE_WINDOWS_CREDMAN`

Source: `chunk-s60nre8f.js` · offset 172437300 · sha256 `3f0763ed…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-s60nre8f.js` offset 172437300.

**Undocumented**

### `CLAUDE_CODE_FORK_SUBAGENT`

Source: `chunk-dt8bvbsd.js` · offset 178724220 · sha256 `1a7edc8d…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls fork mode, which lets Claude spawn forked subagents itself and is on by default in interactive sessions only.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT`

Source: `chunk-bjmhhyed.js` · offset 186051599 · sha256 `a50b2622…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to emit subagent text and thinking blocks in `claude -p --output-format stream-json` output, the same behavior as the `--forward-subagent-text` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FORWARD_USER_INTENT`

Source: `chunk-m200zvyg.js` · offset 172605030 · sha256 `72bec8cd…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172605030.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_LOG`

Source: `chunk-zasza72r.js` · offset 186342934 · sha256 `2e0a430f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zasza72r.js` offset 186342934.

**Undocumented**

### `CLAUDE_CODE_FRAME_TIMING_SAMPLE_EVERY`

Source: `chunk-zasza72r.js` · offset 186342987 · sha256 `8acc24f1…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `1`.

Undocumented; read at `chunk-zasza72r.js` offset 186342987.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-kqxjkccr.js` · offset 171062008 · sha256 `f6c95e4d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_HIDDEN`

Source: `chunk-dt8bvbsd.js` · offset 178210043 · sha256 `7fef3404…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to exclude dotfiles from results when Claude invokes the Glob tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_NO_IGNORE`

Source: `chunk-dt8bvbsd.js` · offset 178209990 · sha256 `f396df60…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false). Default (from code): `true`.

From docs: Set to `false` to make the Glob tool respect `.gitignore` patterns.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-zg9v04h4.js` · offset 175009368 · sha256 `3c89eebb…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in seconds for Glob tool file discovery.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-9yybzjm7.js` · offset 184571865 · sha256 `421e5a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 10080, digitsOnly true. Default (from code): `30`.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GORSE_PLOVER`

Source: `chunk-8p6r0vhj.js` · offset 173588517 · sha256 `5946ea79…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173588517.

**Undocumented**

### `CLAUDE_CODE_GZIP_CCR_REQUEST_BODIES`

Source: `chunk-snfypb9f.js` · offset 174086371 · sha256 `8dc68f1f…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-snfypb9f.js` offset 174086371.

**Undocumented**

### `CLAUDE_CODE_GZIP_REQUEST_BODIES`

Source: `chunk-snfypb9f.js` · offset 174086409 · sha256 `bc05e45c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-snfypb9f.js` offset 174086409.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE`

Source: `chunk-hchk4qea.js` · offset 174094120 · sha256 `df6ae3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-hchk4qea.js` offset 174094120.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_CLOUD`

Source: `chunk-tncna8d5.js` · offset 191912510 · sha256 `40c7c424…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-tncna8d5.js` offset 191912510.

**Undocumented**

### `CLAUDE_CODE_HARBOR_KITE_PACING_OFF`

Source: `chunk-gbez9mpv.js` · offset 174111975 · sha256 `a6b5fd40…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gbez9mpv.js` offset 174111975.

**Undocumented**

### `CLAUDE_CODE_HIDE_CWD`

Source: `chunk-krcfj49e.js` · offset 186620576 · sha256 `ab916658…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the working directory in the startup logo.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-h9fx0tjr.js` · offset 170544744 · sha256 `1e801477…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-h9fx0tjr.js` offset 170544744.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-z825d7fd.js` · offset 193882040 · sha256 `65424d2e…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193882040.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-rzdcwx99.js` · offset 203837536 · sha256 `7cba2278…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `300000`.

Undocumented; read at `chunk-rzdcwx99.js` offset 203837536.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-rzdcwx99.js` · offset 203837610 · sha256 `356fd56e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `60000`.

Undocumented; read at `chunk-rzdcwx99.js` offset 203837610.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-dt8bvbsd.js` · offset 179000459 · sha256 `7c5f9747…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179000459.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_ENV_VAR`

Source: `chunk-tpcgcc17.js` · offset 174050939 · sha256 `9866d220…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ANTHROPIC_AUTH_TOKEN`.

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-tpcgcc17.js` offset 174050939.

**Undocumented**

### `CLAUDE_CODE_HOST_AUTH_REFRESH_TIMEOUT_MS`

Source: `chunk-z825d7fd.js` · offset 193703515 · sha256 `e2898b0c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-z825d7fd.js` offset 193703515.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-7kwd28ae.js` · offset 175531171 · sha256 `c51d4504…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175531171.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-0hm7n25m.js` · offset 170437304 · sha256 `1727d409…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `darwin`.

Undocumented; read at `chunk-0hm7n25m.js` offset 170437304.

**Undocumented**

### `CLAUDE_CODE_HOST_SCHEDULED_RUN`

Source: `chunk-h9fx0tjr.js` · offset 170547081 · sha256 `b89666ec…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-h9fx0tjr.js` offset 170547081.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-m200zvyg.js` · offset 172788411 · sha256 `5970cab5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172788411.

**Undocumented**

### `CLAUDE_CODE_HOVER_REST`

Source: `chunk-6f212af7.js` · offset 181837610 · sha256 `f2f700a5…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-6f212af7.js` offset 181837610.

**Undocumented**

### `CLAUDE_CODE_HUMBLE_HAMMOCK`

Source: `chunk-dt8bvbsd.js` · offset 178283909 · sha256 `7bac3d99…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178283909.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-c2fy6cgt.js` · offset 176862680 · sha256 `13c70d6f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the host address used to connect to the IDE extension.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_AUTO_INSTALL`

Source: `chunk-c2fy6cgt.js` · offset 176862189 · sha256 `67709670…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip auto-installation of IDE extensions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDE_SKIP_VALID_CHECK`

Source: `chunk-c2fy6cgt.js` · offset 176854866 · sha256 `f07ea290…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip validation of IDE lockfile entries during connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-ad1vsmtp.js` · offset 196460364 · sha256 `c369462a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `75`.

Undocumented; read at `chunk-ad1vsmtp.js` offset 196460364.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-ad1vsmtp.js` · offset 196460257 · sha256 `4cb11ebe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-ad1vsmtp.js` offset 196460257.

**Undocumented**

### `CLAUDE_CODE_INCLUDE_PARTIAL_MESSAGES`

Source: `chunk-bjmhhyed.js` · offset 186051553 · sha256 `2ec5d90f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-bjmhhyed.js` offset 186051553.

**Undocumented**

### `CLAUDE_CODE_INLINE_TOOLS`

Source: `chunk-m200zvyg.js` · offset 172703901 · sha256 `6c18992e…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172703901.

**Undocumented**

### `CLAUDE_CODE_INTRO_FRAME`

Source: `chunk-dt8bvbsd.js` · offset 178740200 · sha256 `698839a2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178740200.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-4jbzqc2f.js` · offset 203023004 · sha256 `0de12944…` · 10 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4jbzqc2f.js` offset 203023004.

**Undocumented**

### `CLAUDE_CODE_JUNIPER_SUNDIAL`

Source: `chunk-dt8bvbsd.js` · offset 180400343 · sha256 `7f21b654…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

Undocumented; read at `chunk-dt8bvbsd.js` offset 180400343.

**Undocumented**

### `CLAUDE_CODE_KB_COHESION_FIXES`

Source: `chunk-d2erbcaq.js` · offset 185257939 · sha256 `8ed256d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-d2erbcaq.js` offset 185257939.

**Undocumented**

### `CLAUDE_CODE_LANTERN_PRISM`

Source: `chunk-f69w4hga.js` · offset 177240811 · sha256 `318044d2…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-f69w4hga.js` offset 177240811.

**Undocumented**

### `CLAUDE_CODE_LARCH_CISTERN`

Source: `chunk-8p6r0vhj.js` · offset 173588786 · sha256 `5502383a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173588786.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-7kwd28ae.js` · offset 176199686 · sha256 `c3a383e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 176199686.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-bavc98re.js` · offset 183972527 · sha256 `0cb997e5…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-bavc98re.js` offset 183972527.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-xt675wcj.js` · offset 201092925 · sha256 `e2921932…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xt675wcj.js` offset 201092925.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-dt8bvbsd.js` · offset 178626620 · sha256 `482fa868…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `20`.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_CONTEXT_TOKENS`

Source: `chunk-bjmhhyed.js` · offset 186011703 · sha256 `3237e39a…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the context window size Claude Code assumes for the active model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_EFFORT_REMINDER`

Source: `chunk-7gbsnfct.js` · offset 173562146 · sha256 `cf1ec291…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-7gbsnfct.js` offset 173562146.

**Undocumented**

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-dt8bvbsd.js` · offset 178849413 · sha256 `bc6c35a8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `2048`.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_OUTPUT_TOKENS`

Source: `chunk-dt8bvbsd.js` · offset 179417201 · sha256 `bf917afe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Set the maximum number of output tokens for most requests.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_RETRIES`

Source: `chunk-dt8bvbsd.js` · offset 179292366 · sha256 `7979c44b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Override the number of times to retry failed API requests (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-tzhwyb8y.js` · offset 176336567 · sha256 `6fc57800…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`

Source: `chunk-wyjryvm7.js` · offset 183601239 · sha256 `984edcae…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `10`.

From docs: Maximum number of read-only tools and subagents that can execute in parallel (default: 10).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_TURNS`

Source: `chunk-b1tfggtv.js` · offset 170271275 · sha256 `a023beee…`

Read as: string (trimmed; empty is treated as unset).

From docs: Cap the number of agentic turns when no explicit limit is passed.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-mqx95bs2.js` · offset 176394781 · sha256 `c068574d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `200`.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-yrp3en1n.js` · offset 172371598 · sha256 `f9e0beea…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-ca0h8sgx.js` · offset 207535131 · sha256 `92c1abd0…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-z825d7fd.js` · offset 193854291 · sha256 `47172fe3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-z825d7fd.js` offset 193854291.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-pqvq7799.js` · offset 171143652 · sha256 `e5f05822…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pqvq7799.js` offset 171143652.

**Undocumented**

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-yrp3en1n.js` · offset 172369942 · sha256 `63fb2b7c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-4jbzqc2f.js` · offset 202964362 · sha256 `cc6c8538…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Idle timeout in milliseconds for MCP tool calls.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MEMORY_PUSH_DELETE_MODE`

Source: `chunk-7kwd28ae.js` · offset 175555677 · sha256 `d1dd7dc7…`

Read as: enum (compared against fixed values). Values: `corroborate`, `immediate`, `never`.

Undocumented; read at `chunk-7kwd28ae.js` offset 175555677.

**Undocumented**

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-bjmhhyed.js` · offset 186069254 · sha256 `f4321a48…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MODEL_CAPABILITIES`

Source: `chunk-x29j4pyb.js` · offset 171665665 · sha256 `a04a0c59…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-x29j4pyb.js` offset 171665665.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG`

Source: `chunk-edbt522c.js` · offset 185575670 · sha256 `dce6abf9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-edbt522c.js` offset 185575670.

**Undocumented**

### `CLAUDE_CODE_MODEL_CATALOG_URL`

Source: `chunk-5r594ba7.js` · offset 185584621 · sha256 `0a1f4188…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-5r594ba7.js` offset 185584621.

**Undocumented**

### `CLAUDE_CODE_NANKEEN_KESTREL`

Source: `chunk-zg9v04h4.js` · offset 174996880 · sha256 `62f600b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zg9v04h4.js` offset 174996880.

**Undocumented**

### `CLAUDE_CODE_NATIVE_CURSOR`

Source: `chunk-qbx8et3j.js` · offset 183195421 · sha256 `9973481d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to show the terminal's own cursor at the input caret instead of a drawn block.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NEW_INIT`

Source: `chunk-dt8bvbsd.js` · offset 180016242 · sha256 `3988e65d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to make `/init` run an interactive setup flow.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_FLICKER`

Source: `chunk-2p1kp6xr.js` · offset 173443847 · sha256 `ffde9f68…` · 6 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to enable fullscreen rendering, a research preview that reduces flicker and keeps memory flat in long conversations.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_NO_MODEL_FALLBACK`

Source: `chunk-m200zvyg.js` · offset 173113039 · sha256 `9a948e34…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 173113039.

**Undocumented**

### `CLAUDE_CODE_NONBLOCKING_STDOUT`

Source: `chunk-qbx8et3j.js` · offset 183152035 · sha256 `7e045e30…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to write terminal output through a second non-blocking file descriptor, so a terminal that stops reading, such as a paused tmux control-mode pane or a stalled SSH connection, can't freeze Claude Code mid-session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_401_WAIT_MS`

Source: `chunk-m200zvyg.js` · offset 173023138 · sha256 `adf8c842…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Undocumented; read at `chunk-m200zvyg.js` offset 173023138.

**Undocumented**

### `CLAUDE_CODE_OAUTH_CLIENT_ID`

Source: `chunk-nfwnrvq3.js` · offset 170362197 · sha256 `bd32389e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nfwnrvq3.js` offset 170362197.

**Undocumented**

### `CLAUDE_CODE_OAUTH_REFRESH_TOKEN`

Source: `chunk-xb7c0gdp.js` · offset 195148597 · sha256 `546b7627…`

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth refresh token for Claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_SCOPES`

Source: `chunk-xb7c0gdp.js` · offset 195148653 · sha256 `f3d74416…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Space-separated OAuth scopes the refresh token was issued with, such as `"user:profile user:inference user:sessions:claude_code"`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-f0epszrp.js` · offset 182543479 · sha256 `12619147…` · 38 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 23 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OAuth access token for claude.ai authentication.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-dt8bvbsd.js` · offset 180256401 · sha256 `e23b3439…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180256401.

**Undocumented**

### `CLAUDE_CODE_OCHRE_KITE`

Source: `chunk-9yybzjm7.js` · offset 184602445 · sha256 `b13e67fe…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yybzjm7.js` offset 184602445.

**Undocumented**

### `CLAUDE_CODE_ORGANIZATION_UUID`

Source: `chunk-8snes1yz.js` · offset 172390544 · sha256 `2ece2065…` · 16 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8snes1yz.js` offset 172390544.

**Undocumented**

### `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE`

Source: `chunk-f7tnsfnn.js` · offset 186703788 · sha256 `66dea6e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to let Claude Code run your package manager's upgrade command in the background when a new version is available.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PARCHMENT_FERN`

Source: `chunk-8p6r0vhj.js` · offset 173589538 · sha256 `6a5be7ab…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173589538.

**Undocumented**

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-z825d7fd.js` · offset 193598777 · sha256 `580b35b6…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `2000`.

Undocumented; read at `chunk-z825d7fd.js` offset 193598777.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-z825d7fd.js` · offset 193598989 · sha256 `2c52ce2b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193598989.

**Undocumented**

### `CLAUDE_CODE_PARSED_WILLOW`

Source: `chunk-dt8bvbsd.js` · offset 180984135 · sha256 `3f4b28da…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180984135.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-7kez5kef.js` · offset 171072838 · sha256 `2c8ec14a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to enable Perforce-aware write protection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PEWTER_OWL`

Source: `chunk-z0eyb2jb.js` · offset 177062382 · sha256 `5eab3bfa…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-z0eyb2jb.js` offset 177062382.

**Undocumented**

### `CLAUDE_CODE_PEWTER_OWL_TOOL`

Source: `chunk-z0eyb2jb.js` · offset 177062577 · sha256 `c8b4a783…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-z0eyb2jb.js` offset 177062577.

**Undocumented**

### `CLAUDE_CODE_PLAN_MODE_REQUIRED`

Source: `chunk-76w2zwnr.js` · offset 172453715 · sha256 `446af310…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-76w2zwnr.js` offset 172453715.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-dt8bvbsd.js` · offset 180956547 · sha256 `145ff368…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180956547.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-dt8bvbsd.js` · offset 180956757 · sha256 `c08f81b3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180956757.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-aphs9s47.js` · offset 173630653 · sha256 `77a1c90e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-aphs9s47.js` offset 173630653.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_BINARY_ASSETS`

Source: `chunk-dt8bvbsd.js` · offset 180560288 · sha256 `c60f17b1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180560288.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-8sbtv6vp.js` · offset 173606636 · sha256 `59ec7dd9…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the plugins root directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIR_WATCH`

Source: `chunk-dt8bvbsd.js` · offset 177731650 · sha256 `08a1ca6e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177731650.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-7p9ft896.js` · offset 183433580 · sha256 `be0843c0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-dt8bvbsd.js` · offset 180489867 · sha256 `443f2a02…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE`

Source: `chunk-dt8bvbsd.js` · offset 180494663 · sha256 `9144e4f9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the re-clone attempt and keep using the existing marketplace checkout when a marketplace refresh can't reach or authenticate to the remote.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`

Source: `chunk-pqvq7799.js` · offset 171135863 · sha256 `6ede7fcb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to clone GitHub `owner/repo` shorthand sources over HTTPS instead of SSH.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-8sbtv6vp.js` · offset 173606724 · sha256 `dd28fbd5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_USE_ZIP_CACHE`

Source: `chunk-dt8bvbsd.js` · offset 177466286 · sha256 `a6a39434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177466286.

**Undocumented**

### `CLAUDE_CODE_POLISHED_DEWDROP`

Source: `chunk-dt8bvbsd.js` · offset 179242937 · sha256 `b3bc3546…`

Read as: enum (compared against fixed values). Values: `drop`, `block`, `off`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 179242937.

**Undocumented**

### `CLAUDE_CODE_POLL_EVENTS`

Source: `chunk-v4f98gwd.js` · offset 175393869 · sha256 `481b54c4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-v4f98gwd.js` offset 175393869.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-hkjwh63j.js` · offset 183759275 · sha256 `9cf5c70a…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-hkjwh63j.js` offset 183759275.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-m200zvyg.js` · offset 172844463 · sha256 `d68b016f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172844463.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-m200zvyg.js` · offset 172844538 · sha256 `fc4fcde6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172844538.

**Undocumented**

### `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY`

Source: `chunk-dt8bvbsd.js` · offset 177783581 · sha256 `605a0977…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from passing `-ExecutionPolicy Bypass` when spawning PowerShell for tool calls, hooks, and status line commands, and respect the machine's effective execution policy instead.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-0eeh9wdn.js` · offset 195587331 · sha256 `55266f2b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `banner`, `step`.

Undocumented; read at `chunk-0eeh9wdn.js` offset 195587331.

**Undocumented**

### `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`

Source: `chunk-z825d7fd.js` · offset 193481211 · sha256 `d5315498…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `600000`.

From docs: Ceiling in milliseconds on idle waiting for background subagents and workflows after the final turn in non-interactive mode with the `-p` flag.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROACTIVE`

Source: `chunk-ad1vsmtp.js` · offset 197884891 · sha256 `b4a14159…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ad1vsmtp.js` offset 197884891.

**Undocumented**

### `CLAUDE_CODE_PROCESS_WRAPPER`

Source: `chunk-z77v9mae.js` · offset 174042031 · sha256 `a26b9dc9…`

Read as: string (raw value; further parsing not traced).

From docs: Launch the processes Claude Code starts from its own binary, such as the background service that hosts agent view sessions, through a corporate launcher given as an argv prefix like `/opt/corp/launcher`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROFILE_STARTUP`

Source: `chunk-1meqveg3.js` · offset 171261600 · sha256 `48090143…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-1meqveg3.js` offset 171261600.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-b1tfggtv.js` · offset 170270659 · sha256 `46ee95ac…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROPAGATE_TRACEPARENT`

Source: `chunk-dt8bvbsd.js` · offset 179301233 · sha256 `8c13cedc…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to propagate W3C trace context when `ANTHROPIC_BASE_URL` points at a custom proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`

Source: `chunk-tpcgcc17.js` · offset 174050813 · sha256 `55abb6ea…` · 24 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set by host platforms that embed Claude Code and manage model provider routing on its behalf.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-dt8bvbsd.js` · offset 177761346 · sha256 `941d165a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177761346.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-yrp3en1n.js` · offset 172369697 · sha256 `431f146e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yrp3en1n.js` offset 172369697.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-yrp3en1n.js` · offset 172369730 · sha256 `b41183a0…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yrp3en1n.js` offset 172369730.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-zasza72r.js` · offset 186349845 · sha256 `b0ac376e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zasza72r.js` offset 186349845.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-yrp3en1n.js` · offset 172369323 · sha256 `ecac5ea0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172369323.

**Undocumented**

### `CLAUDE_CODE_REFUSAL_FALLBACK_CATCH_ALL`

Source: `chunk-7kwd28ae.js` · offset 175996832 · sha256 `864b4300…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175996832.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-gdkbvbsf.js` · offset 183263184 · sha256 `d2231367…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-gdkbvbsf.js` offset 183263184.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-dt8bvbsd.js` · offset 179300893 · sha256 `9bf28f96…` · 168 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-m200zvyg.js` · offset 172807510 · sha256 `36b0bea4…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 7 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172807510.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-yqdndc8w.js` · offset 174046586 · sha256 `3d74f7c1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-yqdndc8w.js` offset 174046586.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-m200zvyg.js` · offset 172846309 · sha256 `e165e4bd…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172846309.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-cg1cda1q.js` · offset 177021805 · sha256 `26e703b9…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-cg1cda1q.js` offset 177021805.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-6qna9m0p.js` · offset 170154947 · sha256 `66c81362…` · 45 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 14 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set automatically in cloud sessions to the current session's ID.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-8snes1yz.js` · offset 172381409 · sha256 `bb0ef760…`

Read as: string (trimmed; empty is treated as unset). Values: `review`.

Undocumented; read at `chunk-8snes1yz.js` offset 172381409.

**Undocumented**

### `CLAUDE_CODE_REPL`

Source: `chunk-9yybzjm7.js` · offset 184838333 · sha256 `48f6e435…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-9yybzjm7.js` offset 184838333.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-7kwd28ae.js` · offset 175822924 · sha256 `ed0db984…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175822924.

**Undocumented**

### `CLAUDE_CODE_REPORT_FINDINGS`

Source: `chunk-daa108e6.js` · offset 185675421 · sha256 `83bab3f4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-daa108e6.js` offset 185675421.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-b1tfggtv.js` · offset 170271738 · sha256 `34ebe303…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-z825d7fd.js` · offset 193875841 · sha256 `8de15ab6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z825d7fd.js` offset 193875841.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-dt8bvbsd.js` · offset 180128654 · sha256 `51a22bee…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-dt8bvbsd.js` · offset 180125922 · sha256 `368abfd7…`

Read as: string (trimmed; empty is treated as unset).

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-dt8bvbsd.js` · offset 180125541 · sha256 `6d26b33b…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `Continue from where you left off.`.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-dt8bvbsd.js` · offset 180125643 · sha256 `86742cd5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180125643.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-c1pb53de.js` · offset 195782189 · sha256 `18c89164…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c1pb53de.js` offset 195782189.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-ad1vsmtp.js` · offset 196655480 · sha256 `560978fe…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `70`.

Undocumented; read at `chunk-ad1vsmtp.js` offset 196655480.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-ad1vsmtp.js` · offset 196655525 · sha256 `4856fb83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `100000`.

Undocumented; read at `chunk-ad1vsmtp.js` offset 196655525.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-dt8bvbsd.js` · offset 180128135 · sha256 `07bb30dc…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180128135.

**Undocumented**

### `CLAUDE_CODE_RETRY_WATCHDOG`

Source: `chunk-dt8bvbsd.js` · offset 179276726 · sha256 `cfbe7798…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` for unattended sessions such as eval harnesses, CI jobs, or remote workers.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RUSTLING_PIXEL`

Source: `chunk-dt8bvbsd.js` · offset 179245325 · sha256 `bd7707c3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179245325.

**Undocumented**

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-b1tfggtv.js` · offset 170271661 · sha256 `470f14bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-gfcfehhw.js` · offset 173511542 · sha256 `1891ad2e…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-gfcfehhw.js` offset 173511542.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-yrp3en1n.js` · offset 172366385 · sha256 `271d8941…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-x0jdrjzw.js` · offset 205319708 · sha256 `91a608bc…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SDK_HAS_HOST_AUTH_REFRESH`

Source: `chunk-z825d7fd.js` · offset 193703458 · sha256 `44e72a15…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193703458.

**Undocumented**

### `CLAUDE_CODE_SDK_HAS_OAUTH_REFRESH`

Source: `chunk-m200zvyg.js` · offset 172992439 · sha256 `3d742d83…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172992439.

**Undocumented**

### `CLAUDE_CODE_SEND_FEEDBACK`

Source: `chunk-33z07shq.js` · offset 184492666 · sha256 `95ea5704…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to turn off Claude-drafted feedback for a session.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-8snes1yz.js` · offset 172390011 · sha256 `ba44bc9b…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-h9fx0tjr.js` · offset 170546826 · sha256 `5f1f30e9…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-h9fx0tjr.js` offset 170546826.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-8mpw6cb9.js` · offset 189394400 · sha256 `b85d590a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-01zwaz9d.js` · offset 169925325 · sha256 `ca22b404…` · 40 read sites

Read as: string (trimmed; empty is treated as unset). Values: `bg`.

Undocumented; read at `chunk-01zwaz9d.js` offset 169925325.

**Undocumented**

### `CLAUDE_CODE_SESSION_LOG`

Source: `chunk-m200zvyg.js` · offset 172785993 · sha256 `0a5415fc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172785993.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-m200zvyg.js` · offset 172784720 · sha256 `25e3352a…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172784720.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-m200zvyg.js` · offset 172836850 · sha256 `89e071e5…`

Read as: enum (compared against fixed values). Values: `claude_ai_chat`.

Undocumented; read at `chunk-m200zvyg.js` offset 172836850.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-z825d7fd.js` · offset 193630122 · sha256 `bea79228…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z825d7fd.js` offset 193630122.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-dt8bvbsd.js` · offset 179464868 · sha256 `adf97071…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `1500`.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-dt8bvbsd.js` · offset 180934166 · sha256 `31413206…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set the shell Claude Code uses to run Bash tool commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-4jbzqc2f.js` · offset 202987972 · sha256 `2d9e653f…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SILENT_TURN_REMINDER`

Source: `chunk-dt8bvbsd.js` · offset 180393279 · sha256 `4d7a230e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180393279.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TEXT`

Source: `chunk-dt8bvbsd.js` · offset 180393065 · sha256 `bfa469d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180393065.

**Undocumented**

### `CLAUDE_CODE_SILENT_TURN_REMINDER_TURNS`

Source: `chunk-dt8bvbsd.js` · offset 180393429 · sha256 `3bfef62d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-dt8bvbsd.js` offset 180393429.

**Undocumented**

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-b1tfggtv.js` · offset 170271592 · sha256 `e7139545…` · 15 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-8p6r0vhj.js` · offset 173590057 · sha256 `cf484739…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-dt8bvbsd.js` · offset 177534640 · sha256 `ae0e1afb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177534640.

**Undocumented**

### `CLAUDE_CODE_SKILL_PROPOSALS`

Source: `chunk-dt8bvbsd.js` · offset 177970704 · sha256 `0b60af6f…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177970704.

**Undocumented**

### `CLAUDE_CODE_SKIP_FAST_MODE_NETWORK_ERRORS`

Source: `chunk-m200zvyg.js` · offset 172917510 · sha256 `9bd83e99…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to treat a failed fast mode availability check as available, for networks that block the check's direct request to `api.anthropic.com`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_FAST_MODE_ORG_CHECK`

Source: `chunk-m200zvyg.js` · offset 172915910 · sha256 `51819982…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the client-side fast mode availability check, for proxies that intercept the check's request rather than refuse it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS`

Source: `chunk-dt8bvbsd.js` · offset 177657563 · sha256 `322d3de0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177657563.

**Undocumented**

### `CLAUDE_CODE_SKIP_PLUGIN_MCP_SERVERS_EXCEPT`

Source: `chunk-dt8bvbsd.js` · offset 177657288 · sha256 `ac1ed8d9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177657288.

**Undocumented**

### `CLAUDE_CODE_SKIP_PROMPT_HISTORY`

Source: `chunk-7kwd28ae.js` · offset 175794843 · sha256 `dfa39084…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip writing prompt history and session transcripts to disk.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SLOW_OPERATION_THRESHOLD_MS`

Source: `chunk-brafns17.js` · offset 170319069 · sha256 `2d40a3a5…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-brafns17.js` offset 170319069.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-1meqveg3.js` · offset 171261132 · sha256 `484bfa9f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-1meqveg3.js` offset 171261132.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-c2fy6cgt.js` · offset 176851277 · sha256 `3c3064ab…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-c2fy6cgt.js` offset 176851277.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-dbv42v8q.js` · offset 181368123 · sha256 `d1de753e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dbv42v8q.js` offset 181368123.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-n4rcp3w3.js` · offset 173379903 · sha256 `829fede0…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STELLAR_DRIFT`

Source: `chunk-dt8bvbsd.js` · offset 178275552 · sha256 `fd80c4e2…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178275552.

**Undocumented**

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-9yybzjm7.js` · offset 184687524 · sha256 `679999c7…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `8`.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL`

Source: `chunk-wyjryvm7.js` · offset 183644150 · sha256 `a4e439aa…`

Read as: string (trimmed; empty is treated as unset).

From docs: The default model for subagents, agent team teammates, and workflow agents that aren't assigned a model another way.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBAGENT_MODEL_FORCE`

Source: `chunk-2q9yd9pz.js` · offset 199621030 · sha256 `1f181030…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force one model onto subagents, teammates, and workflow agents.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-yr2mhv8p.js` · offset 171296535 · sha256 `32d88409…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-yrp3en1n.js` · offset 172369271 · sha256 `3bac6f02…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172369271.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-b1tfggtv.js` · offset 170271983 · sha256 `ca2a97fc…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-b1tfggtv.js` offset 170271983.

**Undocumented**

### `CLAUDE_CODE_SUPPRESS_SESSION_ATTRIBUTION`

Source: `chunk-dt8bvbsd.js` · offset 178237334 · sha256 `5d00e83b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178237334.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL`

Source: `chunk-bjmhhyed.js` · offset 186001878 · sha256 `65428678…` · 9 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode (the `-p` flag) to wait for plugin installation to complete before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-z825d7fd.js` · offset 193757458 · sha256 `289123bc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `0`.

From docs: Timeout in milliseconds for synchronous plugin installation.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS`

Source: `chunk-ccz3kqt0.js` · offset 175256796 · sha256 `0d015816…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ccz3kqt0.js` offset 175256796.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-ccz3kqt0.js` · offset 175261937 · sha256 `9f9c61c9…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ccz3kqt0.js` offset 175261937.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-ccz3kqt0.js` · offset 175260364 · sha256 `7bb68b87…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `60000`.

Undocumented; read at `chunk-ccz3kqt0.js` offset 175260364.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-dt8bvbsd.js` · offset 177489489 · sha256 `52621edc…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `30000`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 177489489.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-dt8bvbsd.js` · offset 177489564 · sha256 `ee1187e2…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0. Default (from code): `10000`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 177489564.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-dt8bvbsd.js` · offset 177487600 · sha256 `10976ffa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, max 86400000.

Undocumented; read at `chunk-dt8bvbsd.js` offset 177487600.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-ccz3kqt0.js` · offset 175256824 · sha256 `ffd902d2…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ccz3kqt0.js` offset 175256824.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS`

Source: `chunk-9yybzjm7.js` · offset 184534260 · sha256 `86fc5960…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in non-interactive mode with the `-p` flag to make Claude Code download the skills enabled for your claude.ai account in that run and wait for the list of them, up to `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`, before it runs the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-9yybzjm7.js` · offset 184523508 · sha256 `6b53f454…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-9yybzjm7.js` · offset 184523424 · sha256 `de00dd5e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-d7gc2bjs.js` · offset 198407678 · sha256 `ef3cce71…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `false` to disable syntax highlighting in diff output.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-z825d7fd.js` · offset 193749105 · sha256 `5ca80899…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-z825d7fd.js` offset 193749105.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-m200zvyg.js` · offset 172807858 · sha256 `aa86fbdc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172807858.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-ad1vsmtp.js` · offset 196464933 · sha256 `8ea2a4a3…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Share a task list across sessions.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-z825d7fd.js` · offset 193694145 · sha256 `701641f9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1000, max 60000. Default (from code): `10000`.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEE_SDK_STDOUT`

Source: `chunk-wsczm39n.js` · offset 193157463 · sha256 `3b7d3d72…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-wsczm39n.js` offset 193157463.

**Undocumented**

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-dt8bvbsd.js` · offset 180117744 · sha256 `eb007c40…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180117744.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-4jypa6yj.js` · offset 172398711 · sha256 `32d7e817…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-4jypa6yj.js` offset 172398711.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-dt8bvbsd.js` · offset 178031681 · sha256 `e061786e…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178031681.

**Undocumented**

### `CLAUDE_CODE_THINKING_DISPLAY_UPDATES`

Source: `chunk-dt8bvbsd.js` · offset 179225372 · sha256 `6c6cabb4…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179225372.

**Undocumented**

### `CLAUDE_CODE_THISTLE_GREBE`

Source: `chunk-m200zvyg.js` · offset 172589666 · sha256 `da23ea8a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172589666.

**Undocumented**

### `CLAUDE_CODE_THRIFTY_SONIC`

Source: `chunk-8p6r0vhj.js` · offset 173587921 · sha256 `ea9dc2ed…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173587921.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-zg9v04h4.js` · offset 174848832 · sha256 `299a7e96…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the temp directory used for internal temp files.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-57gge8cv.js` · offset 195667841 · sha256 `f3917ec9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-57gge8cv.js` offset 195667841.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-57gge8cv.js` · offset 195667802 · sha256 `d3dc1e92…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-57gge8cv.js` offset 195667802.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-57gge8cv.js` · offset 195667680 · sha256 `c0a56997…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-57gge8cv.js` offset 195667680.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-fbbebbx4.js` · offset 171642211 · sha256 `1caa1ae1…`

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TODO_REMINDER_MODE`

Source: `chunk-dt8bvbsd.js` · offset 180399986 · sha256 `5abe0e33…`

Read as: enum (compared against fixed values). Values: `baseline`, `off`.

Undocumented; read at `chunk-dt8bvbsd.js` offset 180399986.

**Undocumented**

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-pqvq7799.js` · offset 171143360 · sha256 `5b70bef7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-pqvq7799.js` · offset 171141610 · sha256 `1f539dfd…`

Read as: string (trimmed; empty is treated as unset).

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER`

Source: `chunk-dt8bvbsd.js` · offset 178720585 · sha256 `ffe6d7ce…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178720585.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_AFTER_USER_TURN`

Source: `chunk-dt8bvbsd.js` · offset 178721407 · sha256 `ddd4b616…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178721407.

**Undocumented**

### `CLAUDE_CODE_TOTAL_TOKENS_REMINDER_BUDGET`

Source: `chunk-dt8bvbsd.js` · offset 178720972 · sha256 `606df25d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178720972.

**Undocumented**

### `CLAUDE_CODE_TRANSCRIPT_LOCAL_GC`

Source: `chunk-wsczm39n.js` · offset 193137981 · sha256 `3ecaf12b…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-wsczm39n.js` offset 193137981.

**Undocumented**

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-jf0crvfg.js` · offset 199077503 · sha256 `e89ecb6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-jf0crvfg.js` offset 199077503.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-57gge8cv.js` · offset 195633891 · sha256 `4aa0a028…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`, `default`.

Undocumented; read at `chunk-57gge8cv.js` offset 195633891.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-2p1kp6xr.js` · offset 173443041 · sha256 `f52b2d89…`

Read as: string (trimmed; empty is treated as unset). Values: `fullscreen`.

Undocumented; read at `chunk-2p1kp6xr.js` offset 173443041.

**Undocumented**

### `CLAUDE_CODE_TURN_UPDATES`

Source: `chunk-dt8bvbsd.js` · offset 178728505 · sha256 `924dab76…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178728505.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-4b9m8jd6.js` · offset 188909345 · sha256 `d80da839…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4b9m8jd6.js` offset 188909345.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-pfwc1kpt.js` · offset 184992104 · sha256 `4abb04e7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-pfwc1kpt.js` offset 184992104.

**Undocumented**

### `CLAUDE_CODE_USE_COWORK_PLUGINS`

Source: `chunk-8sbtv6vp.js` · offset 173606565 · sha256 `225ab54c…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8sbtv6vp.js` offset 173606565.

**Undocumented**

### `CLAUDE_CODE_USE_POWERSHELL_TOOL`

Source: `chunk-89n5rmmv.js` · offset 185052576 · sha256 `0bf9df8a…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls the PowerShell tool.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-7kwd28ae.js` · offset 175993427 · sha256 `46d08d18…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USER_EMAIL`

Source: `chunk-m200zvyg.js` · offset 172964224 · sha256 `2347c88b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172964224.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-g4462x8a.js` · offset 201964205 · sha256 `b4c3c91f…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-g4462x8a.js` offset 201964205.

**Undocumented**

### `CLAUDE_CODE_WEB_FETCH_AGENT`

Source: `chunk-dt8bvbsd.js` · offset 178708138 · sha256 `cbf3526c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178708138.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_CACHE_TTL_MS`

Source: `chunk-2qe52wh4.js` · offset 176836476 · sha256 `8d500e83…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `900000`.

From docs: Set to the number of milliseconds WebFetch keeps each fetched URL's response cached.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBFETCH_DEADLINE_MS`

Source: `chunk-dt8bvbsd.js` · offset 178682678 · sha256 `79263864…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

From docs: Upper bound in milliseconds on how long WebFetch waits for a page to download, including any redirects it follows.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WEBSOCKET_AUTH_FILE_DESCRIPTOR`

Source: `chunk-qkntfnrf.js` · offset 182593969 · sha256 `3df5ab6a…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-qkntfnrf.js` offset 182593969.

**Undocumented**

### `CLAUDE_CODE_WILLOW_TERN`

Source: `chunk-8p6r0vhj.js` · offset 173589086 · sha256 `4be21696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-8p6r0vhj.js` offset 173589086.

**Undocumented**

### `CLAUDE_CODE_WISE_COMET`

Source: `chunk-dt8bvbsd.js` · offset 178325058 · sha256 `05978c0d…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178325058.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-z825d7fd.js` · offset 193788640 · sha256 `325e02bb…` · 14 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-z825d7fd.js` offset 193788640.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS`

Source: `chunk-3fxxabdq.js` · offset 188535960 · sha256 `74e013c4…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 256, digitsOnly true.

From docs: How many agents a single workflow run executes at once, from `1` to `256`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_AGENTS`

Source: `chunk-ad1vsmtp.js` · offset 196739051 · sha256 `27d03ba3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-ad1vsmtp.js` offset 196739051.

**Undocumented**

### `CLAUDE_CODE_WORKFLOW_SIZE_WARNING_TOKENS`

Source: `chunk-ad1vsmtp.js` · offset 196739131 · sha256 `cb3ff7f8…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-ad1vsmtp.js` offset 196739131.

**Undocumented**

### `CLAUDE_CODE_WORKFLOWS`

Source: `chunk-8tzgmzf9.js` · offset 173559238 · sha256 `9f543338…` · 3 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-8tzgmzf9.js` offset 173559238.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-rv11zjj6.js` · offset 174138494 · sha256 `30722e3d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-rv11zjj6.js` offset 174138494.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-0hm7n25m.js` · offset 170428336 · sha256 `8c4b69f4…` · 20 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the configuration directory (default: `~/.claude`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-vnh9hg8q.js` · offset 173920721 · sha256 `4ad6dc1e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-vnh9hg8q.js` offset 173920721.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-dt8bvbsd.js` · offset 178027115 · sha256 `3ca2d6e8…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178027115.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-dt8bvbsd.js` · offset 177912121 · sha256 `d01657be…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177912121.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-m200zvyg.js` · offset 172846353 · sha256 `7bd86655…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172846353.

**Undocumented**

### `CLAUDE_DEBUG`

Source: `chunk-zasza72r.js` · offset 186348415 · sha256 `96be69e5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-zasza72r.js` offset 186348415.

**Undocumented**

### `CLAUDE_DISABLE_ADOPT`

Source: `chunk-4wxgmy12.js` · offset 184407401 · sha256 `d04f1eb4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop in-flight background work instead of carrying it over when you background a session by pressing `←` or with `/background`.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG`

Source: `chunk-7kwd28ae.js` · offset 176029691 · sha256 `fb062a20…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to force-enable the byte-level streaming idle watchdog, or set to `0` to force-disable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_STREAM_WATCHDOG`

Source: `chunk-dt8bvbsd.js` · offset 179372541 · sha256 `806c8256…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `0` to force-disable the event-level streaming idle watchdog, or set to `1` to force-enable it.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-dt8bvbsd.js` · offset 177752140 · sha256 `2b00ca24…`

Read as: string (trimmed; empty is treated as unset).

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-ad1vsmtp.js` · offset 197249087 · sha256 `7b164eac…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ad1vsmtp.js` offset 197249087.

**Undocumented**

### `CLAUDE_IMPORT_CONVERSATIONS`

Source: `chunk-y6ah8pea.js` · offset 192968317 · sha256 `1f18d8e8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-y6ah8pea.js` offset 192968317.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-st2986zy.js` · offset 199188870 · sha256 `9739119e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-st2986zy.js` offset 199188870.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-m200zvyg.js` · offset 172835571 · sha256 `12927d55…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172835571.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-ad1vsmtp.js` · offset 197661109 · sha256 `153cf60a…` · 33 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_LOCAL_OAUTH_API_BASE`

Source: `chunk-nfwnrvq3.js` · offset 170360250 · sha256 `25070d02…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nfwnrvq3.js` offset 170360250.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_APPS_BASE`

Source: `chunk-nfwnrvq3.js` · offset 170360336 · sha256 `92a2b48d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nfwnrvq3.js` offset 170360336.

**Undocumented**

### `CLAUDE_LOCAL_OAUTH_CONSOLE_BASE`

Source: `chunk-nfwnrvq3.js` · offset 170360423 · sha256 `dd40e55a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nfwnrvq3.js` offset 170360423.

**Undocumented**

### `CLAUDE_MEMORY_STORES`

Source: `chunk-gfcfehhw.js` · offset 173470078 · sha256 `69001abe…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 7 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-gfcfehhw.js` offset 173470078.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-5navb1pe.js` · offset 191086831 · sha256 `fac36c80…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-5navb1pe.js` offset 191086831.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-n6mmnfpy.js` · offset 186966401 · sha256 `104db100…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-n6mmnfpy.js` offset 186966401.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-n6mmnfpy.js` · offset 186962934 · sha256 `da907461…`

Read as: string (trimmed; empty is treated as unset). Values: `1`.

Undocumented; read at `chunk-n6mmnfpy.js` offset 186962934.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-n6mmnfpy.js` · offset 186966632 · sha256 `58aef346…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-n6mmnfpy.js` offset 186966632.

**Undocumented**

### `CLAUDE_PTY_RECORD`

Source: `chunk-n6mmnfpy.js` · offset 186963501 · sha256 `7b0a5f6f…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-n6mmnfpy.js` offset 186963501.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-vjddva8y.js` · offset 177109619 · sha256 `2067b8e5…`

Read as: string (trimmed; empty is treated as unset).

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-djxvvh7r.js` · offset 188603051 · sha256 `679ff90d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-djxvvh7r.js` offset 188603051.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-djxvvh7r.js` · offset 188602759 · sha256 `f5aa6e96…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-djxvvh7r.js` offset 188602759.

**Undocumented**

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-wsczm39n.js` · offset 193157509 · sha256 `4d11426e…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 3.

Undocumented; read at `chunk-wsczm39n.js` offset 193157509.

**Undocumented**

### `CLAUDE_RUNNER_API_BASE_URL`

Source: `chunk-5y9b7axv.js` · offset 173356507 · sha256 `bed6faf5…`

Read as: string (raw value; further parsing not traced).

From docs: Anthropic API base URL for session-scoped calls

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_DISABLE_AWAITING_ACTION_OVERRIDE`

Source: `chunk-z62nk1ek.js` · offset 181614221 · sha256 `ea910ff4…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62nk1ek.js` offset 181614221.

**Undocumented**

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-frqjd28b.js` · offset 181478533 · sha256 `9d2ceeca…`

Read as: string (trimmed; empty is treated as unset).

From docs: Git fetch depth for fresh clones.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-5y9b7axv.js` · offset 173356350 · sha256 `b7ce016c…`

Read as: string (raw value; further parsing not traced).

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SKIP_GIT_VERIFY`

Source: `chunk-kbjsjr7g.js` · offset 181419613 · sha256 `21df957f…`

Read as: enum (compared against fixed values). Values: `1`.

From docs: When `1`, skip the `.git` presence check after a `checkout` hook runs.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-j7af2vx5.js` · offset 172425432 · sha256 `d7b49142…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7af2vx5.js` offset 172425432.

**Undocumented**

### `CLAUDE_SESSION_INGRESS_TOKEN_FILE`

Source: `chunk-8snes1yz.js` · offset 172389836 · sha256 `5fa5ddd7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Absolute path to a per-session file holding the current session JWT, kept fresh across token refreshes.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SLOW_FIRST_BYTE_MS`

Source: `chunk-dt8bvbsd.js` · offset 179365767 · sha256 `cc4e40d3…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

Undocumented; read at `chunk-dt8bvbsd.js` offset 179365767.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-01wyteks.js` · offset 173685864 · sha256 `37979d75…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-01wyteks.js` offset 173685864.

**Undocumented**

### `CLAUDE_STREAM_FIRST_BYTE_TIMEOUT_MS`

Source: `chunk-7kwd28ae.js` · offset 176025125 · sha256 `74df571c…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Deadline in milliseconds for the first response byte of a streaming request, on the connections where the first-byte deadline runs.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_STREAM_IDLE_TIMEOUT_MS`

Source: `chunk-7kwd28ae.js` · offset 176024637 · sha256 `590260fd…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds before the event- and byte-level streaming idle watchdogs close a stalled connection.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_TMPDIR`

Source: `chunk-zg9v04h4.js` · offset 174848864 · sha256 `3b749fcd…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-zg9v04h4.js` offset 174848864.

**Undocumented**

### `CLAUDE_TRUSTED_DEVICE_TOKEN`

Source: `chunk-mgm4ymzx.js` · offset 177194639 · sha256 `e362b7c4…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-mgm4ymzx.js` offset 177194639.

**Undocumented**

### `CLAUDE_WORKFLOW_NAME_ONLY`

Source: `chunk-0mzdry38.js` · offset 188487800 · sha256 `b910c419…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0mzdry38.js` offset 188487800.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-76w2zwnr.js` · offset 172452786 · sha256 `a9cd3cb6…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Documented: https://code.claude.com/docs/en/env-vars

### `CLIPBOARD_NAPI_NODE_PATH`

Source: `chunk-cb54pb0c.js` · offset 176920732 · sha256 `08bacc2c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-cb54pb0c.js` offset 176920732.

**Undocumented**

### `CONTAINER_SANDBOX_MOUNT_POINT`

Source: `chunk-m200zvyg.js` · offset 172782338 · sha256 `9f0f77c0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172782338.

**Undocumented**

### `DEBUG_CLAUDE_AGENT_SDK`

Source: `chunk-mxjantyz.js` · offset 192423729 · sha256 `b8a9017b…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-mxjantyz.js` offset 192423729.

**Undocumented**

### `DEBUG_SDK`

Source: `chunk-brafns17.js` · offset 170310138 · sha256 `4c7983f1…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-brafns17.js` offset 170310138.

**Undocumented**

### `DEMO_VERSION`

Source: `chunk-57gge8cv.js` · offset 195641448 · sha256 `aa2ade84…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-57gge8cv.js` offset 195641448.

**Undocumented**

### `DISABLE_AUTO_COMPACT`

Source: `chunk-dt8bvbsd.js` · offset 178324381 · sha256 `958ef69a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic compaction when approaching the context limit.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-m200zvyg.js` · offset 172903007 · sha256 `5ab2aa30…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable automatic background updates.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_BRIEF_MODE_STOP_HOOK`

Source: `chunk-9yybzjm7.js` · offset 184582647 · sha256 `f348af56…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yybzjm7.js` offset 184582647.

**Undocumented**

### `DISABLE_BUG_COMMAND`

Source: `chunk-7kwd28ae.js` · offset 175995981 · sha256 `f52f9937…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COMPACT`

Source: `chunk-ad1vsmtp.js` · offset 197029177 · sha256 `6c34486b…` · 12 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable all compaction: both automatic compaction and the manual `/compact` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_COST_WARNINGS`

Source: `chunk-7kwd28ae.js` · offset 175959757 · sha256 `8ac37cb3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable cost warning messages

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_DOCTOR_COMMAND`

Source: `chunk-daa108e6.js` · offset 185751741 · sha256 `ee7207c3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/doctor` setup checkup skill and its `/checkup` alias.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_ERROR_REPORTING`

Source: `chunk-nj6jrnt8.js` · offset 170352029 · sha256 `1aa9728e…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of error reporting. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn error reporting back on

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_EXTRA_USAGE_COMMAND`

Source: `chunk-m200zvyg.js` · offset 173037195 · sha256 `b9b14308…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/usage-credits` command that lets users purchase additional usage beyond rate limits

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_FEEDBACK_COMMAND`

Source: `chunk-7kwd28ae.js` · offset 175995866 · sha256 `5e33f8be…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable the `/feedback` command and Claude-drafted feedback.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_GROWTHBOOK`

Source: `chunk-j5961fgw.js` · offset 175458103 · sha256 `a0cfeb1e…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` or `true` to disable GrowthBook feature-flag fetching and use code defaults for every flag.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALL_GITHUB_APP_COMMAND`

Source: `chunk-dt8bvbsd.js` · offset 180041852 · sha256 `3316960d…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/install-github-app` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INSTALLATION_CHECKS`

Source: `chunk-ad1vsmtp.js` · offset 197784434 · sha256 `4c27a2dd…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to disable installation warnings.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_INTERLEAVED_THINKING`

Source: `chunk-m200zvyg.js` · offset 172726869 · sha256 `e341ccff…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to prevent sending the interleaved-thinking beta header.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGIN_COMMAND`

Source: `chunk-dt8bvbsd.js` · offset 180041386 · sha256 `9de9e197…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/login` command.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_LOGOUT_COMMAND`

Source: `chunk-dt8bvbsd.js` · offset 180041554 · sha256 `ddc0075c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/logout` command

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPDATES`

Source: `chunk-7rxstv3v.js` · offset 193036752 · sha256 `3a3c9989…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to block all updates including manual `claude update` and `claude install`.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_UPGRADE_COMMAND`

Source: `chunk-7kwd28ae.js` · offset 175797363 · sha256 `4885b0e3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to hide the `/upgrade` command

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_CLAUDEAI_MCP_SERVERS`

Source: `chunk-dt8bvbsd.js` · offset 177668318 · sha256 `a8b4022d…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `false` to stop Claude Code from fetching claude.ai MCP servers.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_MCP_LARGE_OUTPUT_FILES`

Source: `chunk-4jbzqc2f.js` · offset 203043523 · sha256 `9b7436ef…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

Undocumented; read at `chunk-4jbzqc2f.js` offset 203043523.

**Undocumented**

### `ENABLE_TOOL_SEARCH`

Source: `chunk-dt8bvbsd.js` · offset 178837563 · sha256 `7f68bf8d…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Controls MCP tool search.

Documented: https://code.claude.com/docs/en/env-vars

### `FALLBACK_FOR_ALL_PRIMARY_MODELS`

Source: `chunk-dt8bvbsd.js` · offset 179283291 · sha256 `78f6ad2c…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to any non-empty value, such as `1`, to make Claude Code stop retrying on repeated overload errors for every model when no fallback model is configured. **Setting it to `0` or `false` still enables this**, unlike most on/off variables; unset the variable to restore the default retry behavior.

Documented: https://code.claude.com/docs/en/env-vars

### `FORCE_AUTOUPDATE_PLUGINS`

Source: `chunk-m200zvyg.js` · offset 172902748 · sha256 `531c9c29…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to force plugin auto-updates even when the main auto-updater is disabled via `DISABLE_AUTOUPDATER`

Documented: https://code.claude.com/docs/en/env-vars

### `IS_DEMO`

Source: `chunk-57gge8cv.js` · offset 195649933 · sha256 `98b8eb2b…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 9 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to enable demo mode: hides your email and organization name from the header and `/status` output, and skips onboarding. **Setting it to `0` or `false` still enables demo mode**, unlike most on/off variables; unset the variable to turn it off.

Documented: https://code.claude.com/docs/en/env-vars

### `IS_SANDBOX`

Source: `chunk-jf0crvfg.js` · offset 199078254 · sha256 `56348ca3…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `1`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-jf0crvfg.js` offset 199078254.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-xr7xn5z8.js` · offset 187302200 · sha256 `357e1b70…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187302200.

**Undocumented**

### `MAX_MCP_OUTPUT_TOKENS`

Source: `chunk-nm5yap2a.js` · offset 195240435 · sha256 `8c5ef5cd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Maximum number of tokens allowed in MCP tool responses.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_STRUCTURED_OUTPUT_RETRIES`

Source: `chunk-3fxxabdq.js` · offset 188554985 · sha256 `d2c05d1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Number of attempts Claude Code allows when the model's response fails validation against the `--json-schema` in non-interactive mode with the `-p` flag; after that many failed attempts with no valid output, the run fails.

Documented: https://code.claude.com/docs/en/env-vars

### `MAX_THINKING_TOKENS`

Source: `chunk-bjmhhyed.js` · offset 186079875 · sha256 `25a11b54…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

From docs: Fixed token budget for extended thinking.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CLIENT_SECRET`

Source: `chunk-r3tywx67.js` · offset 202914873 · sha256 `38093413…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OAuth client secret for MCP servers that require pre-configured credentials.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-hzptjvk4.js` · offset 177181075 · sha256 `49ffbd08…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-nzkjg0ng.js` · offset 186223205 · sha256 `55b6fd6e…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-dt8bvbsd.js` · offset 180383547 · sha256 `f3c1c20e…` · 2 read sites

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Turns the MCP discovery cache on or off.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-3wdef0p7.js` · offset 184365662 · sha256 `6075690d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-3wdef0p7.js` · offset 184365025 · sha256 `d71a3eb9…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-3wdef0p7.js` · offset 184365573 · sha256 `ebb2b99a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-d9bx9hzp.js` · offset 202605949 · sha256 `63af4c00…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-r3tywx67.js` · offset 202876316 · sha256 `801a0e59…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-r3tywx67.js` offset 202876316.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-s9b7tyzh.js` · offset 202757879 · sha256 `536099b7…`

Read as: string (trimmed; empty is treated as unset).

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-4jbzqc2f.js` · offset 202978993 · sha256 `153f3a1d…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `20`.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-evezjn25.js` · offset 176918842 · sha256 `231a32e2…`

Read as: string (trimmed; empty is treated as unset).

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-4jbzqc2f.js` · offset 202978934 · sha256 `7d6d913c…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `3`.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-hzptjvk4.js` · offset 177180997 · sha256 `b9a49083…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-4jbzqc2f.js` · offset 202964172 · sha256 `4002a2b8…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-dt8bvbsd.js` · offset 178671541 · sha256 `f467df82…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178671541.

**Undocumented**

### `MCP_XAA_IDP_CLIENT_SECRET`

Source: `chunk-zasza72r.js` · offset 186303882 · sha256 `f2acd65a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zasza72r.js` offset 186303882.

**Undocumented**

### `RUNNER_ENVIRONMENT`

Source: `chunk-m200zvyg.js` · offset 172809186 · sha256 `1c7f10fd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172809186.

**Undocumented**

### `RUNNER_OS`

Source: `chunk-m200zvyg.js` · offset 172809239 · sha256 `4febb421…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172809239.

**Undocumented**

### `RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-z62nk1ek.js` · offset 181707952 · sha256 `7cd461dd…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-z62nk1ek.js` offset 181707952.

**Undocumented**

### `SAFEUSER`

Source: `chunk-dt8bvbsd.js` · offset 179998557 · sha256 `7cf0f156…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179998557.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-mxjantyz.js` · offset 192441651 · sha256 `74660f53…`

Read as: string (trimmed; empty is treated as unset). Default (from code): `claude`.

Undocumented; read at `chunk-mxjantyz.js` offset 192441651.

**Undocumented**

### `SELF_HOSTED_RUNNER_BASE_DIR`

Source: `chunk-z62nk1ek.js` · offset 181674635 · sha256 `b4772425…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181674635.

**Undocumented**

### `SELF_HOSTED_RUNNER_BG_RESULT_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181609918 · sha256 `3555a582…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner considers a session busy after a background task finishes while the follow-up turn that reads the result hasn't started.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_CLIENT_LABEL`

Source: `chunk-z62nk1ek.js` · offset 181675086 · sha256 `177e08fb…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675086.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFIGURE_GIT`

Source: `chunk-z62nk1ek.js` · offset 181675268 · sha256 `452ab2bb…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675268.

**Undocumented**

### `SELF_HOSTED_RUNNER_CONFINE_REPO_SETTINGS`

Source: `chunk-z62nk1ek.js` · offset 181675643 · sha256 `77b9796c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675643.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_DIR`

Source: `chunk-dvjdeh5h.js` · offset 181808305 · sha256 `b1e11b3a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dvjdeh5h.js` offset 181808305.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEBUG_TOKEN_DIR`

Source: `chunk-z62nk1ek.js` · offset 181674964 · sha256 `15e6ba3b…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181674964.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-z62nk1ek.js` · offset 181709054 · sha256 `75f7e040…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181709054.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181632000 · sha256 `00572f88…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181632000.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-z62nk1ek.js` · offset 181672730 · sha256 `4808daa9…` · 2 read sites

Read as: string (raw value; further parsing not traced). Default (from code): `unset`.

Undocumented; read at `chunk-z62nk1ek.js` offset 181672730.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_BG_TASKS_MS`

Source: `chunk-z62nk1ek.js` · offset 181672467 · sha256 `95e278f4…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181672467.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-z62nk1ek.js` · offset 181672357 · sha256 `9a8c3728…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181672357.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-dvjdeh5h.js` · offset 181833236 · sha256 `13476adc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dvjdeh5h.js` offset 181833236.

**Undocumented**

### `SELF_HOSTED_RUNNER_EXEC_PATH`

Source: `chunk-z62nk1ek.js` · offset 181674776 · sha256 `c75ae78f…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181674776.

**Undocumented**

### `SELF_HOSTED_RUNNER_HEALTH_PORT`

Source: `chunk-dvjdeh5h.js` · offset 181808146 · sha256 `114335bb…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dvjdeh5h.js` offset 181808146.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-dvjdeh5h.js` · offset 181808039 · sha256 `b0459dbf…` · 7 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-dvjdeh5h.js` offset 181808039.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-z62nk1ek.js` · offset 181526738 · sha256 `6bdd2e04…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_HOST_CONFIG_SNAPSHOT`

Source: `chunk-z62nk1ek.js` · offset 181675719 · sha256 `41e1b2bc…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675719.

**Undocumented**

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-z62nk1ek.js` · offset 181711095 · sha256 `8639d24b…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181711095.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOCK_TO_ACCOUNT`

Source: `chunk-z62nk1ek.js` · offset 181675027 · sha256 `f387d2ff…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675027.

**Undocumented**

### `SELF_HOSTED_RUNNER_LOG_FILE`

Source: `chunk-z62nk1ek.js` · offset 181674841 · sha256 `bed345b6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181674841.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181609087 · sha256 `aa06014d…`

Read as: number (parsed as a number). Default (from code): `900000`.

From docs: How long the runner waits after a session reaches its `--kill-session-after-min` limit, for a running turn to finish or the release to complete, before it terminates the session

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-z62nk1ek.js` · offset 181609027 · sha256 `5934b0e2…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181609027.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-dvjdeh5h.js` · offset 181833313 · sha256 `fc39e472…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dvjdeh5h.js` offset 181833313.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-z62nk1ek.js` · offset 181708450 · sha256 `a43c4487…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `60000`.

Undocumented; read at `chunk-z62nk1ek.js` offset 181708450.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_TURN_SETTLE_MS`

Source: `chunk-z62nk1ek.js` · offset 181609969 · sha256 `b9f6457c…` · 2 read sites

Read as: number (parsed as a number). Default (from code): `7000`.

From docs: Cap on how long the runner counts a session as busy for the `--drain-wait-sec` drain after a turn finishes, while the session's process reports the turn's end to Anthropic.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_PUSH_OUTCOME_ON_RELEASE`

Source: `chunk-z62nk1ek.js` · offset 181675338 · sha256 `ab9e00d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675338.

**Undocumented**

### `SELF_HOSTED_RUNNER_RELEASE_IDLE_SESSION_MIN`

Source: `chunk-z62nk1ek.js` · offset 181707986 · sha256 `854a99a1…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-z62nk1ek.js` offset 181707986.

**Undocumented**

### `SELF_HOSTED_RUNNER_REMOVE_SESSION_STATE`

Source: `chunk-z62nk1ek.js` · offset 181675564 · sha256 `804b6083…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675564.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-z62nk1ek.js` · offset 181672535 · sha256 `b92e6ac9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181672535.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MIN`

Source: `chunk-z62nk1ek.js` · offset 181708032 · sha256 `d0b6f6af…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-z62nk1ek.js` offset 181708032.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-z62nk1ek.js` · offset 181709103 · sha256 `f7b29316…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181709103.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_SEC`

Source: `chunk-z62nk1ek.js` · offset 181708070 · sha256 `d5c3bc87…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-z62nk1ek.js` offset 181708070.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181609310 · sha256 `9ecb32b3…` · 3 read sites

Read as: number (parsed as a number). Default (from code): `5000`.

Undocumented; read at `chunk-z62nk1ek.js` offset 181609310.

**Undocumented**

### `SELF_HOSTED_RUNNER_SIGKILL_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181609171 · sha256 `dec12526…`

Read as: number (parsed as a number). Default (from code): `30000`.

From docs: How long the runner waits for the OS to deliver `SIGKILL` to a child stuck in uninterruptible I/O before exiting itself.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_SIGKILL_TIMEOUT_MS`

Source: `chunk-z62nk1ek.js` · offset 181707585 · sha256 `79e46d6b…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-z62nk1ek.js` offset 181707585.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-z62nk1ek.js` · offset 181616740 · sha256 `8252795b…` · 3 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181616740.

**Undocumented**

### `SELF_HOSTED_RUNNER_TRUST_WORKSPACE`

Source: `chunk-z62nk1ek.js` · offset 181675449 · sha256 `6405b7e1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675449.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-dt8bvbsd.js` · offset 180109965 · sha256 `37709674…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180109965.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-dt8bvbsd.js` · offset 178769169 · sha256 `d34c78d3…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Documented: https://code.claude.com/docs/en/env-vars

### `SRT_DEBUG`

Source: `chunk-ypm4x6zx.js` · offset 174167508 · sha256 `a3a90306…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-ypm4x6zx.js` offset 174167508.

**Undocumented**

### `SWE_BENCH_INSTANCE_ID`

Source: `chunk-m200zvyg.js` · offset 172811064 · sha256 `92750357…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-m200zvyg.js` offset 172811064.

**Undocumented**

### `SWE_BENCH_RUN_ID`

Source: `chunk-m200zvyg.js` · offset 172811012 · sha256 `b371b98c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-m200zvyg.js` offset 172811012.

**Undocumented**

### `SWE_BENCH_TASK_ID`

Source: `chunk-m200zvyg.js` · offset 172811117 · sha256 `1acfb392…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-m200zvyg.js` offset 172811117.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-dt8bvbsd.js` · offset 180005913 · sha256 `0fd4c0b3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 180005913.

**Undocumented**

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-dt8bvbsd.js` · offset 181127289 · sha256 `80869434…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 181127289.

**Undocumented**

### `USE_API_CONTEXT_MANAGEMENT`

Source: `chunk-m200zvyg.js` · offset 172727201 · sha256 `1cdd37f8…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172727201.

**Undocumented**

### `USE_BUILTIN_RIPGREP`

Source: `chunk-zg9v04h4.js` · offset 174998868 · sha256 `b64426c9…`

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `0` to use system-installed `rg` instead of `rg` included with Claude Code

Documented: https://code.claude.com/docs/en/env-vars

### `USE_LOCAL_OAUTH`

Source: `chunk-xr7xn5z8.js` · offset 187302181 · sha256 `859f5930…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187302181.

**Undocumented**

### `USE_STAGING_OAUTH`

Source: `chunk-xr7xn5z8.js` · offset 187302246 · sha256 `474ca94d…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xr7xn5z8.js` offset 187302246.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-4r5er76z.js` · offset 181467413 · sha256 `173e4cd4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4r5er76z.js` offset 181467413.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-g4462x8a.js` · offset 201964829 · sha256 `20d7f7cb…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-g4462x8a.js` offset 201964829.

**Undocumented**

## Providers: Amazon Bedrock and AWS

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-7kwd28ae.js` · offset 176018754 · sha256 `e97fa437…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176023237 · sha256 `0a7a75f0…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Claude Platform on AWS endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_WORKSPACE_ID`

Source: `chunk-s41h44hd.js` · offset 195131390 · sha256 `6cf298c7…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Required for Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176023009 · sha256 `befad766…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override the Amazon Bedrock endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_MANTLE_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176023120 · sha256 `bfdce098…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override the Amazon Bedrock Mantle endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_REGION_PREFIX`

Source: `chunk-m200zvyg.js` · offset 172527013 · sha256 `6e9f466d…`

Read as: enum (compared against fixed values). Values: `us`, `eu`, `apac`, `jp`, `au`, `global`.

From docs: Cross-region inference profile prefix (`us`, `eu`, `apac`, `jp`, `au`, or `global`) Claude Code tries first instead of the one derived from the AWS region.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BEDROCK_SERVICE_TIER`

Source: `chunk-7kwd28ae.js` · offset 176016734 · sha256 `b387382a…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock service tier (`default`, `flex`, or `priority`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION`

Source: `chunk-7kwd28ae.js` · offset 176023653 · sha256 `5c5cdacf…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Override AWS region for the Haiku-class model when using Amazon Bedrock or Amazon Bedrock Mantle.

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_ACCESS_KEY_ID`

Source: `chunk-905d7765.js` · offset 188051409 · sha256 `0734f87e…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-905d7765.js` offset 188051409.

**Undocumented**

### `AWS_BEARER_TOKEN_BEDROCK`

Source: `chunk-7kwd28ae.js` · offset 176016857 · sha256 `4790d6c3…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Amazon Bedrock API key for authentication (see Amazon Bedrock API keys)

Documented: https://code.claude.com/docs/en/env-vars

### `AWS_CONFIG_FILE`

Source: `chunk-xwafn4vc.js` · offset 187608449 · sha256 `1d954014…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-xwafn4vc.js` offset 187608449.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_FULL_URI`

Source: `chunk-kd3wht3j.js` · offset 202016736 · sha256 `8a04c787…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-kd3wht3j.js` offset 202016736.

**Undocumented**

### `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`

Source: `chunk-kd3wht3j.js` · offset 202016685 · sha256 `cb4cf687…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-kd3wht3j.js` offset 202016685.

**Undocumented**

### `AWS_DEFAULT_REGION`

Source: `chunk-905d7765.js` · offset 188051361 · sha256 `20ee042a…` · 7 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188051361.

**Undocumented**

### `AWS_ENDPOINT_URL`

Source: `chunk-s79sfps3.js` · offset 171818839 · sha256 `1a0caa05…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-s79sfps3.js` offset 171818839.

**Undocumented**

### `AWS_ENDPOINT_URL_STS`

Source: `chunk-s79sfps3.js` · offset 171818815 · sha256 `31d2a84c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-s79sfps3.js` offset 171818815.

**Undocumented**

### `AWS_EXECUTION_ENV`

Source: `chunk-0hm7n25m.js` · offset 170435638 · sha256 `981c5536…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `AWS_ECS_FARGATE`, `AWS_ECS_EC2`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435638.

**Undocumented**

### `AWS_LAMBDA_FUNCTION_NAME`

Source: `chunk-0hm7n25m.js` · offset 170435579 · sha256 `18fd0d86…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435579.

**Undocumented**

### `AWS_PROFILE`

Source: `chunk-xwafn4vc.js` · offset 187608094 · sha256 `53e60fe7…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-xwafn4vc.js` offset 187608094.

**Undocumented**

### `AWS_REGION`

Source: `chunk-905d7765.js` · offset 188051337 · sha256 `ccf42d2f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `us-east-1`.

Undocumented; read at `chunk-905d7765.js` offset 188051337.

**Undocumented**

### `AWS_ROLE_ARN`

Source: `chunk-e8vyaybz.js` · offset 202012085 · sha256 `91a608bc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e8vyaybz.js` offset 202012085.

**Undocumented**

### `AWS_SECRET_ACCESS_KEY`

Source: `chunk-905d7765.js` · offset 188051440 · sha256 `71df3a7a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188051440.

**Undocumented**

### `AWS_SESSION_TOKEN`

Source: `chunk-905d7765.js` · offset 188051579 · sha256 `5cdde123…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188051579.

**Undocumented**

### `AWS_SHARED_CREDENTIALS_FILE`

Source: `chunk-xwafn4vc.js` · offset 187608545 · sha256 `aab2cfbd…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-xwafn4vc.js` offset 187608545.

**Undocumented**

### `AWS_WEB_IDENTITY_TOKEN_FILE`

Source: `chunk-e8vyaybz.js` · offset 202012056 · sha256 `651dbdfb…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-e8vyaybz.js` offset 202012056.

**Undocumented**

### `CLAUDE_CODE_AWS_CHAIN_RESOLVE_TIMEOUT_MS`

Source: `chunk-6b5jn77e.js` · offset 172328744 · sha256 `17165e62…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647. Default (from code): `60000`.

From docs: Time in milliseconds Claude Code waits for the AWS default credential provider chain to produce credentials before the request fails with `AWS default-chain credential resolve timed out` (default: `60000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_DEFAULT`

Source: `chunk-7kwd28ae.js` · offset 176031646 · sha256 `d0d6c187…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from treating an Amazon Bedrock streaming response with a missing or empty `Content-Type` header as Amazon Bedrock's binary event stream.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_BEDROCK_CONTENT_TYPE_GUARD`

Source: `chunk-7kwd28ae.js` · offset 176031894 · sha256 `21e859a3…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to skip the check that an Amazon Bedrock streaming response carries the `application/vnd.amazon.eventstream` content-type.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_AWS_AUTH`

Source: `chunk-7kwd28ae.js` · offset 176018382 · sha256 `60464f70…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip client-side authentication for Claude Platform on AWS, for gateways that sign requests themselves

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_AWS_CRED_CACHE`

Source: `chunk-7kwd28ae.js` · offset 176017250 · sha256 `bb5f5050…` · 10 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to turn off the in-process cache of credentials resolved from the AWS default credential provider chain, so Claude Code resolves the chain on every API request.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_BEDROCK_AUTH`

Source: `chunk-7kwd28ae.js` · offset 176016522 · sha256 `31339e26…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_MANTLE_AUTH`

Source: `chunk-7kwd28ae.js` · offset 176020008 · sha256 `31c0fe52…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip AWS authentication for Amazon Bedrock Mantle (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_AWS`

Source: `chunk-nj6jrnt8.js` · offset 170351889 · sha256 `c6be261e…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Claude Platform on AWS

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_BEDROCK`

Source: `chunk-nj6jrnt8.js` · offset 170351767 · sha256 `fd5e84a3…` · 7 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Amazon Bedrock

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_MANTLE`

Source: `chunk-nj6jrnt8.js` · offset 170351992 · sha256 `7718029e…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use the Amazon Bedrock Mantle endpoint

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_BYTE_WATCHDOG_BEDROCK`

Source: `chunk-7kwd28ae.js` · offset 176030058 · sha256 `41bc5340…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable the byte-level streaming idle watchdog on Amazon Bedrock `vnd.amazon.eventstream` responses, which also enables the first-byte deadline on Bedrock streaming requests.

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Google Vertex AI and Google Cloud

### `ANTHROPIC_GOOGLE_CLOUD_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176023357 · sha256 `99675c8d…` · 6 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `https://claude.googleapis.com`.

Undocumented; read at `chunk-7kwd28ae.js` offset 176023357.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_LOCATION`

Source: `chunk-7kwd28ae.js` · offset 176019243 · sha256 `50d42c5b…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `global`.

Undocumented; read at `chunk-7kwd28ae.js` offset 176019243.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_PROJECT`

Source: `chunk-7kwd28ae.js` · offset 176019172 · sha256 `b0231252…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176019172.

**Undocumented**

### `ANTHROPIC_GOOGLE_CLOUD_WORKSPACE_ID`

Source: `chunk-7kwd28ae.js` · offset 176019319 · sha256 `719be76f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176019319.

**Undocumented**

### `ANTHROPIC_VERTEX_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176023444 · sha256 `b34e6459…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Override Google Cloud's Agent Platform endpoint URL.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_VERTEX_PROJECT_ID`

Source: `chunk-m200zvyg.js` · offset 173009413 · sha256 `7d0f0ea1…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: GCP project ID that Google Cloud's Agent Platform requests are addressed to.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKIP_ANTHROPIC_GOOGLE_CLOUD_AUTH`

Source: `chunk-7kwd28ae.js` · offset 176019541 · sha256 `9beecc05…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-7kwd28ae.js` offset 176019541.

**Undocumented**

### `CLAUDE_CODE_SKIP_VERTEX_AUTH`

Source: `chunk-7kwd28ae.js` · offset 176020952 · sha256 `8f5764b4…` · 6 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Google authentication for Google Cloud's Agent Platform (for example, when using an LLM gateway)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD`

Source: `chunk-nj6jrnt8.js` · offset 170351936 · sha256 `95ef3a64…` · 5 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-nj6jrnt8.js` offset 170351936.

**Undocumented**

### `CLAUDE_CODE_USE_VERTEX`

Source: `chunk-nj6jrnt8.js` · offset 170351808 · sha256 `9d4aaeb0…` · 8 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `CLOUD_ML_REGION`

Source: `chunk-b1tfggtv.js` · offset 170272291 · sha256 `d14e27f0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-b1tfggtv.js` offset 170272291.

**Undocumented**

### `CLOUDSDK_CONFIG`

Source: `chunk-905d7765.js` · offset 187987611 · sha256 `a53236c8…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 187987611.

**Undocumented**

### `gcloud_project`

Source: `chunk-905d7765.js` · offset 188073434 · sha256 `232389f7…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188073434.

**Undocumented**

### `GCLOUD_PROJECT`

Source: `chunk-905d7765.js` · offset 188073372 · sha256 `3d9c3b37…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188073372.

**Undocumented**

### `google_application_credentials`

Source: `chunk-905d7765.js` · offset 188069540 · sha256 `b73615be…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188069540.

**Undocumented**

### `GOOGLE_APPLICATION_CREDENTIALS`

Source: `chunk-905d7765.js` · offset 188069496 · sha256 `c2e78809…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188069496.

**Undocumented**

### `google_cloud_project`

Source: `chunk-905d7765.js` · offset 188073462 · sha256 `b763364f…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 188073462.

**Undocumented**

### `GOOGLE_CLOUD_PROJECT`

Source: `chunk-0hm7n25m.js` · offset 170435879 · sha256 `17e9b022…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435879.

**Undocumented**

### `GOOGLE_CLOUD_WORKSTATIONS`

Source: `chunk-0hm7n25m.js` · offset 170434910 · sha256 `05ba04cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434910.

**Undocumented**

### `VERTEX_REGION_CLAUDE_3_5_HAIKU`

Source: `chunk-b1tfggtv.js` · offset 170269746 · sha256 `f4a42187…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Haiku when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_5_SONNET`

Source: `chunk-b1tfggtv.js` · offset 170269523 · sha256 `b0163304…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.5 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_3_7_SONNET`

Source: `chunk-b1tfggtv.js` · offset 170269579 · sha256 `9058fadb…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 3.7 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170270373 · sha256 `1f4dbfd4…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_0_SONNET`

Source: `chunk-b1tfggtv.js` · offset 170270219 · sha256 `17ff2060…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.0 Sonnet when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_1_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170269907 · sha256 `26ffeba1…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude 4.1 Opus when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170269959 · sha256 `ba882f91…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_5_SONNET`

Source: `chunk-b1tfggtv.js` · offset 170269635 · sha256 `7fe0e77c…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170270011 · sha256 `73a23bda…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_6_SONNET`

Source: `chunk-b1tfggtv.js` · offset 170269691 · sha256 `120c2066…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 4.6 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_7_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170270063 · sha256 `364310a0…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.7 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_4_8_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170270115 · sha256 `3b69250d…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 4.8 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_5_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170270167 · sha256 `58a45cb7…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5.5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_OPUS`

Source: `chunk-b1tfggtv.js` · offset 170270423 · sha256 `8e8c2421…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Opus 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_5_SONNET`

Source: `chunk-b1tfggtv.js` · offset 170270273 · sha256 `1a6f9b02…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Sonnet 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5`

Source: `chunk-b1tfggtv.js` · offset 170270324 · sha256 `ef732c7f…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_FABLE_5_1`

Source: `chunk-b1tfggtv.js` · offset 170269800 · sha256 `0e9c5375…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Fable 5.1 when using Google Cloud's Agent Platform.

Documented: https://code.claude.com/docs/en/env-vars

### `VERTEX_REGION_CLAUDE_HAIKU_4_5`

Source: `chunk-b1tfggtv.js` · offset 170269854 · sha256 `bdaa3937…`

Read as: string (raw value; further parsing not traced).

From docs: Override region for Claude Haiku 4.5 when using Google Cloud's Agent Platform

Documented: https://code.claude.com/docs/en/env-vars

## Providers: Microsoft Foundry and Azure

### `ANTHROPIC_FOUNDRY_API_KEY`

Source: `chunk-7kwd28ae.js` · offset 176017663 · sha256 `6edea27f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: API key for Microsoft Foundry authentication (see Microsoft Foundry)

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_AUTH_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176017576 · sha256 `072afdc4…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Bearer token for Microsoft Foundry authentication, such as a Microsoft Entra access token.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_BASE_URL`

Source: `chunk-7kwd28ae.js` · offset 176010557 · sha256 `42cda74f…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Full base URL for the Microsoft Foundry resource (for example, `https://my-resource.services.ai.azure.com/anthropic`).

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_FOUNDRY_RESOURCE`

Source: `chunk-7kwd28ae.js` · offset 176010588 · sha256 `3630aefc…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Microsoft Foundry resource name (for example, `my-resource`).

Documented: https://code.claude.com/docs/en/env-vars

### `AZURE_CLIENT_ID`

Source: `chunk-kdgec1t8.js` · offset 191580279 · sha256 `be8e8739…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `AZURE_FUNCTIONS_ENVIRONMENT`

Source: `chunk-0hm7n25m.js` · offset 170436011 · sha256 `0fa1ac42…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436011.

**Undocumented**

### `AZURE_TENANT_ID`

Source: `chunk-kdgec1t8.js` · offset 191580237 · sha256 `b705b6d3…` · 6 read sites

Read as: string (raw value; further parsing not traced).

Documented at https://code.claude.com/docs/en/github-actions-cloud-providers; no description column to quote.

Documented: https://code.claude.com/docs/en/github-actions-cloud-providers

### `CLAUDE_CODE_SKIP_FOUNDRY_AUTH`

Source: `chunk-7kwd28ae.js` · offset 176017707 · sha256 `72123396…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Skip Azure authentication for Microsoft Foundry, for a proxy or gateway that injects its own `Authorization` header.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_USE_FOUNDRY`

Source: `chunk-nj6jrnt8.js` · offset 170351848 · sha256 `d289ae80…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Use Microsoft Foundry

Documented: https://code.claude.com/docs/en/env-vars

## Providers: gateways

### `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY`

Source: `chunk-4d4qk65p.js` · offset 184311249 · sha256 `e51b98ea…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to populate the `/model` picker from your gateway's `/v1/models` endpoint when `ANTHROPIC_BASE_URL` points at an Anthropic-compatible gateway such as LiteLLM, Kong, or an internal proxy.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_HINT_HEADERS`

Source: `chunk-7kwd28ae.js` · offset 176012539 · sha256 `e72abd56…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to send the gateway hint headers, such as `x-claude-code-request-class` and `x-claude-code-compaction`, on a custom proxy or a third-party provider such as Amazon Bedrock or Claude Platform on AWS.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_MODEL_DISCOVERY_TIMEOUT_MS`

Source: `chunk-m200zvyg.js` · offset 173074611 · sha256 `07d66406…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147483647, digitsOnly true. Default (from code): `3000`.

From docs: Timeout in milliseconds for the gateway model discovery request that `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY` turns on (default: `3000`).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-8snes1yz.js` · offset 172388911 · sha256 `c4cff902…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8snes1yz.js` offset 172388911.

**Undocumented**

### `CLAUDE_CODE_USE_GATEWAY`

Source: `chunk-m200zvyg.js` · offset 172979608 · sha256 `3c6159ee…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172979608.

**Undocumented**

### `CLAUDE_GATEWAY_ALLOW_LOOPBACK`

Source: `chunk-ft3bhzm2.js` · offset 194939071 · sha256 `e63dfe37…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ft3bhzm2.js` offset 194939071.

**Undocumented**

### `CLAUDE_GATEWAY_DRAIN_TIMEOUT_MS`

Source: `chunk-244qxnpg.js` · offset 195119137 · sha256 `4cc46a4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, max 2147000000, digitsOnly true. Default (from code): `25000`.

Undocumented; read at `chunk-244qxnpg.js` offset 195119137.

**Undocumented**

### `CLAUDE_GATEWAY_LOG_LEVEL`

Source: `chunk-jyg0b1xr.js` · offset 193994858 · sha256 `de2a0fcd…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-jyg0b1xr.js` offset 193994858.

**Undocumented**

### `CLAUDE_GATEWAY_PROXY_IS_EGRESS_BOUNDARY`

Source: `chunk-ft3bhzm2.js` · offset 194938762 · sha256 `8ab0e5da…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-ft3bhzm2.js` offset 194938762.

**Undocumented**

## Telemetry and observability

### `BETA_TRACING_ENDPOINT`

Source: `chunk-c6xmth72.js` · offset 174147148 · sha256 `0b8e0086…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: OTLP endpoint for detailed beta tracing: with `ENABLE_BETA_TRACING_DETAILED=1`, logs and traces go there instead of to the configured exporters.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BYOC_ENABLE_DATADOG`

Source: `chunk-z62nk1ek.js` · offset 181605929 · sha256 `9657eb08…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62nk1ek.js` offset 181605929.

**Undocumented**

### `CLAUDE_CODE_DATADOG_FLUSH_INTERVAL_MS`

Source: `chunk-m200zvyg.js` · offset 172946834 · sha256 `f59cfbdd…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1. Default (from code): `15000`.

Undocumented; read at `chunk-m200zvyg.js` offset 172946834.

**Undocumented**

### `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL`

Source: `chunk-2jvzyd51.js` · offset 172501444 · sha256 `12bbf696…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to route the "How is Claude doing?" session quality survey to your own OpenTelemetry collector when Anthropic-bound nonessential traffic is blocked.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_TELEMETRY`

Source: `chunk-pt1gnpay.js` · offset 201663988 · sha256 `3b331164…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to enable OpenTelemetry data collection for metrics and logging.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-c6xmth72.js` · offset 174153407 · sha256 `76f8b26a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Enable span tracing (required).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `CLAUDE_CODE_GB_DISK_CACHE_WHEN_TELEMETRY_OFF`

Source: `chunk-m200zvyg.js` · offset 172836532 · sha256 `a3ff8f93…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-m200zvyg.js` offset 172836532.

**Undocumented**

### `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH`

Source: `chunk-c6xmth72.js` · offset 174146343 · sha256 `58cae1fa…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 1, digitsOnly true. Default (from code): `61440`.

From docs: Maximum length of content-bearing OpenTelemetry attributes (model responses, tool content, system prompts, raw API bodies), truncation marker included, in UTF-16 code units (default: 61440, i.e. 60 KB).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_DIAG_STDERR`

Source: `chunk-ba965fz0.js` · offset 181476712 · sha256 `bc37fcc6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to write OpenTelemetry exporter diagnostic errors to stderr.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS`

Source: `chunk-pt1gnpay.js` · offset 201668740 · sha256 `5a408a7f…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Timeout in milliseconds for flushing pending OpenTelemetry spans (default: 5000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS`

Source: `chunk-m200zvyg.js` · offset 173039714 · sha256 `240e3e9d…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

From docs: Interval for refreshing dynamic OpenTelemetry headers in milliseconds (default: 1740000 / 29 minutes).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS`

Source: `chunk-pt1gnpay.js` · offset 201649947 · sha256 `c8cd5ac8…` · 3 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `2000`.

From docs: Timeout in milliseconds for the OpenTelemetry exporter to finish on shutdown (default: 2000).

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PERFETTO_TRACE`

Source: `chunk-c6xmth72.js` · offset 174152160 · sha256 `17ecb006…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c6xmth72.js` offset 174152160.

**Undocumented**

### `DISABLE_TELEMETRY`

Source: `chunk-nj6jrnt8.js` · offset 170349940 · sha256 `33ea0227…` · 3 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to any non-empty value, such as `1`, to opt out of telemetry. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn telemetry back on.

Documented: https://code.claude.com/docs/en/env-vars

### `DO_NOT_TRACK`

Source: `chunk-nj6jrnt8.js` · offset 170349997 · sha256 `91dfe981…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Set to `1` to opt out of telemetry, with the same effect as `DISABLE_TELEMETRY`, including making Remote Control and the other features that need feature-flag fetching unavailable.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_BETA_TRACING_DETAILED`

Source: `chunk-c6xmth72.js` · offset 174147108 · sha256 `f081d785…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1`, together with `BETA_TRACING_ENDPOINT`, to turn on detailed beta tracing, which adds content-bearing span attributes and the `claude_code.hook` span.

Documented: https://code.claude.com/docs/en/env-vars

### `ENABLE_ENHANCED_TELEMETRY_BETA`

Source: `chunk-c6xmth72.js` · offset 174153456 · sha256 `7a82f69c…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-c6xmth72.js` offset 174153456.

**Undocumented**

### `OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-c6xmth72.js` · offset 174146385 · sha256 `d5f795ab…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

From docs: Standard OpenTelemetry SDK limit on attribute value length.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_EXPORTER_OTLP_*_ENDPOINT`

Source: `chunk-pt1gnpay.js` · offset 201670000 · sha256 `646eb8ec…` · 3 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`, `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT`, `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_HEADERS`

Source: `chunk-pt1gnpay.js` · offset 201672368 · sha256 `46d941f2…` · 2 read sites

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Documented names matching this pattern: `OTEL_EXPORTER_OTLP_LOGS_HEADERS`, `OTEL_EXPORTER_OTLP_METRICS_HEADERS`, `OTEL_EXPORTER_OTLP_TRACES_HEADERS`

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_*_INSECURE`

Source: `chunk-s45djs34.js` · offset 207461295 · sha256 `9c1196e8…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `OTEL_EXPORTER_OTLP_ENDPOINT`

Source: `chunk-s45djs34.js` · offset 207461211 · sha256 `807d3ae4…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP collector endpoint for all signals

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_HEADERS`

Source: `chunk-s45djs34.js` · offset 207460793 · sha256 `bba3c17d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Authentication headers for OTLP

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL`

Source: `chunk-pt1gnpay.js` · offset 201662237 · sha256 `a97eb978…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for logs, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL`

Source: `chunk-pt1gnpay.js` · offset 201661195 · sha256 `87f5ee3b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for metrics, overrides general setting

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-pt1gnpay.js` · offset 201657601 · sha256 `d703ee47…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Metrics temporality preference (default: `delta`).

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_PROTOCOL`

Source: `chunk-pt1gnpay.js` · offset 201660823 · sha256 `c0b54b69…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for OTLP exporter, applies to all signals.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`

Source: `chunk-c6xmth72.js` · offset 174151487 · sha256 `e359194f…`

Read as: string (trimmed; empty is treated as unset).

From docs: OTLP traces endpoint, overrides `OTEL_EXPORTER_OTLP_ENDPOINT`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL`

Source: `chunk-pt1gnpay.js` · offset 201663271 · sha256 `2ec5a16b…`

Read as: string (trimmed; empty is treated as unset).

From docs: Protocol for traces, overrides `OTEL_EXPORTER_OTLP_PROTOCOL`

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOG_ASSISTANT_RESPONSES`

Source: `chunk-rv11zjj6.js` · offset 174137989 · sha256 `0c8aef2c…`

Read as: tri-state boolean (1/true/yes/on is true, 0/false/no/off is false (trimmed, case-insensitive); anything else is unset).

From docs: Set to `1` to include the model's response text on `assistant_response` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_MANAGED_SETTINGS`

Source: `chunk-bjmhhyed.js` · offset 186039566 · sha256 `05fbc9d5…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to add the redacted managed settings, and a SHA-256 digest of the settings before redaction, to `managed_settings_resolved` OpenTelemetry log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_RAW_API_BODIES`

Source: `chunk-dt8bvbsd.js` · offset 178423383 · sha256 `c83da780…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Emit Anthropic Messages API request and response JSON as `api_request_body` / `api_response_body` log events.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_CONTENT`

Source: `chunk-m200zvyg.js` · offset 172799142 · sha256 `0697bef6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool content in the `tool.output` OpenTelemetry span event.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_TOOL_DETAILS`

Source: `chunk-m200zvyg.js` · offset 172797991 · sha256 `499d0933…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include tool input arguments, MCP server names, user-authored workflow names, raw error strings on tool failures, the refusal `category` on `api_refusal` events, and other tool details in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOG_USER_PROMPTS`

Source: `chunk-c6xmth72.js` · offset 174146863 · sha256 `55cbaa16…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to include user prompt text in OpenTelemetry traces and logs.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGRECORD_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-c6xmth72.js` · offset 174146426 · sha256 `ead31d61…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_LOGS_EXPORT_INTERVAL`

Source: `chunk-m200zvyg.js` · offset 172832542 · sha256 `cc3fa137…` · 2 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Logs export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_LOGS_EXPORTER`

Source: `chunk-pt1gnpay.js` · offset 201662213 · sha256 `0ab3e676…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Logs/events exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRIC_EXPORT_INTERVAL`

Source: `chunk-pt1gnpay.js` · offset 201660714 · sha256 `3b7d7cea…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `60000`.

From docs: Export interval in milliseconds (default: 60000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_EXPORTER`

Source: `chunk-pt1gnpay.js` · offset 201664880 · sha256 `55fadc06…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Values: `prometheus`.

From docs: Metrics exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_METRICS_INCLUDE_ACCOUNT_UUID`

Source: `chunk-rv11zjj6.js` · offset 174135896 · sha256 `a52e5dfb…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude account UUID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_ENTRYPOINT`

Source: `chunk-rv11zjj6.js` · offset 174135548 · sha256 `24f0b0ca…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include the session entrypoint in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_REPOSITORY`

Source: `chunk-rv11zjj6.js` · offset 174135627 · sha256 `d3ae3777…` · 2 read sites

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to tag OpenTelemetry metrics and events with `vcs.*` attributes identifying the session's repository (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_RESOURCE_ATTRIBUTES`

Source: `chunk-rv11zjj6.js` · offset 174134699 · sha256 `64147388…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: As of v2.1.161, Claude Code attaches `OTEL_RESOURCE_ATTRIBUTES` keys to metric datapoint labels.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_SESSION_ID`

Source: `chunk-rv11zjj6.js` · offset 174134870 · sha256 `c8eb859c…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `false` to exclude session ID from metrics attributes (default: included).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_METRICS_INCLUDE_VERSION`

Source: `chunk-rv11zjj6.js` · offset 174135016 · sha256 `5375ab0f…`

Read as: presence (only whether it is set (or truthy) matters).

From docs: Set to `true` to include Claude Code version in metrics attributes (default: excluded).

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_RESOURCE_ATTRIBUTES`

Source: `chunk-rv11zjj6.js` · offset 174134668 · sha256 `3949d66e…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT`

Source: `chunk-c6xmth72.js` · offset 174146477 · sha256 `b73a7c57…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0.

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `OTEL_TRACES_EXPORT_INTERVAL`

Source: `chunk-pt1gnpay.js` · offset 201667212 · sha256 `3104fb4b…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Default (from code): `5000`.

From docs: Span batch export interval in milliseconds (default: 5000)

Documented: https://code.claude.com/docs/en/monitoring-usage

### `OTEL_TRACES_EXPORTER`

Source: `chunk-pt1gnpay.js` · offset 201663140 · sha256 `947cd0a5…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Traces exporter types, comma-separated.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `TRACEPARENT`

Source: `chunk-c6xmth72.js` · offset 174156679 · sha256 `13183cc6…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TRACESTATE`

Source: `chunk-c6xmth72.js` · offset 174156755 · sha256 `d8947714…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c6xmth72.js` offset 174156755.

**Undocumented**

## Network, proxy and TLS

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-xqpqy3x4.js` · offset 198616241 · sha256 `df0eedcf…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616241.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-xqpqy3x4.js` · offset 198616211 · sha256 `798ebf6e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616211.

**Undocumented**

### `all_proxy`

Source: `chunk-frqjd28b.js` · offset 181498072 · sha256 `9fcdc466…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-frqjd28b.js` offset 181498072.

**Undocumented**

### `ALL_PROXY`

Source: `chunk-frqjd28b.js` · offset 181498049 · sha256 `728ff8d8…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-frqjd28b.js` offset 181498049.

**Undocumented**

### `CCR_AGENT_PROXY_ENABLED`

Source: `chunk-xqpqy3x4.js` · offset 198616763 · sha256 `04bb26ab…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616763.

**Undocumented**

### `CCR_AGENT_PROXY_FRAME_HOSTS`

Source: `chunk-p96ker9q.js` · offset 176517044 · sha256 `6f52e4fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-p96ker9q.js` offset 176517044.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-xqpqy3x4.js` · offset 198616374 · sha256 `80a96f80…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616374.

**Undocumented**

### `CCR_AGENT_PROXY_NO_PROXY_LOCAL_ONLY`

Source: `chunk-xqpqy3x4.js` · offset 198616491 · sha256 `ff80511a…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616491.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-xqpqy3x4.js` · offset 198616408 · sha256 `8d75b539…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616408.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-xqpqy3x4.js` · offset 198616343 · sha256 `f05f27c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616343.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-xqpqy3x4.js` · offset 198616450 · sha256 `32e23461…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198616450.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GH_SHIM`

Source: `chunk-xqpqy3x4.js` · offset 198621256 · sha256 `6ddbb857…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198621256.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_CONFIG`

Source: `chunk-xqpqy3x4.js` · offset 198621046 · sha256 `15597b8e…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198621046.

**Undocumented**

### `CLAUDE_CODE_CERT_STORE`

Source: `chunk-s79sfps3.js` · offset 171802767 · sha256 `5cf53913…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Comma-separated list of CA certificate sources for TLS connections.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_CERT`

Source: `chunk-dt8bvbsd.js` · offset 178339548 · sha256 `cc37bcd5…` · 12 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Path to client certificate file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY`

Source: `chunk-s41h44hd.js` · offset 195132955 · sha256 `d552242d…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

From docs: Path to client private key file for mTLS authentication

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CLIENT_KEY_PASSPHRASE`

Source: `chunk-s79sfps3.js` · offset 171805802 · sha256 `0357f9e0…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Passphrase for encrypted CLAUDE\_CODE\_CLIENT\_KEY (optional)

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_MTLS_RELOAD_ON_STALE_CONNECTION`

Source: `chunk-dt8bvbsd.js` · offset 179277781 · sha256 `3a589ab6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to stop Claude Code from re-reading the mTLS client certificate and key when an API request fails with a connection-level error, such as a connection reset or a TLS handshake error.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ENABLE_PROXY_AUTH_HELPER`

Source: `chunk-kbjsjr7g.js` · offset 181459744 · sha256 `bba7fbe6…` · 2 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-kbjsjr7g.js` offset 181459744.

**Undocumented**

### `CLAUDE_CODE_HTTP_PROXY`

Source: `chunk-yrp3en1n.js` · offset 172361585 · sha256 `5dbec935…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yrp3en1n.js` offset 172361585.

**Undocumented**

### `CLAUDE_CODE_HTTPS_PROXY`

Source: `chunk-yrp3en1n.js` · offset 172361642 · sha256 `48b35a6e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yrp3en1n.js` offset 172361642.

**Undocumented**

### `CLAUDE_CODE_PROXY_AUTH_HELPER_TTL_MS`

Source: `chunk-s79sfps3.js` · offset 171816199 · sha256 `eab3e77a…`

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset).

Undocumented; read at `chunk-s79sfps3.js` offset 171816199.

**Undocumented**

### `CLAUDE_CODE_PROXY_RESOLVES_HOSTS`

Source: `chunk-s79sfps3.js` · offset 171815384 · sha256 `15350379…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

From docs: Set to `1` to allow the proxy to perform DNS resolution instead of the caller.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMULATE_PROXY_USAGE`

Source: `chunk-dt8bvbsd.js` · offset 179263173 · sha256 `8836efb4…` · 4 read sites

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179263173.

**Undocumented**

### `CLAUDE_CODE_WEBFETCH_USE_CCR_PROXY`

Source: `chunk-dt8bvbsd.js` · offset 178676404 · sha256 `808a7134…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-dt8bvbsd.js` offset 178676404.

**Undocumented**

### `CLAUDE_CODE_WEBSEARCH_USE_CCR_PROXY`

Source: `chunk-9yybzjm7.js` · offset 184733145 · sha256 `9aacb5ad…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-9yybzjm7.js` offset 184733145.

**Undocumented**

### `CLAUDE_RUNNER_USE_GIT_PROXY`

Source: `chunk-z62nk1ek.js` · offset 181675211 · sha256 `6dfb3f71…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-z62nk1ek.js` offset 181675211.

**Undocumented**

### `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH`

Source: `chunk-s45djs34.js` · offset 207082020 · sha256 `af68cb3b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-s45djs34.js` offset 207082020.

**Undocumented**

### `HOSTALIASES`

Source: `chunk-dt8bvbsd.js` · offset 177817482 · sha256 `ebc96d96…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177817482.

**Undocumented**

### `http_proxy`

Source: `chunk-905d7765.js` · offset 187941400 · sha256 `13b6d010…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-905d7765.js` offset 187941400.

**Undocumented**

### `HTTP_PROXY`

Source: `chunk-905d7765.js` · offset 187941374 · sha256 `724f796e…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

From docs: Specify HTTP proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `https_proxy`

Source: `chunk-905d7765.js` · offset 187941347 · sha256 `60af903f…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-905d7765.js` offset 187941347.

**Undocumented**

### `HTTPS_PROXY`

Source: `chunk-905d7765.js` · offset 187941320 · sha256 `aa543d14…` · 12 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

From docs: Specify HTTPS proxy server for network connections

Documented: https://code.claude.com/docs/en/env-vars

### `LOCALDOMAIN`

Source: `chunk-dt8bvbsd.js` · offset 177817468 · sha256 `4df19f9d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177817468.

**Undocumented**

### `no_proxy`

Source: `chunk-905d7765.js` · offset 187938962 · sha256 `da21c898…` · 9 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`.

Undocumented; read at `chunk-905d7765.js` offset 187938962.

**Undocumented**

### `NO_PROXY`

Source: `chunk-905d7765.js` · offset 187938940 · sha256 `516bafd4…` · 10 read sites

Read as: string (trimmed; empty is treated as unset). Values: `*`. Default (from code): `not set`.

From docs: List of domains and IPs to which requests will be directly issued, bypassing proxy

Documented: https://code.claude.com/docs/en/env-vars

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-zg9v04h4.js` · offset 174854131 · sha256 `c69b8df7…` · 14 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-zg9v04h4.js` offset 174854131.

**Undocumented**

### `NODE_TLS_REJECT_UNAUTHORIZED`

Source: `chunk-dt8bvbsd.js` · offset 177817437 · sha256 `1ec3d3d6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177817437.

**Undocumented**

### `RES_OPTIONS`

Source: `chunk-dt8bvbsd.js` · offset 177817496 · sha256 `3e93abd5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177817496.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-kbjsjr7g.js` · offset 181458094 · sha256 `99381f92…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kbjsjr7g.js` offset 181458094.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-kbjsjr7g.js` · offset 181458121 · sha256 `f976e78d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kbjsjr7g.js` offset 181458121.

**Undocumented**

### `SSL_CERT_FILE`

Source: `chunk-xqpqy3x4.js` · offset 198623871 · sha256 `36128327…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198623871.

**Undocumented**

## Shell, terminal, OS and CI environment

### `__CFBundleIdentifier`

Source: `chunk-0hm7n25m.js` · offset 170430553 · sha256 `a8824fe9…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Values: `com.conductor.app`, `com.googlecode.iterm2`, `com.anthropic.claude-code-url-handler`.

Undocumented; read at `chunk-0hm7n25m.js` offset 170430553.

**Undocumented**

### `ALACRITTY_LOG`

Source: `chunk-0hm7n25m.js` · offset 170432238 · sha256 `bfe1befc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432238.

**Undocumented**

### `ANDROID_HOME`

Source: `chunk-c533zrae.js` · offset 192342608 · sha256 `309f9171…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c533zrae.js` offset 192342608.

**Undocumented**

### `ANDROID_SDK_ROOT`

Source: `chunk-c533zrae.js` · offset 192342624 · sha256 `58d982c5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-c533zrae.js` offset 192342624.

**Undocumented**

### `APP_URL`

Source: `chunk-0hm7n25m.js` · offset 170436078 · sha256 `883dc61c…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436078.

**Undocumented**

### `APPDATA`

Source: `chunk-2yxmcerc.js` · offset 198853975 · sha256 `da8ef702…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198853975.

**Undocumented**

### `BROWSER`

Source: `chunk-8wg9q299.js` · offset 183409146 · sha256 `ad8a905e…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `true`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-8wg9q299.js` offset 183409146.

**Undocumented**

### `BUILDKITE`

Source: `chunk-0hm7n25m.js` · offset 170436376 · sha256 `9466bfb7…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436376.

**Undocumented**

### `BUN_CHROME_PATH`

Source: `chunk-39zdd00d.js` · offset 185316358 · sha256 `497892ba…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-39zdd00d.js` offset 185316358.

**Undocumented**

### `BUN_INSTALL`

Source: `chunk-8gn26nrp.js` · offset 181321770 · sha256 `c3315b28…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-8gn26nrp.js` offset 181321770.

**Undocumented**

### `C9_PID`

Source: `chunk-0hm7n25m.js` · offset 170434983 · sha256 `e4c27b8d…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434983.

**Undocumented**

### `C9_USER`

Source: `chunk-0hm7n25m.js` · offset 170435003 · sha256 `97e055e6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435003.

**Undocumented**

### `CF_PAGES`

Source: `chunk-0hm7n25m.js` · offset 170435475 · sha256 `d2788c90…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435475.

**Undocumented**

### `CI`

Source: `chunk-k7mv9wh9.js` · offset 182508077 · sha256 `2883b550…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k7mv9wh9.js` offset 182508077.

**Undocumented**

### `CIRCLECI`

Source: `chunk-0hm7n25m.js` · offset 170436335 · sha256 `032d464c…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436335.

**Undocumented**

### `CODER`

Source: `chunk-0hm7n25m.js` · offset 170434717 · sha256 `dbd0f0f9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434717.

**Undocumented**

### `CODER_WORKSPACE_NAME`

Source: `chunk-0hm7n25m.js` · offset 170434737 · sha256 `d922a1cc…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434737.

**Undocumented**

### `CODESPACES`

Source: `chunk-0hm7n25m.js` · offset 170434618 · sha256 `d78687e1…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434618.

**Undocumented**

### `COLORFGBG`

Source: `chunk-4nts7ymr.js` · offset 183278037 · sha256 `4bab16fa…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4nts7ymr.js` offset 183278037.

**Undocumented**

### `COLORTERM`

Source: `chunk-89n5rmmv.js` · offset 185052351 · sha256 `f280844a…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-89n5rmmv.js` offset 185052351.

**Undocumented**

### `ComSpec`

Source: `chunk-2y8b237q.js` · offset 193921653 · sha256 `d367c10d…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2y8b237q.js` offset 193921653.

**Undocumented**

### `COMSPEC`

Source: `chunk-0hm7n25m.js` · offset 170437730 · sha256 `99cafcff…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `cmd.exe`.

Undocumented; read at `chunk-0hm7n25m.js` offset 170437730.

**Undocumented**

### `ConEmuANSI`

Source: `chunk-0hm7n25m.js` · offset 170432509 · sha256 `c8777282…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432509.

**Undocumented**

### `ConEmuPID`

Source: `chunk-0hm7n25m.js` · offset 170432533 · sha256 `c4505517…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432533.

**Undocumented**

### `ConEmuTask`

Source: `chunk-0hm7n25m.js` · offset 170432556 · sha256 `6160aec6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432556.

**Undocumented**

### `CURSOR_TRACE_ID`

Source: `chunk-0hm7n25m.js` · offset 170431010 · sha256 `a240f1a4…` · 4 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-0hm7n25m.js` offset 170431010.

**Undocumented**

### `DAYTONA_WS_ID`

Source: `chunk-0hm7n25m.js` · offset 170434862 · sha256 `d76f1c62…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434862.

**Undocumented**

### `DEBUG`

Source: `chunk-kdgec1t8.js` · offset 191301351 · sha256 `3f2fec78…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset). Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Documented: https://code.claude.com/docs/en/env-vars

### `DENO_DEPLOYMENT_ID`

Source: `chunk-0hm7n25m.js` · offset 170435525 · sha256 `a0569b4e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435525.

**Undocumented**

### `DEVPOD`

Source: `chunk-0hm7n25m.js` · offset 170434790 · sha256 `a0e21599…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434790.

**Undocumented**

### `DEVPOD_WORKSPACE_UID`

Source: `chunk-0hm7n25m.js` · offset 170434811 · sha256 `7941e754…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434811.

**Undocumented**

### `DISPLAY`

Source: `chunk-cb54pb0c.js` · offset 176923553 · sha256 `4dcc9e06…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-cb54pb0c.js` offset 176923553.

**Undocumented**

### `DYNO`

Source: `chunk-0hm7n25m.js` · offset 170435366 · sha256 `5bfcb51f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435366.

**Undocumented**

### `EDITOR`

Source: `chunk-7gkxx0s5.js` · offset 205660835 · sha256 `e2aba24c…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7gkxx0s5.js` offset 205660835.

**Undocumented**

### `FLY_APP_NAME`

Source: `chunk-0hm7n25m.js` · offset 170435401 · sha256 `e98aa307…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435401.

**Undocumented**

### `FLY_MACHINE_ID`

Source: `chunk-0hm7n25m.js` · offset 170435427 · sha256 `eb90c0ce…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435427.

**Undocumented**

### `FORCE_CODE_TERMINAL`

Source: `chunk-c2fy6cgt.js` · offset 176851051 · sha256 `6d127f08…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`. Other sites parse it as a boolean, so the same value can mean on in one place and off in another.

Undocumented; read at `chunk-c2fy6cgt.js` offset 176851051.

**Undocumented**

### `FORCE_COLOR`

Source: `chunk-dt8bvbsd.js` · offset 177785579 · sha256 `15ab5bb8…` · 3 read sites

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-dt8bvbsd.js` offset 177785579.

**Undocumented**

### `FORCE_HYPERLINK`

Source: `chunk-k7mv9wh9.js` · offset 182508082 · sha256 `dbf93b31…`

Read as: string (raw value; further parsing not traced).

From docs: Set to `1` to enable clickable OSC 8 hyperlinks when your terminal supports them but isn't auto-detected, or `0` to disable them.

Documented: https://code.claude.com/docs/en/env-vars

### `GCM_INTERACTIVE`

Source: `chunk-xqpqy3x4.js` · offset 198624713 · sha256 `6bbeb3c8…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198624713.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042610 · sha256 `9c5226ea…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176042610.

**Undocumented**

### `GH_HOST`

Source: `chunk-7kwd28ae.js` · offset 176042587 · sha256 `95d3efd7…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176042587.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042537 · sha256 `4d29d2e5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176042537.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-xqpqy3x4.js` · offset 198624658 · sha256 `77c0011a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198624658.

**Undocumented**

### `GIT_CONFIG_COUNT`

Source: `chunk-fx2s99hv.js` · offset 176997243 · sha256 `ba75a666…` · 8 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `0`.

Undocumented; read at `chunk-fx2s99hv.js` offset 176997243.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-xqpqy3x4.js` · offset 198625293 · sha256 `c6d7625a…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198625293.

**Undocumented**

### `GIT_CONFIG_KEY_*`

Source: `chunk-fx2s99hv.js` · offset 176997345 · sha256 `da14c0ce…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-7kwd28ae.js` · offset 175674322 · sha256 `d8e2e5f7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 175674322.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-fx2s99hv.js` · offset 176997455 · sha256 `56a8e5d7…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-fx2s99hv.js` offset 176997455.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-7kwd28ae.js` · offset 175674265 · sha256 `e86ead92…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-7kwd28ae.js` offset 175674265.

**Undocumented**

### `GIT_CONFIG_VALUE_*`

Source: `chunk-fx2s99hv.js` · offset 176997372 · sha256 `524acb1b…`

Read as: string (raw value; further parsing not traced).

From code: The variable name is built at run time; `*` stands for a value filled in by the code.

Name pattern (not counted as documented or undocumented)

### `GIT_NO_LAZY_FETCH`

Source: `chunk-7kwd28ae.js` · offset 175762507 · sha256 `1ecfbad6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-7kwd28ae.js` offset 175762507.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-frqjd28b.js` · offset 181499155 · sha256 `58764ff1…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `ssh`.

Undocumented; read at `chunk-frqjd28b.js` offset 181499155.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-xqpqy3x4.js` · offset 198624579 · sha256 `e65f8626…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198624579.

**Undocumented**

### `GITHUB_ACTION_INPUTS`

Source: `chunk-bjmhhyed.js` · offset 186081573 · sha256 `872d29c8…`

Read as: string (used as-is (not trimmed)).

Undocumented; read at `chunk-bjmhhyed.js` offset 186081573.

**Undocumented**

### `GITHUB_ACTION_PATH`

Source: `chunk-m200zvyg.js` · offset 172809277 · sha256 `63872dc2…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172809277.

**Undocumented**

### `GITHUB_ACTIONS`

Source: `chunk-0hm7n25m.js` · offset 170436234 · sha256 `5cc8b904…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436234.

**Undocumented**

### `GITHUB_ACTOR`

Source: `chunk-dt8bvbsd.js` · offset 179806940 · sha256 `bdbdbc09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dt8bvbsd.js` offset 179806940.

**Undocumented**

### `GITHUB_ACTOR_ID`

Source: `chunk-m200zvyg.js` · offset 172618541 · sha256 `efc90f87…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172618541.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042643 · sha256 `80d49428…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176042643.

**Undocumented**

### `GITHUB_ENV`

Source: `chunk-yrp3en1n.js` · offset 172365753 · sha256 `85a6c474…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172365753.

**Undocumented**

### `GITHUB_EVENT_NAME`

Source: `chunk-m200zvyg.js` · offset 172809125 · sha256 `002d2186…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172809125.

**Undocumented**

### `GITHUB_EVENT_PATH`

Source: `chunk-yrp3en1n.js` · offset 172366271 · sha256 `4d6b1a09…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172366271.

**Undocumented**

### `GITHUB_REPOSITORY`

Source: `chunk-m200zvyg.js` · offset 172618570 · sha256 `98dca9d0…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172618570.

**Undocumented**

### `GITHUB_REPOSITORY_ID`

Source: `chunk-m200zvyg.js` · offset 172618603 · sha256 `0a9247c9…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172618603.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER`

Source: `chunk-m200zvyg.js` · offset 172618642 · sha256 `4bf7a1f3…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172618642.

**Undocumented**

### `GITHUB_REPOSITORY_OWNER_ID`

Source: `chunk-m200zvyg.js` · offset 172618686 · sha256 `11aaad60…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-m200zvyg.js` offset 172618686.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042559 · sha256 `d84c66c7…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7kwd28ae.js` offset 176042559.

**Undocumented**

### `GITHUB_WORKSPACE`

Source: `chunk-yrp3en1n.js` · offset 172365811 · sha256 `c45e337f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-yrp3en1n.js` offset 172365811.

**Undocumented**

### `GITLAB_CI`

Source: `chunk-0hm7n25m.js` · offset 170436291 · sha256 `3ee25c25…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436291.

**Undocumented**

### `GITPOD_WORKSPACE_ID`

Source: `chunk-0hm7n25m.js` · offset 170434664 · sha256 `0bd1a41d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170434664.

**Undocumented**

### `GNOME_TERMINAL_SERVICE`

Source: `chunk-0hm7n25m.js` · offset 170431994 · sha256 `8fcf299d…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170431994.

**Undocumented**

### `HISTFILE`

Source: `chunk-dffxwk6t.js` · offset 189784075 · sha256 `e5c41ee2…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dffxwk6t.js` offset 189784075.

**Undocumented**

### `HOME`

Source: `chunk-905d7765.js` · offset 187987690 · sha256 `dc770fd4…` · 11 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-905d7765.js` offset 187987690.

**Undocumented**

### `HOMEDRIVE`

Source: `chunk-7kwd28ae.js` · offset 175675400 · sha256 `b1e94095…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-7kwd28ae.js` offset 175675400.

**Undocumented**

### `HOMEPATH`

Source: `chunk-7kwd28ae.js` · offset 175675420 · sha256 `47941ed8…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-7kwd28ae.js` offset 175675420.

**Undocumented**

### `HOSTNAME`

Source: `chunk-yn3me4dk.js` · offset 170036082 · sha256 `5c1b2b57…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-yn3me4dk.js` offset 170036082.

**Undocumented**

### `INK_SCREEN_READER`

Source: `chunk-qbx8et3j.js` · offset 183151732 · sha256 `064450f6…`

Read as: boolean (true when the value, trimmed and lowercased, is 1, true, yes or on; anything else is false).

Undocumented; read at `chunk-qbx8et3j.js` offset 183151732.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS`

Source: `chunk-7rn4mcxd.js` · offset 182810135 · sha256 `1054b8d6…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7rn4mcxd.js` offset 182810135.

**Undocumented**

### `INTELLIJ_TERMINAL_COMMAND_BLOCKS_REWORKED`

Source: `chunk-7rn4mcxd.js` · offset 182810071 · sha256 `d49c5da5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-7rn4mcxd.js` offset 182810071.

**Undocumented**

### `ITERM_SESSION_ID`

Source: `chunk-562c8j1s.js` · offset 202089102 · sha256 `038ed3ab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-562c8j1s.js` offset 202089102.

**Undocumented**

### `JAVA_HOME`

Source: `chunk-xqpqy3x4.js` · offset 198608510 · sha256 `e32930cc…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198608510.

**Undocumented**

### `JAVA_TOOL_OPTIONS`

Source: `chunk-zg9v04h4.js` · offset 174923812 · sha256 `eb2a2297…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zg9v04h4.js` offset 174923812.

**Undocumented**

### `K_SERVICE`

Source: `chunk-0hm7n25m.js` · offset 170435832 · sha256 `a48f12e6…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435832.

**Undocumented**

### `KITTY_WINDOW_ID`

Source: `chunk-0hm7n25m.js` · offset 170432193 · sha256 `19815f12…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432193.

**Undocumented**

### `KONSOLE_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170431947 · sha256 `3f5c80d0…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170431947.

**Undocumented**

### `KUBERNETES_SERVICE_HOST`

Source: `chunk-0hm7n25m.js` · offset 170436440 · sha256 `d81719da…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436440.

**Undocumented**

### `LANG`

Source: `chunk-zfhe6jtf.js` · offset 189178226 · sha256 `7a38024b…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zfhe6jtf.js` offset 189178226.

**Undocumented**

### `LC_ALL`

Source: `chunk-zfhe6jtf.js` · offset 189178205 · sha256 `bc2e1a24…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zfhe6jtf.js` offset 189178205.

**Undocumented**

### `LC_TERMINAL`

Source: `chunk-cb54pb0c.js` · offset 176921726 · sha256 `0ed931d5…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Values: `iTerm2`. Default (from code): `unset`.

Undocumented; read at `chunk-cb54pb0c.js` offset 176921726.

**Undocumented**

### `LC_TIME`

Source: `chunk-zfhe6jtf.js` · offset 189178215 · sha256 `65eda90a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-zfhe6jtf.js` offset 189178215.

**Undocumented**

### `LOCALAPPDATA`

Source: `chunk-f7tnsfnn.js` · offset 186700014 · sha256 `b38fddba…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-f7tnsfnn.js` offset 186700014.

**Undocumented**

### `MSYSTEM`

Source: `chunk-0hm7n25m.js` · offset 170432445 · sha256 `11f36523…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432445.

**Undocumented**

### `NETLIFY`

Source: `chunk-0hm7n25m.js` · offset 170435326 · sha256 `c4d87109…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435326.

**Undocumented**

### `NO_COLOR`

Source: `chunk-fbbebbx4.js` · offset 171641765 · sha256 `48ee5637…` · 2 read sites

Read as: string (used as-is (not trimmed)).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-fbbebbx4.js` offset 171641765.

**Undocumented**

### `NODE_DEBUG`

Source: `chunk-6b5jn77e.js` · offset 171830946 · sha256 `7d3efaa5…` · 4 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-6b5jn77e.js` offset 171830946.

**Undocumented**

### `NODE_OPTIONS`

Source: `chunk-b1tfggtv.js` · offset 170271076 · sha256 `914747b7…` · 7 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `not set`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-b1tfggtv.js` offset 170271076.

**Undocumented**

### `P4PORT`

Source: `chunk-nj6jrnt8.js` · offset 170355842 · sha256 `0e8d8e90…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-nj6jrnt8.js` offset 170355842.

**Undocumented**

### `PATH`

Source: `chunk-0hm7n25m.js` · offset 170429581 · sha256 `69e3a9e0…` · 18 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `/usr/local/bin:/usr/bin:/bin`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `PATHEXT`

Source: `chunk-0hm7n25m.js` · offset 170429488 · sha256 `a603895c…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170429488.

**Undocumented**

### `PREFIX`

Source: `chunk-1s64prse.js` · offset 196197250 · sha256 `b830d9ab…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-1s64prse.js` offset 196197250.

**Undocumented**

### `ProgramData`

Source: `chunk-kdgec1t8.js` · offset 191550763 · sha256 `f0de69b2…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191550763.

**Undocumented**

### `PROGRAMDATA`

Source: `chunk-7kwd28ae.js` · offset 175674461 · sha256 `ce8a6927…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-7kwd28ae.js` offset 175674461.

**Undocumented**

### `ProgramFiles`

Source: `chunk-kdgec1t8.js` · offset 191550876 · sha256 `ae3c9ab2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-kdgec1t8.js` offset 191550876.

**Undocumented**

### `PROJECT_DOMAIN`

Source: `chunk-0hm7n25m.js` · offset 170435106 · sha256 `87e9f9c2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435106.

**Undocumented**

### `PWD`

Source: `chunk-vtw55p3q.js` · offset 183563090 · sha256 `55d0de17…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-vtw55p3q.js` offset 183563090.

**Undocumented**

### `RAILWAY_ENVIRONMENT_NAME`

Source: `chunk-0hm7n25m.js` · offset 170435192 · sha256 `46ffdcd9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435192.

**Undocumented**

### `RAILWAY_SERVICE_NAME`

Source: `chunk-0hm7n25m.js` · offset 170435230 · sha256 `ff14b856…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435230.

**Undocumented**

### `RENDER`

Source: `chunk-0hm7n25m.js` · offset 170435285 · sha256 `85af1892…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435285.

**Undocumented**

### `REPL_ID`

Source: `chunk-0hm7n25m.js` · offset 170435045 · sha256 `da03a20e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435045.

**Undocumented**

### `REPL_SLUG`

Source: `chunk-0hm7n25m.js` · offset 170435066 · sha256 `7ae40c11…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435066.

**Undocumented**

### `SESSIONNAME`

Source: `chunk-0hm7n25m.js` · offset 170432374 · sha256 `52edc75e…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432374.

**Undocumented**

### `SHELL`

Source: `chunk-0hm7n25m.js` · offset 170437711 · sha256 `d9d57ee3…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170437711.

**Undocumented**

### `SPACE_CREATOR_USER_ID`

Source: `chunk-0hm7n25m.js` · offset 170436167 · sha256 `57bb1750…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436167.

**Undocumented**

### `SSH_AUTH_SOCK`

Source: `chunk-xqpqy3x4.js` · offset 198628423 · sha256 `45e4e696…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-xqpqy3x4.js` offset 198628423.

**Undocumented**

### `SSH_CLIENT`

Source: `chunk-0hm7n25m.js` · offset 170436742 · sha256 `23b2cf08…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436742.

**Undocumented**

### `SSH_CONNECTION`

Source: `chunk-0hm7n25m.js` · offset 170436714 · sha256 `c840a5cf…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436714.

**Undocumented**

### `SSH_TTY`

Source: `chunk-0hm7n25m.js` · offset 170436766 · sha256 `2607570d…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170436766.

**Undocumented**

### `STY`

Source: `chunk-0hm7n25m.js` · offset 170431913 · sha256 `335a859b…` · 8 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 6 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170431913.

**Undocumented**

### `SUDO_GID`

Source: `chunk-2yxmcerc.js` · offset 198732942 · sha256 `403e35b1…` · 4 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-2yxmcerc.js` offset 198732942.

**Undocumented**

### `SUDO_UID`

Source: `chunk-2yxmcerc.js` · offset 198732929 · sha256 `8b3a2dac…` · 5 read sites

Read as: integer (parsed base 10 (also accepts 1e3 and 1,000 or 1_000 forms); non-numbers are treated as unset). Bounds: min 0, digitsOnly true.

Undocumented; read at `chunk-2yxmcerc.js` offset 198732929.

**Undocumented**

### `SUDO_USER`

Source: `chunk-2yxmcerc.js` · offset 198732955 · sha256 `68f43961…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198732955.

**Undocumented**

### `SystemRoot`

Source: `chunk-zg9v04h4.js` · offset 174944029 · sha256 `793aedf5…` · 3 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-zg9v04h4.js` offset 174944029.

**Undocumented**

### `SYSTEMROOT`

Source: `chunk-1x4qjkd6.js` · offset 175171267 · sha256 `b421cf1e…` · 4 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `C:\Windows`.

Undocumented; read at `chunk-1x4qjkd6.js` offset 175171267.

**Undocumented**

### `TEAMCITY_VERSION`

Source: `chunk-k7mv9wh9.js` · offset 182508110 · sha256 `61989b74…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-k7mv9wh9.js` offset 182508110.

**Undocumented**

### `TERM`

Source: `chunk-0hm7n25m.js` · offset 170431636 · sha256 `cd581ed8…` · 17 read sites

Read as: string (trimmed; empty is treated as unset). Values: `xterm-ghostty`, `cygwin`. Default (from code): `unset`.

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM`

Source: `chunk-0hm7n25m.js` · offset 170431743 · sha256 `75da1de5…` · 27 read sites

Read as: string (trimmed; empty is treated as unset). Values: `iTerm.app`, `vscode`, `ghostty`, `Apple_Terminal`, `WezTerm`, `tmux`, `mintty`. Default (from code): `unset`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Documented at https://code.claude.com/docs/en/env-vars; no description column to quote.

Documented: https://code.claude.com/docs/en/env-vars

### `TERM_PROGRAM_VERSION`

Source: `chunk-7rn4mcxd.js` · offset 182803375 · sha256 `0dc37e73…` · 5 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `unset`.

Undocumented; read at `chunk-7rn4mcxd.js` offset 182803375.

**Undocumented**

### `TERMINAL`

Source: `chunk-2y8b237q.js` · offset 193921151 · sha256 `541785d4…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2y8b237q.js` offset 193921151.

**Undocumented**

### `TERMINAL_EMULATOR`

Source: `chunk-0hm7n25m.js` · offset 170431564 · sha256 `cf45b3e1…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Values: `JetBrains-JediTerm`.

Undocumented; read at `chunk-0hm7n25m.js` offset 170431564.

**Undocumented**

### `TERMINATOR_UUID`

Source: `chunk-0hm7n25m.js` · offset 170432143 · sha256 `c7a22da2…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432143.

**Undocumented**

### `TERMUX_VERSION`

Source: `chunk-1s64prse.js` · offset 196197233 · sha256 `b7fed4d0…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 3 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-1s64prse.js` offset 196197233.

**Undocumented**

### `TILIX_ID`

Source: `chunk-0hm7n25m.js` · offset 170432285 · sha256 `5765a66f…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432285.

**Undocumented**

### `TMPDIR`

Source: `chunk-4r5er76z.js` · offset 181470794 · sha256 `3d1885bc…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-4r5er76z.js` offset 181470794.

**Undocumented**

### `TMUX`

Source: `chunk-0hm7n25m.js` · offset 170431880 · sha256 `173755d8…` · 29 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 23 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170431880.

**Undocumented**

### `TMUX_PANE`

Source: `chunk-dtkwmakt.js` · offset 177006808 · sha256 `72526b2f…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-dtkwmakt.js` offset 177006808.

**Undocumented**

### `USER`

Source: `chunk-j7af2vx5.js` · offset 172425868 · sha256 `877808d9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-j7af2vx5.js` offset 172425868.

**Undocumented**

### `USERNAME`

Source: `chunk-1x4qjkd6.js` · offset 175180481 · sha256 `5a380695…` · 4 read sites

Read as: string (trimmed; empty is treated as unset). Values: `ContainerAdministrator`, `ContainerUser`.

Undocumented; read at `chunk-1x4qjkd6.js` offset 175180481.

**Undocumented**

### `USERPROFILE`

Source: `chunk-3sgwhpa9.js` · offset 206625115 · sha256 `09f71f7e…` · 10 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 4 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-3sgwhpa9.js` offset 206625115.

**Undocumented**

### `UV_THREADPOOL_SIZE`

Source: `chunk-4jbzqc2f.js` · offset 202984720 · sha256 `6e9baec2…` · 2 read sites

Read as: string (trimmed; empty is treated as unset). Default (from code): `default`.

Undocumented; read at `chunk-4jbzqc2f.js` offset 202984720.

**Undocumented**

### `VERCEL`

Source: `chunk-0hm7n25m.js` · offset 170435154 · sha256 `6ae3215a…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435154.

**Undocumented**

### `VISUAL`

Source: `chunk-7gkxx0s5.js` · offset 205660795 · sha256 `797f4100…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7gkxx0s5.js` offset 205660795.

**Undocumented**

### `VisualStudioVersion`

Source: `chunk-0hm7n25m.js` · offset 170431508 · sha256 `c05a1490…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-0hm7n25m.js` offset 170431508.

**Undocumented**

### `VSCODE_GIT_ASKPASS_MAIN`

Source: `chunk-0hm7n25m.js` · offset 170431059 · sha256 `c0a2e4f9…` · 4 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170431059.

**Undocumented**

### `VTE_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170432098 · sha256 `28245ba2…` · 6 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432098.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-cb54pb0c.js` · offset 176923588 · sha256 `71497285…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-cb54pb0c.js` offset 176923588.

**Undocumented**

### `WEBSITE_SITE_NAME`

Source: `chunk-0hm7n25m.js` · offset 170435927 · sha256 `861142fb…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435927.

**Undocumented**

### `WEBSITE_SKU`

Source: `chunk-0hm7n25m.js` · offset 170435958 · sha256 `4e4acf04…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170435958.

**Undocumented**

### `WINDIR`

Source: `chunk-w0nf6xkd.js` · offset 187373562 · sha256 `9be0888a…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-w0nf6xkd.js` offset 187373562.

**Undocumented**

### `WSL_DISTRO_NAME`

Source: `chunk-0hm7n25m.js` · offset 170432597 · sha256 `d98afa7f…` · 9 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432597.

**Undocumented**

### `WSL_INTEROP`

Source: `chunk-nj6jrnt8.js` · offset 170353490 · sha256 `69779847…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-nj6jrnt8.js` offset 170353490.

**Undocumented**

### `WT_SESSION`

Source: `chunk-0hm7n25m.js` · offset 170432323 · sha256 `dff34227…` · 13 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 8 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432323.

**Undocumented**

### `XDG_CACHE_HOME`

Source: `chunk-2yxmcerc.js` · offset 198794687 · sha256 `fc06c22e…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198794687.

**Undocumented**

### `XDG_CONFIG_HOME`

Source: `chunk-2yxmcerc.js` · offset 198835364 · sha256 `7d8f5e18…` · 15 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198835364.

**Undocumented**

### `XDG_DATA_HOME`

Source: `chunk-2yxmcerc.js` · offset 198794667 · sha256 `b4814b29…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198794667.

**Undocumented**

### `XDG_RUNTIME_DIR`

Source: `chunk-2yxmcerc.js` · offset 198794458 · sha256 `d94ed14d…` · 3 read sites

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198794458.

**Undocumented**

### `XDG_STATE_HOME`

Source: `chunk-2yxmcerc.js` · offset 198794708 · sha256 `6042ebf5…`

Read as: string (trimmed; empty is treated as unset).

Undocumented; read at `chunk-2yxmcerc.js` offset 198794708.

**Undocumented**

### `XTERM_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170432055 · sha256 `1f33c166…`

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-0hm7n25m.js` offset 170432055.

**Undocumented**

### `ZED_TERM`

Source: `chunk-gtq4j5ex.js` · offset 182514000 · sha256 `059fcfab…` · 2 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-gtq4j5ex.js` offset 182514000.

**Undocumented**

### `ZELLIJ`

Source: `chunk-7rn4mcxd.js` · offset 182804773 · sha256 `87944217…` · 5 read sites

Read as: string (trimmed; empty is treated as unset).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false` (the value is trimmed first, so whitespace-only counts as unset).

Undocumented; read at `chunk-7rn4mcxd.js` offset 182804773.

**Undocumented**

## Set by Claude Code for tools, hooks, and child processes

These are variables Claude Code sets. It either writes them into its own process environment, which children that inherit it receive, or adds them to the environment it builds for a specific child. Receivers are listed only where the code identifies the child; values are shown only when the code sets a literal. The same name can also appear in a read group above.

### `AGENT_PROXY_AUTH_TOKEN`

Source: `chunk-xqpqy3x4.js` · offset 198616303 · sha256 `941c0b00…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AGENT_PROXY_URL`

Source: `chunk-xqpqy3x4.js` · offset 198616276 · sha256 `d62c59d0…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `AI_AGENT`

Source: `chunk-0hm7n25m.js` · offset 170464596 · sha256 `54cfe05d…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `ALLOW_ANT_COMPUTER_USE_MCP`

Source: `chunk-0hm7n25m.js` · offset 170464612 · sha256 `1b71c6f5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `ANTHROPIC_API_KEY`

Source: `chunk-1kphg7b9.js` · offset 182598037 · sha256 `c4906342…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: API key sent as `X-Api-Key` header.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AUTH_TOKEN`

Source: `chunk-1kphg7b9.js` · offset 182597997 · sha256 `62c1d0de…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

From docs: Custom value for the `Authorization` header (the value you set here will be prefixed with `Bearer `)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_AWS_API_KEY`

Source: `chunk-ft3bhzm2.js` · offset 194969988 · sha256 `c0bd2dc3…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Workspace API key for Claude Platform on AWS, generated in the AWS Console.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_BASE_URL`

Source: `chunk-z62nk1ek.js` · offset 181606976 · sha256 `e5ad4c0c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the API endpoint to route requests through a proxy or gateway.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_CONFIG_DIR`

Source: `chunk-0hm7n25m.js` · offset 170464646 · sha256 `d919dcae…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Source: `chunk-29hpxtvj.js` · offset 183989952 · sha256 `50834b45…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `haiku` alias resolves to, also used for background functionality.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_MODEL`

Source: `chunk-z62nk1ek.js` · offset 181605830 · sha256 `f4648284…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

From docs: Model that new sessions start on by default.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL`

Source: `chunk-29hpxtvj.js` · offset 183988788 · sha256 `05bfc132…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `opus` alias resolves to, and that `opusplan` uses while Plan Mode is active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION`

Source: `chunk-29hpxtvj.js` · offset 183990090 · sha256 `fe95d446…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display description for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`

Source: `chunk-29hpxtvj.js` · offset 183990029 · sha256 `a74fbf1a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Display name for the pinned Opus model in the `/model` picker.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_DEFAULT_SONNET_MODEL`

Source: `chunk-29hpxtvj.js` · offset 183988705 · sha256 `4e81029a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Model ID that the `sonnet` alias resolves to, and that `opusplan` uses when Plan Mode is not active.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ANTHROPIC_MODEL`

Source: `chunk-z62nk1ek.js` · offset 181605807 · sha256 `44e37690…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

From docs: Name of the model setting to use (see Model Configuration)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BASH_MAX_OUTPUT_LENGTH`

Source: `chunk-0hm7n25m.js` · offset 170464674 · sha256 `ecda8edc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of characters of bash output that Claude Code reads back into a command's result (default: 30000; maximum: 150000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `BROWSER`

Source: `chunk-c1pb53de.js` · offset 195780652 · sha256 `a304f7a4…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `BUN_OPTIONS`

Source: `chunk-dt8bvbsd.js` · offset 178128281 · sha256 `1af89f3d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CCR_AGENT_PROXY_ENABLED`

Source: `chunk-z62nk1ek.js` · offset 181607603 · sha256 `8a91086d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_INCLUDE_HOSTS`

Source: `chunk-xqpqy3x4.js` · offset 198616570 · sha256 `46dce939…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RECEIVE_GATE_DISABLED`

Source: `chunk-xqpqy3x4.js` · offset 198616611 · sha256 `43aec7c7…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_RELAY_MODE`

Source: `chunk-xqpqy3x4.js` · offset 198616532 · sha256 `e570d58a…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_AGENT_PROXY_UPLOAD_GATE_DISABLED`

Source: `chunk-xqpqy3x4.js` · offset 198616660 · sha256 `66a00414…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_RUNNER_STARTUP_TIMING`

Source: `chunk-z62nk1ek.js` · offset 181608237 · sha256 `dcbe593a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CCR_SESSION_ACCOUNT_EMAIL`

Source: `chunk-z62nk1ek.js` · offset 181606929 · sha256 `db259188…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The session creator's email, pre-extracted by the runner from the token's `act.email` claim without signature verification.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CCR_SESSION_PROFILE`

Source: `chunk-0hm7n25m.js` · offset 170464704 · sha256 `2935aeed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CCR_SPAWN_TIMESTAMP_MS`

Source: `chunk-z62nk1ek.js` · offset 181608195 · sha256 `93ffd098…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUBBIT`

Source: `chunk-0hm7n25m.js` · offset 170464731 · sha256 `d9afe097…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AFK_COUNTDOWN_MS`

Source: `chunk-0hm7n25m.js` · offset 170464765 · sha256 `65662c82…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds before auto-continue the on-screen countdown appears on an unanswered `AskUserQuestion` dialog.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFK_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170464796 · sha256 `4626d010…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many milliseconds of idle time before an unanswered `AskUserQuestion` dialog auto-continues without you.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AFTER_LAST_COMPACT`

Source: `chunk-0hm7n25m.js` · offset 170464825 · sha256 `5c101217…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_CLIENT_APP`

Source: `chunk-0hm7n25m.js` · offset 170464886 · sha256 `4969e6fc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENT_SDK_DISABLE_BUILTIN_AGENTS`

Source: `chunk-0hm7n25m.js` · offset 170464921 · sha256 `23696dd2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to disable all built-in subagent types such as Explore and Plan.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_MCP_NO_PREFIX`

Source: `chunk-0hm7n25m.js` · offset 170464968 · sha256 `07366594…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to skip the `mcp____` prefix on tool names from SDK-created MCP servers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AGENT_SDK_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170465006 · sha256 `04293fce…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_AGENTS_SELECT`

Source: `chunk-0hm7n25m.js` · offset 170464858 · sha256 `ceed3475…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ARTIFACT_HOST_GRANT`

Source: `chunk-0hm7n25m.js` · offset 170465038 · sha256 `7d53d50f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170465072 · sha256 `82c442cb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Stall timeout in milliseconds for subagents.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTO_BACKGROUND_TASKS`

Source: `chunk-0hm7n25m.js` · offset 170465154 · sha256 `fcdef18f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to force-enable automatic backgrounding of long-running agent tasks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`

Source: `chunk-0hm7n25m.js` · offset 170465115 · sha256 `636ceaab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the percentage (1-100) of the auto-compact window at which auto-compaction triggers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`

Source: `chunk-0hm7n25m.js` · offset 170465190 · sha256 `45e0c00c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Return to the original working directory after each Bash or PowerShell command in the main session

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_BG_AUTH_SNAPSHOT_PATH`

Source: `chunk-0hm7n25m.js` · offset 170465238 · sha256 `4ec54f6c…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_BACKEND`

Source: `chunk-0hm7n25m.js` · offset 170465274 · sha256 `17ddded4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_CLAIM_AUTH`

Source: `chunk-0hm7n25m.js` · offset 170465299 · sha256 `45fa236b…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_RATE_LIMIT_TIER`

Source: `chunk-0hm7n25m.js` · offset 170465327 · sha256 `e321d560…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_DISPATCHER_SUBSCRIPTION_TYPE`

Source: `chunk-0hm7n25m.js` · offset 170465371 · sha256 `0c2fc73e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_ISOLATION`

Source: `chunk-0hm7n25m.js` · offset 170465417 · sha256 `3e476083…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_MEMORY_TOGGLED_OFF`

Source: `chunk-0hm7n25m.js` · offset 170465444 · sha256 `f0ff6f33…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_POST_CLEAR_RESPAWN`

Source: `chunk-0hm7n25m.js` · offset 170465480 · sha256 `6614dc88…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_PTY_AUTH`

Source: `chunk-0hm7n25m.js` · offset 170465516 · sha256 `1b2114e0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RENDEZVOUS_SOCK`

Source: `chunk-0hm7n25m.js` · offset 170465542 · sha256 `d6dc9ebd…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_RV_AUTH`

Source: `chunk-0hm7n25m.js` · offset 170465575 · sha256 `597a1eb5…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SESSION_PERMISSION_RULES`

Source: `chunk-0hm7n25m.js` · offset 170465600 · sha256 `16b87635…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOCKET_TOKENS_PATH`

Source: `chunk-0hm7n25m.js` · offset 170465642 · sha256 `ec75ced3…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_SOURCE`

Source: `chunk-0hm7n25m.js` · offset 170465678 · sha256 `1c9e60ee…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_STARTUP_WEDGE_MS`

Source: `chunk-0hm7n25m.js` · offset 170465702 · sha256 `a82c2d3c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BG_TCC_DISCLAIMED`

Source: `chunk-0hm7n25m.js` · offset 170465736 · sha256 `baeecabf…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170465768 · sha256 `d060cd64…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_OAUTH_TOKEN`

Source: `chunk-0hm7n25m.js` · offset 170465798 · sha256 `3edbff15…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_GROUPING`

Source: `chunk-0hm7n25m.js` · offset 170465831 · sha256 `8537a19e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_NO_BACKFILL`

Source: `chunk-0hm7n25m.js` · offset 170465870 · sha256 `76c57487…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OUTBOUND_ONLY`

Source: `chunk-0hm7n25m.js` · offset 170465912 · sha256 `a5c5f2d5…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ACCT`

Source: `chunk-0hm7n25m.js` · offset 170465956 · sha256 `22602ad0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_OWNER_ORG`

Source: `chunk-0hm7n25m.js` · offset 170465997 · sha256 `a7d0d22b…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SEQ`

Source: `chunk-0hm7n25m.js` · offset 170466037 · sha256 `7dbb8de9…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_REATTACH_SESSION`

Source: `chunk-0hm7n25m.js` · offset 170466071 · sha256 `5499570c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_BRIDGE_SESSION_INGRESS_URL`

Source: `chunk-0hm7n25m.js` · offset 170466109 · sha256 `7e8de0b4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CHROME_PAIRED_DEVICE_ID`

Source: `chunk-0hm7n25m.js` · offset 170466150 · sha256 `b73f17c0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CHROME_PERMISSION_MODE`

Source: `chunk-0hm7n25m.js` · offset 170466188 · sha256 `a62dabb4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CLIENT_PRESENCE_FILE`

Source: `chunk-0hm7n25m.js` · offset 170466225 · sha256 `4ea29dfd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a file that an external tool, such as a screen-lock listener, creates when you unlock your screen and deletes when you lock it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_3P_PROBE_WROTE_OPUS_DEFAULT`

Source: `chunk-29hpxtvj.js` · offset 183987682 · sha256 `ccb72edc…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_3P_PROBE_WROTE_SONNET_DEFAULT`

Source: `chunk-29hpxtvj.js` · offset 183987586 · sha256 `ce9c78a1…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ACCOUNT_UUID`

Source: `chunk-z62nk1ek.js` · offset 181606753 · sha256 `4930f81d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ACTION`

Source: `chunk-0hm7n25m.js` · offset 170466260 · sha256 `9f3a48d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`

Source: `chunk-0hm7n25m.js` · offset 170466286 · sha256 `a2c7538f…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1`.

From docs: Set to `1` to load memory files from directories specified with `--add-dir`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ADDITIONAL_PROTECTION`

Source: `chunk-0hm7n25m.js` · offset 170466338 · sha256 `697e847c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ADOPT_UNDERIVABLE_PARKED_PERMISSION`

Source: `chunk-0hm7n25m.js` · offset 170466379 · sha256 `7d3c850b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT`

Source: `chunk-0hm7n25m.js` · offset 170466434 · sha256 `9f5d699a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GH_SHIM`

Source: `chunk-z62nk1ek.js` · offset 181607231 · sha256 `4352d617…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT_PROXY_GIT_CONFIG`

Source: `chunk-z62nk1ek.js` · offset 181607161 · sha256 `0d6a6f05…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_AGENT_VIEW_RELAUNCH`

Source: `chunk-rd03gc9h.js` · offset 177210147 · sha256 `4e1f4ed2…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ALT_SCREEN_FULL_REPAINT`

Source: `chunk-acmmaxqh.js` · offset 186596282 · sha256 `7afedd7f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to repaint the entire screen on every frame in fullscreen rendering instead of sending incremental updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT`

Source: `chunk-0hm7n25m.js` · offset 170466459 · sha256 `ba88455d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_ASSET_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170466568 · sha256 `e5827a96…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_AUTO_OPEN`

Source: `chunk-0hm7n25m.js` · offset 170466611 · sha256 `3444aca0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `0` to stop Claude Code from opening the browser automatically when a new artifact is published

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ARTIFACT_LIVE_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170466649 · sha256 `aed8a69c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_SYNC_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170466691 · sha256 `9f30cdf1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACT_VIEWER_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170466733 · sha256 `717c652e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170466487 · sha256 `03a047fa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_ARTIFACTS_API_TOKEN`

Source: `chunk-0hm7n25m.js` · offset 170466529 · sha256 `4b724ed6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ATTRIBUTION_STATUS_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170466777 · sha256 `2d0a5c6f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_BACKGROUND_WORKER_CHECKIN_SECONDS`

Source: `chunk-0hm7n25m.js` · offset 170466826 · sha256 `23ef7e2c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: When `CLAUDE_AUTO_BACKGROUND_TASKS` is enabled, seconds between reminders to Claude to check on background subagents that are still running.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_COMPACT_WINDOW`

Source: `chunk-0hm7n25m.js` · offset 170466884 · sha256 `d82ca5a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the auto-compact window in tokens, from `100000` to `1000000`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_AUTO_MODE_EXTERNAL_PERMISSIONS`

Source: `chunk-0hm7n25m.js` · offset 170466923 · sha256 `dd285556…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_AUTO_MODE_SERVER`

Source: `chunk-egfec2sr.js` · offset 183334710 · sha256 `d3bfcb14…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: Controls whether Claude Code asks the server to review auto mode actions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BASE_REF`

Source: `chunk-0hm7n25m.js` · offset 170466973 · sha256 `5c97329b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BASE_REFS`

Source: `chunk-0hm7n25m.js` · offset 170467001 · sha256 `0a1b1df2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE`

Source: `chunk-0hm7n25m.js` · offset 170467030 · sha256 `9a8208b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_ARTIFACT`

Source: `chunk-0hm7n25m.js` · offset 170467073 · sha256 `b87cec58…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_AUTO_DEFAULT`

Source: `chunk-0hm7n25m.js` · offset 170467114 · sha256 `889002ba…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_CHILD_MACHINE_SETTINGS`

Source: `chunk-0hm7n25m.js` · offset 170467159 · sha256 `08f7268a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_MCP_CARRIER`

Source: `chunk-0hm7n25m.js` · offset 170467208 · sha256 `836acaba…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ACCOUNT_UUID`

Source: `chunk-0hm7n25m.js` · offset 170467246 · sha256 `6651145d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_OWNER_ORG_UUID`

Source: `chunk-0hm7n25m.js` · offset 170467291 · sha256 `b8c92616…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_PROMPT_SHA256`

Source: `chunk-0hm7n25m.js` · offset 170467332 · sha256 `064ad88a…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIDGE_SESSION_ID`

Source: `chunk-0hm7n25m.js` · offset 170467372 · sha256 `fa159b3e…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set automatically in Bash tool and hook command subprocesses while the session has an active Remote Control connection, and removed when the connection ends.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_BRIEF`

Source: `chunk-0hm7n25m.js` · offset 170467409 · sha256 `e68e1bed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BRIEF_UPLOAD`

Source: `chunk-0hm7n25m.js` · offset 170467434 · sha256 `2b05a73d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_BYOC_ENABLE_DATADOG`

Source: `chunk-z62nk1ek.js` · offset 181605897 · sha256 `b5489158…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CCR_SURFACE`

Source: `chunk-0hm7n25m.js` · offset 170467466 · sha256 `7543a60e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CHILD_SESSION`

Source: `chunk-7kwd28ae.js` · offset 175487905 · sha256 `5ca39f62…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1`.

From docs: Set to `1` in subprocesses Claude Code spawns via the Bash, PowerShell, and Monitor tools, hook commands, and status line commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_CHROME_MCP_ORG_DENIED`

Source: `chunk-4jbzqc2f.js` · offset 202988470 · sha256 `f90629e3…` · 2 read sites

Set for: stdio MCP servers.

Value: `1` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CLASSIFIER_SUMMARY`

Source: `chunk-0hm7n25m.js` · offset 170467497 · sha256 `2d448712…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_CONTAINER_ID`

Source: `chunk-0hm7n25m.js` · offset 170467535 · sha256 `8dbcd3fd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_MODE`

Source: `chunk-4e7z6rdh.js` · offset 176783337 · sha256 `deebb752…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_COORDINATOR_WORKER_CHECKIN_SECONDS`

Source: `chunk-0hm7n25m.js` · offset 170467567 · sha256 `c0376380…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DAEMON_COLD_START`

Source: `chunk-0hm7n25m.js` · offset 170467621 · sha256 `c4683dfc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DECSTBM`

Source: `chunk-0hm7n25m.js` · offset 170467658 · sha256 `7492adc9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DESKTOP_APP_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170467685 · sha256 `b1a5417b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DEV_RAW_CHANGELOG_URL`

Source: `chunk-0hm7n25m.js` · offset 170467724 · sha256 `172522c9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_CHAIN`

Source: `chunk-0hm7n25m.js` · offset 170467765 · sha256 `d7f57d71…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_DISABLE_ANCHORING`

Source: `chunk-0hm7n25m.js` · offset 170467799 · sha256 `26d96280…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_ENGINE`

Source: `chunk-0hm7n25m.js` · offset 170467845 · sha256 `a011b557…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_FFWD`

Source: `chunk-0hm7n25m.js` · offset 170467880 · sha256 `e13c9448…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_GIT`

Source: `chunk-0hm7n25m.js` · offset 170467913 · sha256 `500a2f12…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DIR_SYNC_STREAM`

Source: `chunk-0hm7n25m.js` · offset 170467945 · sha256 `653e5fb2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_BG_SHELL_PRESSURE_REAP`

Source: `chunk-0hm7n25m.js` · offset 170467980 · sha256 `9d7dca50…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to stop Claude Code from terminating background shell commands under memory pressure.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_CLAUDE_MDS`

Source: `chunk-bjmhhyed.js` · offset 186048861 · sha256 `1d80e502…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to prevent loading any CLAUDE.md memory files into context, including user, project, and auto memory files

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_DIR_SYNC`

Source: `chunk-0hm7n25m.js` · offset 170468030 · sha256 `07d5721b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`

Source: `chunk-egfec2sr.js` · offset 183334817 · sha256 `547fd99f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1` (set only under a condition).

From docs: Set to `1` to strip Anthropic-specific `anthropic-beta` request headers and beta tool-schema fields (such as `defer_loading` and `eager_input_streaming`) from API requests.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_HOOK_FORWARDING`

Source: `chunk-0hm7n25m.js` · offset 170468066 · sha256 `e9d3066a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`

Source: `chunk-z62nk1ek.js` · offset 181606059 · sha256 `2d0e16d2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to disable nonessential network traffic: auto-updates, telemetry, error reporting, the `/feedback` command, Claude-drafted feedback, release notes, the PR and MR status badge checks, and availability checks such as the fast mode check.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_DISABLE_PLUGIN_FORWARDING`

Source: `chunk-0hm7n25m.js` · offset 170468109 · sha256 `36c1301d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_TURN_HANDOFF`

Source: `chunk-0hm7n25m.js` · offset 170468154 · sha256 `8ac08c14…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_VITALS_EMITTER`

Source: `chunk-0hm7n25m.js` · offset 170468194 · sha256 `9f11e23b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DISABLE_WORKING_SYNC`

Source: `chunk-0hm7n25m.js` · offset 170468236 · sha256 `86dfb990…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DONT_INHERIT_ENV`

Source: `chunk-0hm7n25m.js` · offset 170468276 · sha256 `b86e198e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_DOWNLOAD_DEADLINE_MS_FOR_TESTING`

Source: `chunk-0hm7n25m.js` · offset 170468312 · sha256 `83e6073d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_SESSION_STATE_EVENTS`

Source: `chunk-0hm7n25m.js` · offset 170468364 · sha256 `61863d4a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_STARTUP_TIMING`

Source: `chunk-0hm7n25m.js` · offset 170468409 · sha256 `62d14d57…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES`

Source: `chunk-0hm7n25m.js` · offset 170468448 · sha256 `bdd2e277…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENABLE_APPEND_SUBAGENT_PROMPT`

Source: `chunk-bjmhhyed.js` · offset 186002270 · sha256 `052b3c77…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENTRYPOINT`

Source: `chunk-0hm7n25m.js` · offset 170468491 · sha256 `d8b3679e…` · 6 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `local-agent`; `sdk-cli`; `mcp`; `claude-code-github-action`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_KIND`

Source: `chunk-0hm7n25m.js` · offset 170468521 · sha256 `44f3f5ff…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `byoc`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ENVIRONMENT_RUNNER_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170468557 · sha256 `d8eea1e0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_CONFINED`

Source: `chunk-0hm7n25m.js` · offset 170468603 · sha256 `cc04e5e9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EVAL_INTERVIEW_SESSION`

Source: `chunk-2yxmcerc.js` · offset 198965668 · sha256 `02ae815b…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXECPATH`

Source: `chunk-dt8bvbsd.js` · offset 178128209 · sha256 `a4da5322…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER`

Source: `chunk-0hm7n25m.js` · offset 170468636 · sha256 `b12dd050…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY`

Source: `chunk-0hm7n25m.js` · offset 170468679 · sha256 `ce168e1e…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; removed (set to undefined or deleted).

From docs: Time in milliseconds to wait after the query loop becomes idle before automatically exiting.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_EXTRA_BODY`

Source: `chunk-egfec2sr.js` · offset 183334610 · sha256 `f495f99b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

From docs: JSON object to merge into the top level of every API request body.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_FLAG_FETCH_WAIT_MS`

Source: `chunk-0hm7n25m.js` · offset 170468720 · sha256 `828f1033…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FOOTER_INDICATOR`

Source: `chunk-0hm7n25m.js` · offset 170468758 · sha256 `fe858677…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_BRIDGE`

Source: `chunk-0hm7n25m.js` · offset 170468794 · sha256 `ec4e2260…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_EVALUATE_MEMORY`

Source: `chunk-0hm7n25m.js` · offset 170468826 · sha256 `34fad547…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_FULLSCREEN_UPSELL`

Source: `chunk-0hm7n25m.js` · offset 170468867 · sha256 `440dcad2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_FORCE_MEMORY_SURVEY`

Source: `chunk-0hm7n25m.js` · offset 170468910 · sha256 `b037013c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_FORCE_TIP_ID`

Source: `chunk-0hm7n25m.js` · offset 170468949 · sha256 `27f06285…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_GATEWAY_TOKEN_FILE_DESCRIPTOR`

Source: `chunk-8snes1yz.js` · offset 172389108 · sha256 `3b31760f…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_GIT_BASH_PATH`

Source: `chunk-0hm7n25m.js` · offset 170468981 · sha256 `39f55491…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Windows only: path to the Git Bash executable (`bash.exe`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GLOB_TIMEOUT_SECONDS`

Source: `chunk-0hm7n25m.js` · offset 170469014 · sha256 `49daeeaa…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in seconds for Glob tool file discovery.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_GOAL_CHECKIN_MINUTES`

Source: `chunk-0hm7n25m.js` · offset 170469054 · sha256 `47847131…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many minutes background work can keep an active goal waiting before Claude Code asks Claude to check on it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_HIDE_SETTINGS_HINT`

Source: `chunk-0hm7n25m.js` · offset 170469094 · sha256 `53d8c2e7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOLD_REPORT_PARK_AT_INIT`

Source: `chunk-0hm7n25m.js` · offset 170469132 · sha256 `4031de4d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_HOLD_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170469176 · sha256 `4cd5e7eb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOME_SEED_VERDICT_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170469221 · sha256 `7614ab6a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOOKS_SAME_THREAD`

Source: `chunk-77msscky.js` · offset 187028374 · sha256 `fef81b59…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_CREDS_FILE`

Source: `chunk-egfec2sr.js` · offset 183334521 · sha256 `00e86f7e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_PLATFORM`

Source: `chunk-0hm7n25m.js` · offset 170469269 · sha256 `3bac5124…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_HOST_SESSION_ID`

Source: `chunk-0hm7n25m.js` · offset 170469302 · sha256 `e975abf2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDE_HOST_OVERRIDE`

Source: `chunk-0hm7n25m.js` · offset 170469337 · sha256 `f498dee0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the host address used to connect to the IDE extension.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_IDLE_THRESHOLD_MINUTES`

Source: `chunk-0hm7n25m.js` · offset 170469374 · sha256 `3ee47e97…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_IDLE_TOKEN_THRESHOLD`

Source: `chunk-0hm7n25m.js` · offset 170469416 · sha256 `02fa6796…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_INVOKED_SKILLS`

Source: `chunk-dt8bvbsd.js` · offset 178128348 · sha256 `de042d2a…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_IS_COWORK`

Source: `chunk-0hm7n25m.js` · offset 170469456 · sha256 `1d8abb4f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LEGACY_BUNDLE`

Source: `chunk-0hm7n25m.js` · offset 170469485 · sha256 `b17d60ce…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_KEEPALIVE`

Source: `chunk-0hm7n25m.js` · offset 170469518 · sha256 `3d759310…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_LOOP_PERSISTENT`

Source: `chunk-0hm7n25m.js` · offset 170469552 · sha256 `db8be82f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MANAGED_SETTINGS_PATH`

Source: `chunk-0hm7n25m.js` · offset 170469587 · sha256 `34c9801a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_NAME`

Source: `chunk-ccz3kqt0.js` · offset 175251143 · sha256 `8df357a4…`

Set for: marketplace headersHelper command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MARKETPLACE_URL`

Source: `chunk-ccz3kqt0.js` · offset 175251097 · sha256 `b176eb5e…`

Set for: marketplace headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`

Source: `chunk-0hm7n25m.js` · offset 170469628 · sha256 `8237cf42…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many subagents can be running in one session before the Agent tool refuses to spawn another (default: 20).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`

Source: `chunk-0hm7n25m.js` · offset 170469672 · sha256 `f157138d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum length in characters of each MCP tool description and each MCP server's instructions that Claude Code sends to the model (default: 2048).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_RETRIES`

Source: `chunk-z62nk1ek.js` · offset 181606420 · sha256 `3a009d51…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

From docs: Override the number of times to retry failed API requests (default: 10).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`

Source: `chunk-0hm7n25m.js` · offset 170469718 · sha256 `3a5e3f0d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Number of subagent layers allowed below the main conversation (default: 3).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`

Source: `chunk-0hm7n25m.js` · offset 170469762 · sha256 `59afb6cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Cap on the total number of WebSearch calls one session can make (default: 200).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_ALLOWLIST_ENV`

Source: `chunk-0hm7n25m.js` · offset 170469810 · sha256 `f121d350…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to spawn stdio MCP servers with only a safe baseline environment plus the server's configured `env`, instead of inheriting your shell environment

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`

Source: `chunk-0hm7n25m.js` · offset 170469847 · sha256 `2364ee0f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Elapsed time in milliseconds before a still-running MCP tool call moves to a background task (default: 120000, or 2 minutes).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_CONNECTOR_PREWAIT_MS`

Source: `chunk-0hm7n25m.js` · offset 170469889 · sha256 `5d8cfb65…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_MEMORY_CGROUP`

Source: `chunk-0hm7n25m.js` · offset 170469933 · sha256 `c3653e63…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_MCP_SERVER_NAME`

Source: `chunk-s7d4gm51.js` · offset 202703094 · sha256 `0a578ed5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_SERVER_URL`

Source: `chunk-s7d4gm51.js` · offset 202703124 · sha256 `024bb5f5…`

Set for: MCP server headersHelper command.

Value: a runtime value.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_CODE_MCP_STARTUP_WAIT_MS`

Source: `chunk-0hm7n25m.js` · offset 170469970 · sha256 `f4857cfb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long in milliseconds the first turn of a non-interactive session waits for MCP servers that are still connecting, in place of the default first-turn wait.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MCP_TOOL_IDLE_TIMEOUT`

Source: `chunk-0hm7n25m.js` · offset 170470009 · sha256 `2c534b1a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Idle timeout in milliseconds for MCP tool calls.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MESSAGING_SOCKET`

Source: `chunk-1s64prse.js` · offset 196197762 · sha256 `26264f08…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports that socket's path to hooks and Bash commands when it binds the socket.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MESSAGING_TOKEN`

Source: `chunk-1s64prse.js` · offset 196197810 · sha256 `07e742ce…` · 4 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value.

From docs: Set by Claude Code, not by you: in sessions that bind an inbox socket, Claude Code exports this per-session token to hooks and Bash commands alongside `CLAUDE_CODE_MESSAGING_SOCKET`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_MOCK_REMOTE_SETTINGS`

Source: `chunk-0hm7n25m.js` · offset 170470050 · sha256 `2a0300eb…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_MOCK_TRIAL`

Source: `chunk-0hm7n25m.js` · offset 170470090 · sha256 `2dfcef1b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_OAUTH_SCOPES`

Source: `chunk-z62nk1ek.js` · offset 181605684 · sha256 `65f9f6f4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `user:inference user:ccr_inference user:file_upload`.

From docs: Space-separated OAuth scopes the refresh token was issued with, such as `"user:profile user:inference user:sessions:claude_code"`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OAUTH_TOKEN`

Source: `chunk-1kphg7b9.js` · offset 182598074 · sha256 `6c5df5de…` · 8 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: OAuth access token for claude.ai authentication.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_ORGANIZATION_UUID`

Source: `chunk-z62nk1ek.js` · offset 181606836 · sha256 `db7704ea…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_OTEL_DIAG_STDERR`

Source: `chunk-z62nk1ek.js` · offset 181606269 · sha256 `32a58f68…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

From docs: Set to `1` to write OpenTelemetry exporter diagnostic errors to stderr.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_OVERRIDE_DATE`

Source: `chunk-0hm7n25m.js` · offset 170470120 · sha256 `a2269e43…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PARKED_PERMISSION_WAIT_MS`

Source: `chunk-0hm7n25m.js` · offset 170470153 · sha256 `ac80af54…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PARKED_STOP_RETIRES`

Source: `chunk-0hm7n25m.js` · offset 170470198 · sha256 `de93bede…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PERFORCE_MODE`

Source: `chunk-0hm7n25m.js` · offset 170470237 · sha256 `7bd25fe5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to enable Perforce-aware write protection.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLAN_V2_AGENT_COUNT`

Source: `chunk-0hm7n25m.js` · offset 170470270 · sha256 `b0273d91…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLAN_V2_EXPLORE_AGENT_COUNT`

Source: `chunk-0hm7n25m.js` · offset 170470309 · sha256 `c8c0e4f3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ARCHIVE_URL`

Source: `chunk-ccz3kqt0.js` · offset 175251771 · sha256 `c4405f96…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_ATTRIBUTION`

Source: `chunk-0hm7n25m.js` · offset 170470356 · sha256 `3d9982b6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_CACHE_DIR`

Source: `chunk-0hm7n25m.js` · offset 170470394 · sha256 `8a6e66d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the plugins root directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_DIRS`

Source: `chunk-7p9ft896.js` · offset 183433916 · sha256 `e866bde0…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value (set only under a condition).

From docs: Plugin directories to load for the session, each loaded the way a `--plugin-dir` flag loads it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170470430 · sha256 `e3263f04…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for cloning or refreshing a plugin marketplace (default: 120000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PLUGIN_NAME`

Source: `chunk-ccz3kqt0.js` · offset 175251734 · sha256 `60d6a445…`

Set for: plugin headersHelper command.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PLUGIN_SEED_DIR`

Source: `chunk-0hm7n25m.js` · offset 170470471 · sha256 `af17c5f3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to one or more read-only plugin seed directories, separated by `:` on Unix or `;` on Windows.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_POST_TURN_MEMORY`

Source: `chunk-0hm7n25m.js` · offset 170470506 · sha256 `317bfa4b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_CONFIG`

Source: `chunk-0hm7n25m.js` · offset 170470542 · sha256 `f0703c1e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POST_TURN_MEMORY_SYNC`

Source: `chunk-0hm7n25m.js` · offset 170470585 · sha256 `f67341e2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_POWERUP_ONBOARDING`

Source: `chunk-0hm7n25m.js` · offset 170470626 · sha256 `f811b840…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_PROJECT_DIR_NAME`

Source: `chunk-0hm7n25m.js` · offset 170470664 · sha256 `81821a5d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set together with `CLAUDE_CONFIG_DIR` to choose the `projects/` directory name Claude Code stores that session's transcripts and auto memory under, in place of one derived from the working directory path.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_PROXY_AUTHENTICATE`

Source: `chunk-kbjsjr7g.js` · offset 181445156 · sha256 `3233d74f…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_HOST`

Source: `chunk-kbjsjr7g.js` · offset 181445123 · sha256 `e651775d…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PROXY_URL`

Source: `chunk-kbjsjr7g.js` · offset 181445075 · sha256 `a68a4b7d…` · 2 read sites

Set for: proxy authorization command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_PWSH_PARSE_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170470700 · sha256 `3f20ed7d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_EXTENDED`

Source: `chunk-0hm7n25m.js` · offset 170470741 · sha256 `d4a6acc9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_OPTIONAL_DESCRIPTIONS`

Source: `chunk-0hm7n25m.js` · offset 170470778 · sha256 `3ab8a032…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_QUESTION_PREVIEW_FORMAT`

Source: `chunk-0hm7n25m.js` · offset 170470828 · sha256 `98dfadb0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RATE_LIMIT_TIER`

Source: `chunk-8snes1yz.js` · offset 172386808 · sha256 `cce5dc89…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RELAUNCH_TERMINAL_SIZE`

Source: `chunk-0hm7n25m.js` · offset 170470871 · sha256 `f3dbe76e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE`

Source: `chunk-0hm7n25m.js` · offset 170470913 · sha256 `57a5937b…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `true`.

From docs: Set automatically to `true` when Claude Code is running as a cloud session.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_ENVIRONMENT_TYPE`

Source: `chunk-0hm7n25m.js` · offset 170470939 · sha256 `38605671…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `self_hosted`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_HERMETIC_MODE`

Source: `chunk-0hm7n25m.js` · offset 170470982 · sha256 `2dd2a5a9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_MEMORY_DIR`

Source: `chunk-0hm7n25m.js` · offset 170471022 · sha256 `dd71e062…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_RAW_EVENTS_FILE`

Source: `chunk-0hm7n25m.js` · offset 170471059 · sha256 `5ecf8473…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SEND_KEEPALIVES`

Source: `chunk-0hm7n25m.js` · offset 170471101 · sha256 `3d233f1c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_ID`

Source: `chunk-0hm7n25m.js` · offset 170471143 · sha256 `b7311c6f…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set automatically in cloud sessions to the current session's ID.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_REMOTE_SESSION_ORIGIN`

Source: `chunk-0hm7n25m.js` · offset 170471180 · sha256 `0749782e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SESSION_UUID`

Source: `chunk-z62nk1ek.js` · offset 181606715 · sha256 `f2890a04…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The same session ID in canonical UUID form, for systems that key on UUIDs.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_REMOTE_SETTINGS_PATH`

Source: `chunk-0hm7n25m.js` · offset 170471221 · sha256 `26f75771…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REMOTE_SETTINGS_POLL_MS`

Source: `chunk-0hm7n25m.js` · offset 170471261 · sha256 `fe414d1f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_REPL`

Source: `chunk-0hm7n25m.js` · offset 170471304 · sha256 `3bcc8f91…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_REPO_CHECKOUTS`

Source: `chunk-0hm7n25m.js` · offset 170471328 · sha256 `9cc98b69…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESTRICTED`

Source: `chunk-0hm7n25m.js` · offset 170471362 · sha256 `866f7743…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1` (set only under a condition).

From docs: Set to `1` to start the session in restricted mode, the same as passing `--restricted`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_FROM_SESSION`

Source: `chunk-0hm7n25m.js` · offset 170471392 · sha256 `b79d2b73…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN`

Source: `chunk-0hm7n25m.js` · offset 170471431 · sha256 `b0934371…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to automatically resume if the previous session ended mid-turn.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_INTERRUPTED_TURN_MAX_AGE_MS`

Source: `chunk-0hm7n25m.js` · offset 170471474 · sha256 `f4fcab73…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age in milliseconds of the last transcript message for a session that ended mid-turn to continue automatically on resume.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_PROMPT`

Source: `chunk-0hm7n25m.js` · offset 170471528 · sha256 `94087e32…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the continuation message Claude Code sends to Claude when `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` continues an interrupted turn instead of resending its prompt, or when you resume a deferred tool call with `-p`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_RESUME_REASON`

Source: `chunk-0hm7n25m.js` · offset 170471561 · sha256 `ba3c5002…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_SOURCE_ALIVE`

Source: `chunk-0hm7n25m.js` · offset 170471594 · sha256 `637a7b0b…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_THRESHOLD_MINUTES`

Source: `chunk-0hm7n25m.js` · offset 170471633 · sha256 `bdd1c3e7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOKEN_THRESHOLD`

Source: `chunk-0hm7n25m.js` · offset 170471677 · sha256 `ea92d424…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RESUME_TOLERATES_CONTEXT_APPENDS`

Source: `chunk-0hm7n25m.js` · offset 170471719 · sha256 `fd2ced21…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_RETRY_WATCHDOG`

Source: `chunk-z62nk1ek.js` · offset 181606389 · sha256 `abe83105…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

From docs: Set to `1` for unattended sessions such as eval harnesses, CI jobs, or remote workers.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SAFE_MODE`

Source: `chunk-0hm7n25m.js` · offset 170471771 · sha256 `0c0b771d…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to start in safe mode: CLAUDE.md, skills, plugins, hooks, MCP servers, custom commands and agents, output styles, workflows, custom themes, custom keybindings, status line and file-suggestion commands, LSP servers, and auto memory do not load, for troubleshooting a broken configuration.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SANDBOXED`

Source: `chunk-0hm7n25m.js` · offset 170471800 · sha256 `20ad9930…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SCRIPT_CAPS`

Source: `chunk-0hm7n25m.js` · offset 170471829 · sha256 `5efbf7b0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON object limiting how many times specific scripts may be invoked per session when `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` is set.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SCROLL_SPEED`

Source: `chunk-0hm7n25m.js` · offset 170471860 · sha256 `a9a2a010…` · 5 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set the mouse wheel scroll multiplier in fullscreen rendering.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_ACCESS_TOKEN`

Source: `chunk-8snes1yz.js` · offset 172390715 · sha256 `535b218e…` · 9 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: removed (set to undefined or deleted); a runtime value (set only under a condition).

From docs: The session JWT, prefixed `sk-ant-cc-`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_CODE_SESSION_ATTENDED`

Source: `chunk-7kwd28ae.js` · offset 175487935 · sha256 `a333688f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `1` or `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ID`

Source: `chunk-0hm7n25m.js` · offset 170471939 · sha256 `6e5b673d…` · 5 read sites

Set for: stdio MCP servers; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Set automatically to the current session ID in Bash and PowerShell tool subprocesses, hook command subprocesses, and stdio MCP server subprocesses.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SESSION_KIND`

Source: `chunk-0hm7n25m.js` · offset 170471969 · sha256 `f1a2f62f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_NAME`

Source: `chunk-0hm7n25m.js` · offset 170472001 · sha256 `e7a03865…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_ORIGIN`

Source: `chunk-0hm7n25m.js` · offset 170472033 · sha256 `d178fca6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSION_START_ANNOUNCEMENTS_BEFORE_PROMPT`

Source: `chunk-0hm7n25m.js` · offset 170472067 · sha256 `7be7a55d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170471892 · sha256 `c5f545ef…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the time budget in milliseconds for SessionEnd hooks.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL`

Source: `chunk-0hm7n25m.js` · offset 170472128 · sha256 `22164738…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set the shell Claude Code uses to run Bash tool commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SHELL_PREFIX`

Source: `chunk-0hm7n25m.js` · offset 170472153 · sha256 `4e560bd7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Command prefix that wraps shell commands Claude Code spawns: Bash tool calls, hook commands, status line commands, and stdio MCP server startup commands.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE`

Source: `chunk-0hm7n25m.js` · offset 170472185 · sha256 `d631662f…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; `1`.

From docs: Set to `1` to run with a minimal system prompt and only the Bash, file read, and file edit tools.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SIMPLE_SYSTEM_PROMPT`

Source: `chunk-0hm7n25m.js` · offset 170472211 · sha256 `13329891…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to use a shorter system prompt and abbreviated tool descriptions on any model.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SKILL_ATTRIBUTION`

Source: `chunk-0hm7n25m.js` · offset 170472251 · sha256 `a914ed05…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SPAWN_TIMESTAMP_MS`

Source: `chunk-0hm7n25m.js` · offset 170472288 · sha256 `7ea9f9d0…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SSE_PORT`

Source: `chunk-0hm7n25m.js` · offset 170472326 · sha256 `9f64e7ab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STALL_TIMEOUT_MS_FOR_TESTING`

Source: `chunk-0hm7n25m.js` · offset 170472354 · sha256 `265ae9e8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_STARTUP_FAILURE_RESULTS`

Source: `chunk-0hm7n25m.js` · offset 170472402 · sha256 `a48a2529…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to have a session started with `--output-format stream-json` write a result message naming why Claude Code refused to start for startup failures that otherwise end with stderr alone.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`

Source: `chunk-0hm7n25m.js` · offset 170472445 · sha256 `9729f18a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of consecutive times a Stop or SubagentStop hook may block the turn from ending before Claude Code overrides it and ends the turn anyway (default: 8).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`

Source: `chunk-0hm7n25m.js` · offset 170472484 · sha256 `e79e09bf…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set to `1` to strip credentials from subprocess environments (Bash tool, hooks, MCP stdio servers): Anthropic and cloud provider credentials, any other variable that Claude Code recognizes as a credential, and credentials embedded in package registry URLs.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SUBSCRIPTION_TYPE`

Source: `chunk-8snes1yz.js` · offset 172386728 · sha256 `2815a03c…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SUPERVISED`

Source: `chunk-0hm7n25m.js` · offset 170472524 · sha256 `cb0085f7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGIN_INSTALL_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170472752 · sha256 `9ad0c12c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for synchronous plugin installation.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_PLUGINS_BUFFERED_DOWNLOAD`

Source: `chunk-0hm7n25m.js` · offset 170472554 · sha256 `5b68a048…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_DOWNLOAD_STALL_MS`

Source: `chunk-0hm7n25m.js` · offset 170472604 · sha256 `ba1c27df…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_INSTALL_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170472654 · sha256 `4aa6d129…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_PLUGINS_MCP_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170472705 · sha256 `9ce010d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_REUSE_WITHIN_MS`

Source: `chunk-0hm7n25m.js` · offset 170472802 · sha256 `6e6115f8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SESSION_REFS`

Source: `chunk-0hm7n25m.js` · offset 170472842 · sha256 `b7116ac6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_SYNC_SKILLS_INSTALL_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170472879 · sha256 `a26e106b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the skills resync that runs mid-session when an app built on the Agent SDK reloads skills (default: 30000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNC_SKILLS_WAIT_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170472929 · sha256 `bfc23a82…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for the first query to wait for the initial skill list when `CLAUDE_CODE_SYNC_SKILLS` is set (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYNTAX_HIGHLIGHT`

Source: `chunk-0hm7n25m.js` · offset 170472976 · sha256 `76f6c82f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `false` to disable syntax highlighting in diff output.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_SYSTEM_PROMPT_GB_FEATURE`

Source: `chunk-0hm7n25m.js` · offset 170473012 · sha256 `ef61ec03…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TAGS`

Source: `chunk-0hm7n25m.js` · offset 170473056 · sha256 `b7fd2060…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TASK_LIST_ID`

Source: `chunk-0hm7n25m.js` · offset 170473080 · sha256 `0507de8a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Share a task list across sessions.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEAM_TEARDOWN_PARK_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170473112 · sha256 `1991458a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override, in milliseconds, how long a non-interactive session waits at exit for its agent team to finish tearing down.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TEE_SDK_STDOUT`

Source: `chunk-z62nk1ek.js` · offset 181606302 · sha256 `58c86fe2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TERMINAL_MCP_TOOLS`

Source: `chunk-0hm7n25m.js` · offset 170473161 · sha256 `97a572a9…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_ALLOW_REAL_NETWORK`

Source: `chunk-0hm7n25m.js` · offset 170473199 · sha256 `de897d21…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FIXTURES_ROOT`

Source: `chunk-0hm7n25m.js` · offset 170473242 · sha256 `dde4f4b2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TEST_FORCE_DENY`

Source: `chunk-0hm7n25m.js` · offset 170473280 · sha256 `6c456ccf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_GIT_BASH`

Source: `chunk-0hm7n25m.js` · offset 170473315 · sha256 `54c389e3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TEST_NO_PWSH`

Source: `chunk-0hm7n25m.js` · offset 170473351 · sha256 `db7efc0a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_TMPDIR`

Source: `chunk-0hm7n25m.js` · offset 170473383 · sha256 `461723f9…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

From docs: Override the temp directory used for internal temp files.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TMUX_PREFIX`

Source: `chunk-0hm7n25m.js` · offset 170473409 · sha256 `e9c3f9bf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_PREFIX_CONFLICTS`

Source: `chunk-0hm7n25m.js` · offset 170473440 · sha256 `8b90f301…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_SESSION`

Source: `chunk-0hm7n25m.js` · offset 170473481 · sha256 `0c5eea2a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TMUX_TRUECOLOR`

Source: `chunk-0hm7n25m.js` · offset 170473513 · sha256 `527bd1fe…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to allow 24-bit truecolor output inside tmux. **Setting it to `0` or `false` still allows truecolor**, unlike most on/off variables; unset the variable to restore the 256-color clamp.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_CGROUP_EXCLUDE`

Source: `chunk-0hm7n25m.js` · offset 170473547 · sha256 `aba9afab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a comma-separated list of the kinds of processes Claude Code excludes from the tool memory cap, such as `mcp` or `lsp`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TOOL_MEMORY_LIMIT`

Source: `chunk-0hm7n25m.js` · offset 170473593 · sha256 `adcca996…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On Linux and WSL, set to a size such as `4G` to cap the memory that Bash and PowerShell tool commands can use, and Monitor tool commands on v2.1.246 or later.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_TRIGGER_ID`

Source: `chunk-0hm7n25m.js` · offset 170473630 · sha256 `48c249f7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_JUST_SWITCHED`

Source: `chunk-0hm7n25m.js` · offset 170473660 · sha256 `d7d04f6a…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_TUI_TRIAL`

Source: `chunk-0hm7n25m.js` · offset 170473697 · sha256 `2846fddc…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_PREFLIGHT_FIXTURE`

Source: `chunk-0hm7n25m.js` · offset 170473726 · sha256 `89d4b65c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_ULTRAREVIEW_QUOTA_FIXTURE`

Source: `chunk-0hm7n25m.js` · offset 170473775 · sha256 `5acbac30…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_USE_CCR_V2`

Source: `chunk-z62nk1ek.js` · offset 181607134 · sha256 `fe501e0a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_USER_DIALOG_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170473820 · sha256 `37245517…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Deadline in milliseconds before Claude Code cancels a dialog it forwards to a remote client such as a Remote Control or SDK host, or the approval dialog for a held cross-session message; permission prompts and `AskUserQuestion` questions use their own flows and aren't governed by it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_CODE_VERSION`

Source: `chunk-yr2mhv8p.js` · offset 171349383 · sha256 `2635daf5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_CODE_VOICE_FORWARD_INTERIMS_TYPED`

Source: `chunk-0hm7n25m.js` · offset 170473862 · sha256 `de3f5b44…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKER_EPOCH`

Source: `chunk-0hm7n25m.js` · offset 170473910 · sha256 `f7116576…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CODE_WORKSPACE_HOST_PATHS`

Source: `chunk-0hm7n25m.js` · offset 170473942 · sha256 `d8fb45fc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_CONFIG_DIR`

Source: `chunk-0hm7n25m.js` · offset 170473982 · sha256 `b71d797c…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the configuration directory (default: `~/.claude`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_COWORK_MEMORY_EXTRA_GUIDELINES`

Source: `chunk-0hm7n25m.js` · offset 170474007 · sha256 `6df27e78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_GUIDELINES`

Source: `chunk-0hm7n25m.js` · offset 170474052 · sha256 `446568e5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_INDEX_CONTENT`

Source: `chunk-0hm7n25m.js` · offset 170474091 · sha256 `d051a9f3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`

Source: `chunk-0hm7n25m.js` · offset 170474133 · sha256 `7ebc04e1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_EFFORT`

Source: `chunk-7kwd28ae.js` · offset 175488082 · sha256 `79c852b9…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

From docs: Set automatically in Bash tool subprocesses and hook commands to the effort level in effect when the subprocess starts: `low`, `medium`, `high`, `xhigh`, or `max`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENABLE_STREAM_WATCHDOG`

Source: `chunk-z62nk1ek.js` · offset 181606558 · sha256 `ec79e2d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

From docs: Set to `0` to force-disable the event-level streaming idle watchdog, or set to `1` to force-enable it.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_ENV_FILE`

Source: `chunk-0hm7n25m.js` · offset 170474175 · sha256 `69299edd…` · 2 read sites

Set for: hook commands.

Value: a runtime value (set only under a condition). Condition values in code: `SessionStart`, `Setup`, `CwdChanged`, `FileChanged`.

From docs: Path to a shell script whose contents Claude Code runs before each Bash command in the same shell process, so exports in the file are visible to the command.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_FORCE_DISPLAY_SURVEY`

Source: `chunk-0hm7n25m.js` · offset 170474198 · sha256 `6d4954e8…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_ASSISTANT_TEAM_NAME`

Source: `chunk-0hm7n25m.js` · offset 170474233 · sha256 `dfe3bc09…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_INTERNAL_FC_OVERRIDES`

Source: `chunk-0hm7n25m.js` · offset 170474276 · sha256 `c2c9cef2…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_JOB_DIR`

Source: `chunk-0hm7n25m.js` · offset 170474312 · sha256 `d565c756…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set by Claude Code in each background session to that session's `~/.claude/jobs/` directory.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_MEMORY_STORES`

Source: `chunk-0hm7n25m.js` · offset 170474334 · sha256 `f0a5b46c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PID`

Source: `chunk-7kwd28ae.js` · offset 175487978 · sha256 `51f03cbe…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: Claude Code's process ID.

From docs: Claude Code sets this to its own process ID in the subprocesses it spawns: Bash and PowerShell tool commands and hook commands.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_PLUGIN_DATA`

Source: `chunk-dt8bvbsd.js` · offset 177462012 · sha256 `f511c9b8…` · 3 read sites

Set for: plugin-provided stdio MCP servers; hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_OPTION_*`

Source: `chunk-dt8bvbsd.js` · offset 179479899 · sha256 `d08f3bfe…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `CLAUDE_PLUGIN_ROOT`

Source: `chunk-dt8bvbsd.js` · offset 177461986 · sha256 `b6f07f6c…` · 5 read sites

Set for: plugin-provided stdio MCP servers; hook commands; MCP server headersHelper command.

Value: a runtime value (set only under a condition).

No read site found by this scan.

Documented: https://code.claude.com/docs/en/mcp

### `CLAUDE_PROJECT_DIR`

Source: `chunk-2wenfcyh.js` · offset 207655123 · sha256 `68eac332…` · 6 read sites

Set for: hook commands; stdio MCP servers.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_PROJECT_UUID`

Source: `chunk-0hm7n25m.js` · offset 170474362 · sha256 `db06060c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HEARTBEAT_MS`

Source: `chunk-0hm7n25m.js` · offset 170474389 · sha256 `9101d095…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_HOST_EXEC`

Source: `chunk-0hm7n25m.js` · offset 170474420 · sha256 `0ebeab22…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_PTY_ORPHAN_CHECK_MS`

Source: `chunk-0hm7n25m.js` · offset 170474448 · sha256 `42e2a960…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX`

Source: `chunk-0hm7n25m.js` · offset 170474482 · sha256 `e7e28bbb…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

From docs: Prefix for auto-generated Remote Control session names when no explicit name is provided.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `CLAUDE_REMOTE_WORKFLOW_ARGS`

Source: `chunk-0hm7n25m.js` · offset 170474531 · sha256 `07110611…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_REMOTE_WORKFLOW_SCRIPT`

Source: `chunk-0hm7n25m.js` · offset 170474566 · sha256 `c9bc4717…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ACCOUNT_EMAIL`

Source: `chunk-dvjdeh5h.js` · offset 181797270 · sha256 `7d21deed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Email of the account that enqueued the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACCOUNT_ID`

Source: `chunk-dvjdeh5h.js` · offset 181797321 · sha256 `8c6c4c78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Tagged ID of the account that enqueued the session, for per-account routing, quota, or chargeback.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ACTIVITY_FD`

Source: `chunk-0hm7n25m.js` · offset 170474603 · sha256 `b6c6f533…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `3`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_RUNNER_ATTEMPT`

Source: `chunk-dvjdeh5h.js` · offset 181797184 · sha256 `918c8041…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How many spawn requests this session has had.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CLAUDE_BIN`

Source: `chunk-z62nk1ek.js` · offset 181606592 · sha256 `76b4b7da…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Absolute path to the runner's own Claude Code binary.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CLIENT_PLATFORM`

Source: `chunk-dvjdeh5h.js` · offset 181797682 · sha256 `25dd9f8d…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The client surface that created the session, such as `web_claude_ai`, `desktop_app`, `ios`, `claude_code_cli`, or `scheduled_trigger`.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_CORRELATION_ID`

Source: `chunk-dvjdeh5h.js` · offset 181797629 · sha256 `428b1c25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The correlation ID supplied at session create, echoed back so the hook can map this work order to the request that created the session.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_FETCH_DEPTH`

Source: `chunk-0hm7n25m.js` · offset 170474636 · sha256 `badc4092…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Git fetch depth for fresh clones.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `CLAUDE_RUNNER_ORDER_ID`

Source: `chunk-dvjdeh5h.js` · offset 181797020 · sha256 `f9fe867a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Opaque idempotency key, unique per spawn request and safe for Kubernetes resource names.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_ORDER_SERVER_TIME`

Source: `chunk-dvjdeh5h.js` · offset 181797366 · sha256 `d03989a3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Server time from the poll response's HTTP `Date` header.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_POOL_ID`

Source: `chunk-dvjdeh5h.js` · offset 181797231 · sha256 `da2ebaa1…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The ID of the environment the new runner should join, in `ccpool_...` form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_REVISION`

Source: `chunk-dvjdeh5h.js` · offset 181797476 · sha256 `292d83d6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Revision of the session's first git source: branch, SHA, or tag.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_PRIMARY_REPO_URL`

Source: `chunk-dvjdeh5h.js` · offset 181797419 · sha256 `3be603cd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: URL of the session's first git source, for routing to a runner with that repository pre-warmed.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_REPO_SOURCES`

Source: `chunk-dvjdeh5h.js` · offset 181797543 · sha256 `0ea2af91…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: JSON array of `{url, revision}` for all the session's git sources, for hooks that route on a secondary repository.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_ID`

Source: `chunk-dvjdeh5h.js` · offset 181797056 · sha256 `cd551327…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Session ID in the tagged `session_...` form, for logging and correlation

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_SESSION_UUID`

Source: `chunk-dvjdeh5h.js` · offset 181797137 · sha256 `2c8246b3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: The same session ID in canonical UUID form

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_RUNNER_WORK_ORDER_FILE`

Source: `chunk-dvjdeh5h.js` · offset 181796988 · sha256 `48f0b1f6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Path to a temp file containing the signed work-order JWT the new runner registers with.

No read site found by this scan.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SECURESTORAGE_CONFIG_DIR`

Source: `chunk-0hm7n25m.js` · offset 170474669 · sha256 `a2b55015…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_SERVE_DRAIN_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170474708 · sha256 `6f7f9e3e…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SESSION_INGRESS_TOKEN_FILE`

Source: `chunk-z62nk1ek.js` · offset 181605602 · sha256 `86bf2877…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Absolute path to a per-session file holding the current session JWT, kept fresh across token refreshes.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-configuration

### `CLAUDE_SNIP`

Source: `chunk-0hm7n25m.js` · offset 170474745 · sha256 `f059cc0b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_LOCAL_BINARY`

Source: `chunk-0hm7n25m.js` · offset 170474764 · sha256 `c62ba63c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_SSH_VERSION`

Source: `chunk-0hm7n25m.js` · offset 170474795 · sha256 `bb64b91c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `CLAUDE_STAGE_FILE_ROOT`

Source: `chunk-0hm7n25m.js` · offset 170474821 · sha256 `6ed8d6f3…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDE_TEST_PROJECT_DIR`

Source: `chunk-7y5qtdp5.js` · offset 201466455 · sha256 `38ee8375…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `${CLAUDE_PROJECT_DIR}`.

No read site found by this scan.

**Undocumented**

### `CLAUDE_TMPDIR`

Source: `chunk-0hm7n25m.js` · offset 170474851 · sha256 `f2232744…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `CLAUDECODE`

Source: `chunk-0hm7n25m.js` · offset 170464747 · sha256 `bcfe80fe…` · 6 read sites

Set for: stdio MCP servers; the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value; `1`.

From docs: Set to `1` in subprocesses Claude Code spawns (Bash and PowerShell tools, tmux sessions, hook commands, status line commands, stdio MCP server subprocesses).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `COLUMNS`

Source: `chunk-dt8bvbsd.js` · offset 179479657 · sha256 `ae2dfd59…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `DEBUG`

Source: `chunk-mb6zxr34.js` · offset 171709577 · sha256 `0c351e1e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value; removed (set to undefined or deleted).

From docs: Set to `1` to enable debug mode, equivalent to launching with `--debug`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_AUTOUPDATER`

Source: `chunk-z62nk1ek.js` · offset 181606534 · sha256 `f6740586…` · 3 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

From docs: Set to `1` to disable automatic background updates.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_ERROR_REPORTING`

Source: `chunk-z62nk1ek.js` · offset 181606153 · sha256 `50a5a304…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to opt out of error reporting. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn error reporting back on

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_GROWTHBOOK`

Source: `chunk-z62nk1ek.js` · offset 181606213 · sha256 `1dfbff9d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` or `true` to disable GrowthBook feature-flag fetching and use code defaults for every flag.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISABLE_TELEMETRY`

Source: `chunk-z62nk1ek.js` · offset 181605973 · sha256 `a0a7a459…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to any non-empty value, such as `1`, to opt out of telemetry. **Setting it to `0` or `false` still opts out**, unlike most on/off variables; unset the variable to turn telemetry back on.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `DISPLAY`

Source: `chunk-c2fy6cgt.js` · offset 176856800 · sha256 `7e8467cf…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `DO_NOT_TRACK`

Source: `chunk-z62nk1ek.js` · offset 181606021 · sha256 `40a0ef9b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Set to `1` to opt out of telemetry, with the same effect as `DISABLE_TELEMETRY`, including making Remote Control and the other features that need feature-flag fetching unavailable.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `GCM_INTERACTIVE`

Source: `chunk-frqjd28b.js` · offset 181498970 · sha256 `619bc399…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_ENTERPRISE_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042912 · sha256 `0eb60ad6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GH_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042884 · sha256 `db7e4b41…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_ALLOW_PROTOCOL`

Source: `chunk-4b9m8jd6.js` · offset 188929669 · sha256 `978ef170…` · 7 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `https:http:ssh`; a runtime value; `none` (set only under a condition).

No read site found by this scan.

**Undocumented**

### `GIT_ALTERNATE_OBJECT_DIRECTORIES`

Source: `chunk-0hcnfgyj.js` · offset 189606543 · sha256 `6c890011…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_ASKPASS`

Source: `chunk-7kwd28ae.js` · offset 175764301 · sha256 `beaf6789…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_ATTR_NOSYSTEM`

Source: `chunk-vmzdegvb.js` · offset 203543490 · sha256 `497d453b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_DATE`

Source: `chunk-dt8bvbsd.js` · offset 180891839 · sha256 `0913b870…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`; a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_EMAIL`

Source: `chunk-dt8bvbsd.js` · offset 180891795 · sha256 `a0a27899…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff@localhost`; a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_AUTHOR_NAME`

Source: `chunk-dt8bvbsd.js` · offset 180891762 · sha256 `6536e127…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `bash-edit-diff`; a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_CEILING_DIRECTORIES`

Source: `chunk-7kwd28ae.js` · offset 175696896 · sha256 `a36d7259…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_DATE`

Source: `chunk-dt8bvbsd.js` · offset 180891957 · sha256 `3b626dd6…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1000000000 +0000`.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_EMAIL`

Source: `chunk-0hcnfgyj.js` · offset 189583731 · sha256 `8bf19b8a…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `noreply@anthropic.com`; `bash-edit-diff@localhost`; a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_COMMITTER_NAME`

Source: `chunk-0hcnfgyj.js` · offset 189583688 · sha256 `de44a67b…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `Claude Code file sync`; `bash-edit-diff`; a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_CONFIG_GLOBAL`

Source: `chunk-frqjd28b.js` · offset 181498908 · sha256 `ef00c0bc…` · 8 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/dev/null`; a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_NOSYSTEM`

Source: `chunk-2yxmcerc.js` · offset 198937200 · sha256 `c41b4f9a…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_PARAMETERS`

Source: `chunk-dt8bvbsd.js` · offset 178128308 · sha256 `5bc3d02d…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_CONFIG_SYSTEM`

Source: `chunk-fs6b4kwq.js` · offset 189956380 · sha256 `2e82ac45…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `/dev/null`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_DEFAULT_REF_FORMAT`

Source: `chunk-fs6b4kwq.js` · offset 189911300 · sha256 `f78cf763…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `files` (set only under a condition). Condition values in code: `HEAD`.

No read site found by this scan.

**Undocumented**

### `GIT_DIR`

Source: `chunk-7kwd28ae.js` · offset 176264458 · sha256 `3d3cc7e4…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_EDITOR`

Source: `chunk-dt8bvbsd.js` · offset 178137377 · sha256 `d8fae42f…` · 3 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: `true`.

No read site found by this scan.

**Undocumented**

### `GIT_GLOB_PATHSPECS`

Source: `chunk-fs6b4kwq.js` · offset 189933151 · sha256 `c5fa880e…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_GRAFT_FILE`

Source: `chunk-6qnepb0y.js` · offset 189553255 · sha256 `49d4c845…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `\\.\NUL\no-grafts` or `/dev/null/no-grafts`.

No read site found by this scan.

**Undocumented**

### `GIT_ICASE_PATHSPECS`

Source: `chunk-fs6b4kwq.js` · offset 189933127 · sha256 `0e9087c2…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_INDEX_FILE`

Source: `chunk-7kwd28ae.js` · offset 175714037 · sha256 `82bb4a13…` · 12 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_LITERAL_PATHSPECS`

Source: `chunk-fs6b4kwq.js` · offset 189933101 · sha256 `0fd7bb58…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`; `1`.

No read site found by this scan.

**Undocumented**

### `GIT_NO_LAZY_FETCH`

Source: `chunk-7kwd28ae.js` · offset 175764193 · sha256 `4317fa99…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `1`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_NO_REPLACE_OBJECTS`

Source: `chunk-6qnepb0y.js` · offset 189553304 · sha256 `3df908f0…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_NOGLOB_PATHSPECS`

Source: `chunk-fs6b4kwq.js` · offset 189933174 · sha256 `0f84b61e…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_OPTIONAL_LOCKS`

Source: `chunk-dt8bvbsd.js` · offset 180888608 · sha256 `671e967a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`.

No read site found by this scan.

**Undocumented**

### `GIT_PROGRESS_DELAY`

Source: `chunk-frqjd28b.js` · offset 181499016 · sha256 `f07c9246…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

No read site found by this scan.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-pqvq7799.js` · offset 171136968 · sha256 `87b5514a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_SHALLOW_FILE`

Source: `chunk-fs6b4kwq.js` · offset 190103054 · sha256 `06059806…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GIT_SSH_COMMAND`

Source: `chunk-4b9m8jd6.js` · offset 188929577 · sha256 `77cda1e9…` · 7 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value; `ssh -o BatchMode=yes`; `false` (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_TERMINAL_PROMPT`

Source: `chunk-daa108e6.js` · offset 185683590 · sha256 `ebaa1d2e…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `0`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GIT_WORK_TREE`

Source: `chunk-7kwd28ae.js` · offset 176264473 · sha256 `584aed25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `GITHUB_ENTERPRISE_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042935 · sha256 `4dd424ee…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITHUB_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176042896 · sha256 `588127ed…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

### `GITLAB_ACCESS_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176053340 · sha256 `ed5747c3…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `GITLAB_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176053320 · sha256 `fa287e78…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `HOME`

Source: `chunk-2yxmcerc.js` · offset 198937114 · sha256 `6926099c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `HOMEBREW_NO_AUTO_UPDATE`

Source: `chunk-f7tnsfnn.js` · offset 186704126 · sha256 `7a329310…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `INVOCATION_ID`

Source: `chunk-f0epszrp.js` · offset 182543624 · sha256 `37ffec13…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LANGUAGE`

Source: `chunk-g13219m3.js` · offset 201399903 · sha256 `c56805bc…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `LC_ALL`

Source: `chunk-2yxmcerc.js` · offset 198735323 · sha256 `d93853ac…` · 6 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `C`.

Also read by Claude Code; see its read entry.

**Undocumented**

### `LINES`

Source: `chunk-dt8bvbsd.js` · offset 179479685 · sha256 `a5e3900a…`

Set for: hook commands.

Value: a runtime value (set only under a condition).

No read site found by this scan.

**Undocumented**

### `LOCAL_BRIDGE`

Source: `chunk-0hm7n25m.js` · offset 170474872 · sha256 `d783d39f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_CONNECT_TIMEOUT_MS`

Source: `chunk-0hm7n25m.js` · offset 170474926 · sha256 `9a269a47…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: How long blocking MCP startup waits, in milliseconds, for the connection batch before snapshotting the tool list (default: 5000).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_CONNECTION_NONBLOCKING`

Source: `chunk-0hm7n25m.js` · offset 170474892 · sha256 `cf21a4ab…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Controls whether startup waits for MCP servers to connect before the first query.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE`

Source: `chunk-0hm7n25m.js` · offset 170474956 · sha256 `389abd81…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Turns the MCP discovery cache on or off.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_MAX_STALE_S`

Source: `chunk-0hm7n25m.js` · offset 170474983 · sha256 `5b329478…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum age, in seconds, of a discovery-cache entry (default: 14400, or 4 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_STRIKES`

Source: `chunk-0hm7n25m.js` · offset 170475022 · sha256 `f340aa9c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: At a start where a discovery-cache entry is older than `MCP_DISCOVERY_CACHE_TTL_S`, Claude Code refreshes it in the background.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_DISCOVERY_CACHE_TTL_S`

Source: `chunk-0hm7n25m.js` · offset 170475057 · sha256 `b099699f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Seconds for which Claude Code uses a discovery-cache entry without refreshing it (default: 900).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CALLBACK_PORT`

Source: `chunk-0hm7n25m.js` · offset 170475090 · sha256 `29a4a876…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Fixed port for the OAuth redirect callback, as an alternative to `--callback-port` when adding an MCP server with pre-configured credentials

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_OAUTH_CLIENT_METADATA_URL`

Source: `chunk-0hm7n25m.js` · offset 170475121 · sha256 `a7fcad9c…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `MCP_PROTOCOL_NEGOTIATION`

Source: `chunk-0hm7n25m.js` · offset 170475158 · sha256 `edaa00c5…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: On the v2 MCP client runtime only, whether Claude Code probes servers for MCP protocol revision 2026-07-28.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_REMOTE_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-0hm7n25m.js` · offset 170475190 · sha256 `c35310ee…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of remote MCP servers (HTTP/SSE) to connect in parallel during startup (default: 20)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SDK_GENERATION`

Source: `chunk-0hm7n25m.js` · offset 170475237 · sha256 `606989b7…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Pin which MCP client runtime this process connects to MCP servers with: `v1`, built on MCP TypeScript SDK 1.x, or `v2`, built on MCP TypeScript SDK 2.0.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_SERVER_CONNECTION_BATCH_SIZE`

Source: `chunk-0hm7n25m.js` · offset 170475263 · sha256 `65169a26…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Maximum number of local MCP servers (stdio) to connect in parallel during startup (default: 3)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TIMEOUT`

Source: `chunk-0hm7n25m.js` · offset 170475303 · sha256 `a6ec968d…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP server startup (default: 30000, or 30 seconds)

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TOOL_TIMEOUT`

Source: `chunk-0hm7n25m.js` · offset 170475322 · sha256 `8a8db418…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Timeout in milliseconds for MCP tool execution (default: 100000000, about 28 hours).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `MCP_TRUNCATION_PROMPT_OVERRIDE`

Source: `chunk-0hm7n25m.js` · offset 170475346 · sha256 `914e9f6f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NODE_ENV`

Source: `chunk-2yxmcerc.js` · offset 198735355 · sha256 `6541f2a8…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `production`.

No read site found by this scan.

**Undocumented**

### `NODE_EXTRA_CA_CERTS`

Source: `chunk-tqvbvzmw.js` · offset 185918254 · sha256 `01c090e5…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `NoDefaultCurrentDirectoryInExePath`

Source: `chunk-mxjantyz.js` · offset 192472559 · sha256 `91bf70a2…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `1`.

No read site found by this scan.

**Undocumented**

### `OAUTH_TOKEN`

Source: `chunk-7kwd28ae.js` · offset 176053367 · sha256 `4c09c85b…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

No read site found by this scan.

**Undocumented**

### `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE`

Source: `chunk-pt1gnpay.js` · offset 201657653 · sha256 `c023412c…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: `delta`.

From docs: Metrics temporality preference (default: `delta`).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/monitoring-usage

### `PATH`

Source: `chunk-2yxmcerc.js` · offset 198735302 · sha256 `5ed8d9f7…` · 4 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `/usr/bin:/bin`; a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `PS1`

Source: `chunk-a3dhvgfh.js` · offset 187588643 · sha256 `c1e1ae25…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `PS2`

Source: `chunk-a3dhvgfh.js` · offset 187588650 · sha256 `462b4728…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

No read site found by this scan.

**Undocumented**

### `SDK_NATIVE_BIN`

Source: `chunk-0hm7n25m.js` · offset 170475384 · sha256 `9ba5e747…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DEFER_SHUTDOWN_MAX_MS`

Source: `chunk-z62nk1ek.js` · offset 181681790 · sha256 `1ca4a5eb…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181680829 · sha256 `b4d8a2cd…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_MARKER_FILE`

Source: `chunk-z62nk1ek.js` · offset 181680575 · sha256 `61ac2e83…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_DRAIN_WAIT_MS`

Source: `chunk-z62nk1ek.js` · offset 181680285 · sha256 `759a3529…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_ENVIRONMENT_SECRET`

Source: `chunk-dvjdeh5h.js` · offset 181796943 · sha256 `a4acc82d…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOOKS_DIR`

Source: `chunk-z62nk1ek.js` · offset 181675838 · sha256 `f46f629e…` · 2 read sites

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_HOST_CONFIG_DIR`

Source: `chunk-z62nk1ek.js` · offset 181607801 · sha256 `334958a4…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

From docs: Directory captured into the runner's startup snapshot and seeded into each session's `CLAUDE_CONFIG_DIR`; changes on disk apply after a runner restart.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/self-hosted-environments-reference

### `SELF_HOSTED_RUNNER_IDLE_SHUTDOWN_MS`

Source: `chunk-z62nk1ek.js` · offset 181678952 · sha256 `cd2ffa47…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_MAX_LIFETIME_MS`

Source: `chunk-z62nk1ek.js` · offset 181678624 · sha256 `ed5602f5…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POOL_SECRET`

Source: `chunk-dvjdeh5h.js` · offset 181796905 · sha256 `68243b99…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_POST_SESSION_HOOK_TIMEOUT_MS`

Source: `chunk-z62nk1ek.js` · offset 181679790 · sha256 `1e715ddf…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_COMMAND`

Source: `chunk-kbjsjr7g.js` · offset 181413437 · sha256 `2bd21780…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_PROXY_AUTHORIZATION_FILE`

Source: `chunk-kbjsjr7g.js` · offset 181413491 · sha256 `ef192279…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: removed (set to undefined or deleted).

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_RETIRE_AT`

Source: `chunk-z62nk1ek.js` · offset 181682216 · sha256 `8d806765…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_IDLE_MS`

Source: `chunk-z62nk1ek.js` · offset 181681108 · sha256 `539370ee…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_SESSION_STOP_GRACE_MS`

Source: `chunk-z62nk1ek.js` · offset 181679264 · sha256 `61fe77f2…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SELF_HOSTED_RUNNER_STARTUP_TIMEOUT_MS`

Source: `chunk-z62nk1ek.js` · offset 181681438 · sha256 `96c946da…`

Set for: Claude Code's own process environment (inherited by children that receive it).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SESSION_INGRESS_URL`

Source: `chunk-0hm7n25m.js` · offset 170475406 · sha256 `4b662382…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SHELL`

Source: `chunk-dt8bvbsd.js` · offset 178137369 · sha256 `51127eb3…` · 4 read sites

Set for: the shell that builds the Bash tool's shell snapshot, and the shell environment probe; Claude Code's own process environment (inherited by children that receive it); Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `SLASH_COMMAND_TOOL_CHAR_BUDGET`

Source: `chunk-0hm7n25m.js` · offset 170475433 · sha256 `ac1bad63…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

From docs: Override the character budget for skill metadata shown to the Skill tool.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `SSH_ASKPASS`

Source: `chunk-7kwd28ae.js` · offset 175764352 · sha256 `2074521f…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `SYSTEM_REMINDER_MEMORY_CONTEXT`

Source: `chunk-0hm7n25m.js` · offset 170475471 · sha256 `986ae681…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TEMP`

Source: `chunk-2yxmcerc.js` · offset 198937174 · sha256 `abe2607f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TERM`

Source: `chunk-2yxmcerc.js` · offset 198937188 · sha256 `841346ef…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `dumb`; `xterm-256color`.

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `TEST_ENABLE_SESSION_PERSISTENCE`

Source: `chunk-0hm7n25m.js` · offset 170475509 · sha256 `b42eeadd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMP`

Source: `chunk-2yxmcerc.js` · offset 198937161 · sha256 `7e51b28f…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `TMPDIR`

Source: `chunk-2yxmcerc.js` · offset 198937145 · sha256 `904359e8…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TMPPREFIX`

Source: `chunk-dt8bvbsd.js` · offset 178128269 · sha256 `47a8d8f7…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

No read site found by this scan.

**Undocumented**

### `TMUX`

Source: `chunk-dt8bvbsd.js` · offset 178128232 · sha256 `db982b13…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: not traced.

Also read by Claude Code; see its read entry.

**Undocumented**

### `TRACEPARENT`

Source: `chunk-7kwd28ae.js` · offset 175488148 · sha256 `aab96fde…`

Set for: Bash tool commands (the name is in the Bash tool's spawn-environment key list).

Value: a runtime value (set only under a condition).

Also read by Claude Code; see its read entry.

Documented: https://code.claude.com/docs/en/env-vars

### `ULTRAPLAN_PROMPT_FILE`

Source: `chunk-0hm7n25m.js` · offset 170475548 · sha256 `68447c95…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `USE_STAGING_OAUTH`

Source: `chunk-z62nk1ek.js` · offset 181607084 · sha256 `f96c31a1…` · 2 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `1`; removed (set to undefined or deleted) (set only under a condition).

Also read by Claude Code; see its read entry.

**Undocumented**

### `USER_TYPE`

Source: `chunk-2yxmcerc.js` · offset 198735334 · sha256 `63ec52da…` · 3 read sites

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: `external`.

No read site found by this scan.

**Undocumented**

### `USERPROFILE`

Source: `chunk-2yxmcerc.js` · offset 198937126 · sha256 `3a88058a…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VCR_RECORD`

Source: `chunk-0hm7n25m.js` · offset 170475577 · sha256 `d304dadd…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

No read site found by this scan.

**Undocumented**

### `VITALS_EMITTER_BIN`

Source: `chunk-0hm7n25m.js` · offset 170475595 · sha256 `cb983d30…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `VOICE_STREAM_BASE_URL`

Source: `chunk-0hm7n25m.js` · offset 170475621 · sha256 `b34a4a55…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: a runtime value.

Also read by Claude Code; see its read entry.

**Undocumented**

### `WAYLAND_DISPLAY`

Source: `chunk-c2fy6cgt.js` · offset 176856811 · sha256 `bbd32953…`

Set for: an environment object Claude Code builds; the receiving process is not traced.

Value: ``.

Also read by Claude Code; see its read entry.

**Undocumented**

## Read only by bundled third-party libraries

These names are read only by code with no Claude Code evidence: no typed-schema entry, no first-party boolean helper, no Claude Code name prefix, and no docs entry. That is most likely bundled third-party library code. They are listed for completeness.

### `_X_AMZN_TRACE_ID`

Source: `chunk-bsye0ba7.js` · offset 187732587 · sha256 `17f869aa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-bsye0ba7.js` offset 187732587.

**Undocumented**

### `AWS_ACCOUNT_ID`

Source: `chunk-fd7m1t17.js` · offset 188087045 · sha256 `757201c8…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-fd7m1t17.js` offset 188087045.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN`

Source: `chunk-kd3wht3j.js` · offset 202016787 · sha256 `4144f535…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-kd3wht3j.js` offset 202016787.

**Undocumented**

### `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`

Source: `chunk-kd3wht3j.js` · offset 202016842 · sha256 `858c3edf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kd3wht3j.js` offset 202016842.

**Undocumented**

### `AWS_CREDENTIAL_EXPIRATION`

Source: `chunk-fd7m1t17.js` · offset 188087011 · sha256 `ec172743…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-fd7m1t17.js` offset 188087011.

**Undocumented**

### `AWS_CREDENTIAL_SCOPE`

Source: `chunk-fd7m1t17.js` · offset 188087028 · sha256 `471e850e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-fd7m1t17.js` offset 188087028.

**Undocumented**

### `AWS_EC2_METADATA_DISABLED`

Source: `chunk-bsye0ba7.js` · offset 187867169 · sha256 `1c8da441…` · 3 read sites

Read as: enum (compared against fixed values). Values: `false`.

**Truthiness gotcha:** 2 read sites test the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-bsye0ba7.js` offset 187867169.

**Undocumented**

### `AWS_LAMBDA_BENCHMARK_MODE`

Source: `chunk-bsye0ba7.js` · offset 187731912 · sha256 `11d880c2…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-bsye0ba7.js` offset 187731912.

**Undocumented**

### `AWS_LAMBDA_MAX_CONCURRENCY`

Source: `chunk-bsye0ba7.js` · offset 187731625 · sha256 `441ec1d5…`

Read as: presence (only whether it is set (or truthy) matters).

Undocumented; read at `chunk-bsye0ba7.js` offset 187731625.

**Undocumented**

### `AWS_LAMBDA_NODEJS_NO_GLOBAL_AWSLAMBDA`

Source: `chunk-bsye0ba7.js` · offset 187730290 · sha256 `55d05854…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-bsye0ba7.js` offset 187730290.

**Undocumented**

### `AWS_LOGIN_CACHE_DIRECTORY`

Source: `chunk-f6q2wjpr.js` · offset 188098943 · sha256 `304b902c…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-f6q2wjpr.js` offset 188098943.

**Undocumented**

### `AWS_ROLE_SESSION_NAME`

Source: `chunk-e8vyaybz.js` · offset 202012122 · sha256 `df2e4a0a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-e8vyaybz.js` offset 202012122.

**Undocumented**

### `AZURE_ADDITIONALLY_ALLOWED_TENANTS`

Source: `chunk-kdgec1t8.js` · offset 191603751 · sha256 `ed848eaa…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191603751.

**Undocumented**

### `AZURE_AUTHORITY_HOST`

Source: `chunk-kdgec1t8.js` · offset 191360494 · sha256 `104f8a52…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191360494.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PASSWORD`

Source: `chunk-kdgec1t8.js` · offset 191604724 · sha256 `72a5ed2a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191604724.

**Undocumented**

### `AZURE_CLIENT_CERTIFICATE_PATH`

Source: `chunk-kdgec1t8.js` · offset 191604680 · sha256 `62b280d9…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191604680.

**Undocumented**

### `AZURE_CLIENT_SECRET`

Source: `chunk-kdgec1t8.js` · offset 191604360 · sha256 `e3d785a5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191604360.

**Undocumented**

### `AZURE_CLIENT_SEND_CERTIFICATE_CHAIN`

Source: `chunk-kdgec1t8.js` · offset 191603905 · sha256 `cedfa2bc…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191603905.

**Undocumented**

### `AZURE_FEDERATED_TOKEN_FILE`

Source: `chunk-kdgec1t8.js` · offset 191580355 · sha256 `5affa54c…` · 5 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191580355.

**Undocumented**

### `AZURE_IDENTITY_DISABLE_MULTITENANTAUTH`

Source: `chunk-kdgec1t8.js` · offset 191306226 · sha256 `4815de9a…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-kdgec1t8.js` offset 191306226.

**Undocumented**

### `AZURE_PASSWORD`

Source: `chunk-kdgec1t8.js` · offset 191605008 · sha256 `7c19281e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191605008.

**Undocumented**

### `AZURE_POD_IDENTITY_AUTHORITY_HOST`

Source: `chunk-kdgec1t8.js` · offset 191566157 · sha256 `a8c1f5b5…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-kdgec1t8.js` offset 191566157.

**Undocumented**

### `AZURE_REGIONAL_AUTHORITY_NAME`

Source: `chunk-kdgec1t8.js` · offset 191569142 · sha256 `5f710949…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191569142.

**Undocumented**

### `AZURE_TOKEN_CREDENTIALS`

Source: `chunk-kdgec1t8.js` · offset 191608029 · sha256 `91cb3c34…` · 3 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-kdgec1t8.js` offset 191608029.

**Undocumented**

### `AZURE_USERNAME`

Source: `chunk-kdgec1t8.js` · offset 191604979 · sha256 `9de4ee24…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191604979.

**Undocumented**

### `BUF_BIGINT_DISABLE`

Source: `chunk-zg9v04h4.js` · offset 174534465 · sha256 `31674c1d…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-zg9v04h4.js` offset 174534465.

**Undocumented**

### `CHOKIDAR_INTERVAL`

Source: `chunk-676f18rk.js` · offset 174197916 · sha256 `4c2baee7…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-676f18rk.js` offset 174197916.

**Undocumented**

### `CHOKIDAR_USEPOLLING`

Source: `chunk-676f18rk.js` · offset 174197735 · sha256 `809a7001…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-676f18rk.js` offset 174197735.

**Undocumented**

### `CLOUD_RUN_JOB`

Source: `chunk-905d7765.js` · offset 187969622 · sha256 `c94bcd46…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-905d7765.js` offset 187969622.

**Undocumented**

### `DEBUG_AUTH`

Source: `chunk-905d7765.js` · offset 187980539 · sha256 `a9d539c6…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-905d7765.js` offset 187980539.

**Undocumented**

### `DETECT_GCP_RETRIES`

Source: `chunk-905d7765.js` · offset 187979858 · sha256 `bef4b628…` · 2 read sites

Read as: number (parsed as a number).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-905d7765.js` offset 187979858.

**Undocumented**

### `FUNCTION_NAME`

Source: `chunk-905d7765.js` · offset 187969649 · sha256 `16cc5003…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 187969649.

**Undocumented**

### `FUNCTION_TARGET`

Source: `chunk-905d7765.js` · offset 188011295 · sha256 `be8aa066…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 188011295.

**Undocumented**

### `GAE_MODULE_NAME`

Source: `chunk-905d7765.js` · offset 188011216 · sha256 `3aec2dd6…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 188011216.

**Undocumented**

### `GAE_SERVICE`

Source: `chunk-905d7765.js` · offset 188011191 · sha256 `3c32fa81…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 188011191.

**Undocumented**

### `GCE_METADATA_HOST`

Source: `chunk-905d7765.js` · offset 187978156 · sha256 `489ed04c…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 187978156.

**Undocumented**

### `GCE_METADATA_IP`

Source: `chunk-905d7765.js` · offset 187978127 · sha256 `63485255…` · 2 read sites

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 187978127.

**Undocumented**

### `GIT_PROXY_COMMAND`

Source: `chunk-pqvq7799.js` · offset 171136986 · sha256 `d8c02a58…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-pqvq7799.js` offset 171136986.

**Undocumented**

### `GOOGLE_CLOUD_QUOTA_PROJECT`

Source: `chunk-905d7765.js` · offset 188069128 · sha256 `006ef59e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-905d7765.js` offset 188069128.

**Undocumented**

### `GOOGLE_EXTERNAL_ACCOUNT_ALLOW_EXECUTABLES`

Source: `chunk-905d7765.js` · offset 188059750 · sha256 `d60e4754…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-905d7765.js` offset 188059750.

**Undocumented**

### `GRACEFUL_FS_PLATFORM`

Source: `chunk-abxsv9zx.js` · offset 172402221 · sha256 `1c96518e…`

Read as: string (raw value; further parsing not traced). Default (from code): `darwin`.

Undocumented; read at `chunk-abxsv9zx.js` offset 172402221.

**Undocumented**

### `GRPC_EXPERIMENTAL_ENABLE_OUTLIER_DETECTION`

Source: `chunk-s45djs34.js` · offset 207431848 · sha256 `2a9c164a…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207431848.

**Undocumented**

### `GRPC_NODE_TRACE`

Source: `chunk-s45djs34.js` · offset 207077045 · sha256 `bd88e67e…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207077045.

**Undocumented**

### `GRPC_NODE_USE_ALTERNATIVE_RESOLVER`

Source: `chunk-s45djs34.js` · offset 207276727 · sha256 `213d12c1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207276727.

**Undocumented**

### `GRPC_NODE_VERBOSITY`

Source: `chunk-s45djs34.js` · offset 207076384 · sha256 `90d938ec…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207076384.

**Undocumented**

### `grpc_proxy`

Source: `chunk-s45djs34.js` · offset 207283315 · sha256 `984ce2dd…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-s45djs34.js` offset 207283315.

**Undocumented**

### `GRPC_SSL_CIPHER_SUITES`

Source: `chunk-s45djs34.js` · offset 207081978 · sha256 `6737f6e2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207081978.

**Undocumented**

### `GRPC_TRACE`

Source: `chunk-s45djs34.js` · offset 207077097 · sha256 `c891fd36…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207077097.

**Undocumented**

### `GRPC_VERBOSITY`

Source: `chunk-s45djs34.js` · offset 207076440 · sha256 `03141409…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207076440.

**Undocumented**

### `K_CONFIGURATION`

Source: `chunk-905d7765.js` · offset 188011346 · sha256 `8915965f…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-905d7765.js` offset 188011346.

**Undocumented**

### `LRU_CACHE_IGNORE_AC_WARNING`

Source: `chunk-afy0h4qw.js` · offset 170494126 · sha256 `08e28927…`

Read as: enum (compared against fixed values). Values: `1`.

Undocumented; read at `chunk-afy0h4qw.js` offset 170494126.

**Undocumented**

### `METADATA_SERVER_DETECTION`

Source: `chunk-905d7765.js` · offset 187979960 · sha256 `567b2c13…` · 2 read sites

Read as: string (raw value; further parsing not traced).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-905d7765.js` offset 187979960.

**Undocumented**

### `MSAL_FORCE_REGION`

Source: `chunk-kdgec1t8.js` · offset 191542835 · sha256 `a5881060…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191542835.

**Undocumented**

### `no_grpc_proxy`

Source: `chunk-s45djs34.js` · offset 207284114 · sha256 `3e43f776…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207284114.

**Undocumented**

### `OSTYPE`

Source: `chunk-pqvq7799.js` · offset 171105574 · sha256 `e7feb6ad…` · 2 read sites

Read as: enum (compared against fixed values). Values: `cygwin`, `msys`.

Undocumented; read at `chunk-pqvq7799.js` offset 171105574.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CERTIFICATE`

Source: `chunk-s45djs34.js` · offset 207461972 · sha256 `3f3cfacf…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207461972.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE`

Source: `chunk-s45djs34.js` · offset 207461666 · sha256 `32e387c2…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207461666.

**Undocumented**

### `OTEL_EXPORTER_OTLP_CLIENT_KEY`

Source: `chunk-s45djs34.js` · offset 207461824 · sha256 `fc5f98a1…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207461824.

**Undocumented**

### `OTEL_EXPORTER_OTLP_INSECURE`

Source: `chunk-s45djs34.js` · offset 207461367 · sha256 `8ce73eb5…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-s45djs34.js` offset 207461367.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_HOST`

Source: `chunk-t8yxc4eq.js` · offset 207482431 · sha256 `61eafb33…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-t8yxc4eq.js` offset 207482431.

**Undocumented**

### `OTEL_EXPORTER_PROMETHEUS_PORT`

Source: `chunk-t8yxc4eq.js` · offset 207482523 · sha256 `ccf61175…`

Read as: number (parsed as a number).

Undocumented; read at `chunk-t8yxc4eq.js` offset 207482523.

**Undocumented**

### `REGION_NAME`

Source: `chunk-kdgec1t8.js` · offset 191542982 · sha256 `28204796…`

Read as: string (raw value; further parsing not traced).

Undocumented; read at `chunk-kdgec1t8.js` offset 191542982.

**Undocumented**

### `TEST_GRACEFUL_FS_GLOBAL_PATCH`

Source: `chunk-abxsv9zx.js` · offset 172409115 · sha256 `d12bfc7e…`

Read as: presence (only whether it is set (or truthy) matters).

**Truthiness gotcha:** 1 read site tests the raw string for truthiness, so any non-empty value enables that path, including `0` and `false`.

Undocumented; read at `chunk-abxsv9zx.js` offset 172409115.

**Undocumented**
