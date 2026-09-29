// Redaction for Trace's network layer. Runs in the worker at parse time, before anything reaches the
// page: credentials, tokens and identity values are replaced, so a field shows that it was present but
// never its value. Three layers:
//   1. by header name (authorization, cookies, account and organization ids, API keys);
//   2. by field name in JSON bodies (email, account/organization uuids, device and installation ids,
//      user and account ids, safety identifiers, GrowthBook's hashValue, access/refresh/id tokens…);
//   3. by value: every value layer 1 or 2 removed is also removed wherever else it appears (URL paths,
//      JSON carried in strings, telemetry), plus token-shaped strings (Bearer, JWTs, sk-…) and emails.
// Session, thread, turn, request, message and response ids are not identity here: they are the join keys
// between the capture and the session log the user loaded, and stay.

export const REDACTED = "‹redacted›";
export const BY_CAPTURE = "‹redacted by the capture tool›";

const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, "");

// Header names whose values never leave the worker.
const SECRET_HEADERS = new Set([
  "authorization", "proxy-authorization", "cookie", "set-cookie", "x-api-key", "dd-api-key", "statsig-api-key",
  "chatgpt-account-id", "openai-organization", "openai-project", "anthropic-organization-id", "anthropic-workspace-id",
  "x-organization-uuid", "x-codex-installation-id", "oai-device-id", "x-openai-account-id",
]);
const SECRET_HEADER_RE = /(api-?key|token|secret|cookie|password|account-id|device-id|installation-id|organization-id|workspace-id|org-id|user-id)/i;
// Headers that carry JSON with identity fields inside: parsed, redacted field by field, kept readable.
const JSON_HEADERS = new Set(["x-codex-turn-metadata"]);

// Field names (normalised: lower case, letters and digits only) whose values are identity.
const IDENTITY_FIELDS = new Set([
  "email", "accountemail", "emailaddress", "useremail", "fullname", "organizationname", "orgname", "ssoconnectionname",
  "accountuuid", "organizationuuid", "orguuid", "organizationid", "orgid", "workspaceid", "anthropicorganizationid", "anthropicworkspaceid",
  "accountid", "accountuserid", "userid", "creatoraccountuserid", "defaultaccountid", "accountordering", "chatgptaccountid",
  "deviceid", "installationid", "xcodexinstallationid", "safetyidentifier", "hashvalue", "ipaddress", "phone", "phonenumber",
  "profilepictureurl", "username", "login", "machineid", "anonymousid",
]);
// Secret field names: tokens and keys.
const SECRET_FIELD_RE = /(accesstoken|refreshtoken|idtoken|apikey|clientsecret|secret|password|sessiontoken|bearertoken|authtoken)$/;
// A bare `id` is identity only in these containers: GrowthBook's attributes (the device id) and ChatGPT's
// account list.
const ID_CONTAINERS = new Set(["attributes", "accounts", "account", "oauthaccount", "user", "organization"]);

