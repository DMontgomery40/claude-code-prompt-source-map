# Changelog

## 2026-09-25 · What wins

- New page, What wins: for 28 values Claude Code decides (prompt cache TTL, model, effort, thinking, permission mode and rules, auth source, env var sources, and more), every source it checks in order, as interactive cards. Set rungs to see which one takes effect; share the exact setup as a link.
- Ladders marked Tested were checked against the requests Claude Code 2.1.282 actually sent; the rest were read from code and independently reviewed.
- Every environment variable, setting and CLI flag links to the ladders it feeds. Settings, CLI and What wins pages gain tag filters.

## 2026-09-25 · Claude Code 2.1.282

- Requests: the Artifact, ArtifactData and SendMessage tool descriptions changed, and ArtifactData takes a new input schema. The default system prompt is unchanged.
- Tools: new stub tool `request_computer` ("Your computer"). WebSearch on Vertex is now on for claude-opus-4-0 and later instead of a fixed model-family list. The tool pool also merges the host's machine MCP tools, and the host's per-tool deferral answer is checked first.
- Skills: claude-api, artifact-design, doctor, update-config, plugin authoring and the claude-test skills changed. /batch no longer has its "not a git repository" message. The code-review effort recipes (xhigh, max) and several skills built in code now render in full.
- CLI: `--agents` also accepts, with `--print`, the path to a file holding the JSON.
- Settings: attribution, sandbox, parentSettingsBehavior, allowManagedPermissionRulesOnly and the safe-env check changed.
- Site: the environment-variable page has topic and status filters (prompt caching first), and counts in page text now come from the data.
- Environment variables:
  - Added: `CLAUDE_AGENT_SDK_DISABLE_MCP_MANIFESTS`, `CLAUDE_BG_WORKSPACE_TRUSTED`, `CLAUDE_CODE_ARTIFACT_TEXT_VARIANT`, `CLAUDE_CODE_CCR_EARLY_REMOTE_CONNECT`, `CLAUDE_CODE_COMMIT_BETWEEN_KEYS`, `CLAUDE_CODE_COORDINATOR_SKILL_GUIDANCE`, `CLAUDE_CODE_DISABLE_DANGEROUS_RM_TIMEOUT`, `CLAUDE_CODE_DISABLE_REFUSAL_RETRY`, `CLAUDE_CODE_DISABLE_STARTUP_WORK_GATE`, `CLAUDE_CODE_DISABLE_SUBSTITUTION_RM_PROMPT`, `CLAUDE_CODE_ELEGANT_MEADOW`, `CLAUDE_CODE_GZIP_REQUEST_BODY_LEVEL`, `CLAUDE_CODE_MCP_APPS_HOST`, `CLAUDE_CODE_PARKED_RUN_BEFORE_CLEAR`, `CLAUDE_CODE_PROJECTS_SESSION`, `CLAUDE_CODE_SQUISHY_NEWT`, `CLAUDE_CODE_WEB_SEARCH_FAST_ARG`, `CLAUDE_RELAUNCH_SESSION_ADD_DIRS`, `HOMESHARE`, `AWS_USE_FIPS_ENDPOINT`, `CLAUDE_CODE_HOST_GATEWAY_LINEAGE`, `CLAUDE_CODE_WEBSEARCH_CCR_PROXY_FAST`, `ALLUSERSPROFILE`, `CLAUDE_CODE_DISABLE_ATTRIBUTION_BASELINE_REUSE`, `GIT_OBJECT_DIRECTORY`
  - Removed: `CLAUDE_CODE_OCHRE_KITE`, `CCR_RUNNER_STARTUP_TIMING`, `CCR_SESSION_ACCOUNT_EMAIL`, `CLAUDE_CODE_REMOTE_SESSION_UUID`, `CLAUDE_CODE_USE_CCR_V2`, `CLAUDE_RUNNER_CLAUDE_BIN`, `INVOCATION_ID`