// Token-shaped strings, wherever they occur.
const TOKEN_PATTERNS = [
  [/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/g, `Bearer ${REDACTED}`],
  [/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]*/g, REDACTED],
  [/\bsk-ant-[A-Za-z0-9_-]{8,}/g, REDACTED],
  [/\bsk-[A-Za-z0-9_-]{16,}/g, REDACTED],
  [/\b(?:access|refresh|id)_token=[^&\s"]+/g, (m) => `${m.slice(0, m.indexOf("=") + 1)}${REDACTED}`],
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
// Path segments that follow these words are ids of the account: /organizations/<org uuid>/…
const PATH_ID_AFTER = /^(organizations|orgs|accounts|users|workspaces|user|account)$/i;

export const alreadyRedacted = (v) => typeof v === "string" && /^<redacted\b/i.test(v.trim());

export function isIdentityField(key, parentKey = null) {
  const k = norm(key);
  if (IDENTITY_FIELDS.has(k)) return true;
  if (k === "id" && parentKey != null && ID_CONTAINERS.has(norm(parentKey))) return true;
  return false;
}
export const isSecretField = (key) => SECRET_FIELD_RE.test(norm(key));
export function isSecretHeader(name) {
  const n = String(name).toLowerCase();
  return SECRET_HEADERS.has(n) || SECRET_HEADER_RE.test(n);
}

// OTLP attribute lists ([{ key, value: { stringValue } }]) name their fields in `key`.
const attrKey = (o) => (o && typeof o === "object" && typeof o.key === "string" && o.value && typeof o.value === "object" ? o.key : null);

export function createRedactor() {
  const values = new Set(); // identity values seen: removed wherever they appear
  const kept = new Set();   // join keys (the loaded session's ids) that are never treated as identity
  let re = null;             // one alternation of every value, longest first (rebuilt when values change)
  const note = (v) => {
    if (typeof v === "number") v = String(v);
    if (typeof v !== "string" || alreadyRedacted(v) || v === REDACTED) return;
    const s = v.trim();
    if (s.length < 6 || s[0] === "{" || s[0] === "[" || kept.has(s.toLowerCase()) || values.has(s)) return;
    values.add(s); re = null;
  };
  // A GrowthBook hashValue can be the session id when that is the hash attribute: ids passed here stay.
  const protect = (list) => { for (const v of list || []) if (v) kept.add(String(v).toLowerCase()); };

  // Collects identity values from a parsed JSON value without changing it.
  function harvest(v, parentKey = null, depth = 0) {
    if (v == null || depth > 40) return;
    if (Array.isArray(v)) { for (const x of v) harvest(x, parentKey, depth + 1); return; }
    if (typeof v === "object") {
      const ak = attrKey(v);
      if (ak && (isIdentityField(ak) || isSecretField(ak))) { for (const x of Object.values(v.value)) note(x); }
      for (const [k, x] of Object.entries(v)) {
        if (isIdentityField(k, parentKey) || isSecretField(k)) {
          if (x && typeof x === "object") { for (const y of Array.isArray(x) ? x : Object.values(x)) note(typeof y === "object" ? null : y); }
          else note(x);
        }
        harvest(x, k, depth + 1);
      }
      return;
    }
    if (typeof v === "string" && v.length > 1 && (v[0] === "{" || v[0] === "[")) {
      const j = jsonIn(v);
      if (j) harvest(j, parentKey, depth + 1);
    }
  }
  function harvestHeaders(list) {
    for (const h of list || []) {
      const n = String(h.name).toLowerCase();
      if (isSecretHeader(n)) note(h.value);
      else if (JSON_HEADERS.has(n)) harvest(jsonIn(h.value));
    }
  }

  function valueRe() {
    if (re || !values.size) return re;
    const list = [...values].sort((a, b) => b.length - a.length).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    re = new RegExp(list.join("|"), "g");
    return re;
  }

  // A string with every token pattern, known identity value and email replaced.
  function str(s) {
    if (typeof s !== "string" || !s) return s;
    if (alreadyRedacted(s)) return BY_CAPTURE;
    let out = s;
    for (const [p, r] of TOKEN_PATTERNS) out = out.replace(p, r);
    const r = valueRe();
    if (r) out = out.replace(r, REDACTED);
    return out.replace(EMAIL, REDACTED);
  }

  // A deep copy of a JSON value, identity and secret fields replaced by REDACTED, strings scrubbed.
  // JSON carried inside a string is redacted as JSON and put back as a string.
  function json(v, parentKey = null, depth = 0) {
    if (v == null || typeof v === "number" || typeof v === "boolean") return v;
    if (depth > 60) return REDACTED;
    if (Array.isArray(v)) return v.map((x) => json(x, parentKey, depth + 1));
    if (typeof v === "object") {
      const ak = attrKey(v);
      const out = {};
      for (const [k0, x] of Object.entries(v)) {
        // An identity value can be a key too ({ "<org uuid>": … }): scrubbed like any string, kept unique.
        let k = k0.length >= 6 ? str(k0) : k0;
        if (k !== k0) { let n = 2; const base = k; while (k in out) k = `${base} ${n++}`; }
        if (ak && k === "value" && (isIdentityField(ak) || isSecretField(ak))) { out[k] = x && typeof x === "object" ? Object.fromEntries(Object.keys(x).map((y) => [y, REDACTED])) : REDACTED; continue; }
        if (isIdentityField(k, parentKey) || isSecretField(k)) {
          // JSON carried in an identity field (Claude Code's metadata.user_id) keeps its keys.
          const inner = typeof x === "string" ? jsonIn(x) : null;
          if (inner && !Array.isArray(inner)) { out[k] = JSON.stringify(json(inner, k, depth + 1)); continue; }
          out[k] = x == null || x === "" ? x : alreadyRedacted(x) ? BY_CAPTURE : Array.isArray(x) ? x.map(() => REDACTED) : kept.has(String(x).toLowerCase()) ? x : REDACTED;
          continue;
        }
        out[k] = json(x, k, depth + 1);
      }
      return out;
    }
    if (typeof v === "string") {
      if (v.length > 1 && (v[0] === "{" || v[0] === "[")) {
        const j = jsonIn(v);
        if (j) return JSON.stringify(json(j, parentKey, depth + 1));
      }
      return str(v);
    }
    return v;
  }

  // Headers as [{ name, value, redacted }]: redacted is null, "trace" (removed here) or "capture" (the
  // capture tool had already removed it).
  function headers(list) {
    return (list || []).map((h) => {
      const name = String(h.name);
      const n = name.toLowerCase();
      const value = String(h.value ?? "");
      if (alreadyRedacted(value)) return { name, value: BY_CAPTURE, redacted: "capture" };
      if (isSecretHeader(n)) return { name, value: REDACTED, redacted: "trace" };
      if (JSON_HEADERS.has(n)) { const j = jsonIn(value); if (j) return { name, value: JSON.stringify(json(j)), redacted: null }; }
      return { name, value: str(value), redacted: null };
    });
  }

  // A URL path with account ids removed: /organizations/<id>/… and any known identity value.
  function path(p) {
    const segs = String(p || "").split("/");
    for (let k = 1; k < segs.length; k++) if (PATH_ID_AFTER.test(segs[k - 1]) && /^[A-Za-z0-9_-]{8,}$/.test(segs[k])) segs[k] = REDACTED;
    return str(segs.join("/"));
  }

  return { harvest, harvestHeaders, str, json, headers, path, note, protect, get size() { return values.size; } };
}

function jsonIn(s) {
  if (typeof s !== "string") return null;
  const t = s.trim();
  if (!(t.startsWith("{") || t.startsWith("["))) return null;
  try { const j = JSON.parse(t); return j && typeof j === "object" ? j : null; } catch { return null; }
}
