import os from "node:os";

export class PrivacyError extends Error {}

// Refuses any output that carries account identity, credentials, e-mail
// addresses or local paths. Catalog records were already reduced to prompt
// fields; this is the last line of defence before anything is written.
export function privacyScan(docs, { identity } = {}) {
  const home = os.homedir();
  const denied = [
    // /home/oai/ is the fixed home of OpenAI's cloud container named in shipped docs, not a user's.
    { label: "local user path", pattern: /\/Users\/|\/home\/(?!oai\/)[a-z]|\/private\/var\/|C:\\Users\\/ },
    { label: "home directory", literal: home },
    { label: "e-mail address", pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/ },
    { label: "JWT", pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
    { label: "API key", pattern: /\bsk-[A-Za-z0-9_-]{20,}/ },
    { label: "bearer token", pattern: /Bearer [A-Za-z0-9._-]{20,}/ },
    { label: "auth field", pattern: /"(?:access_token|refresh_token|id_token|account_id|api_key)"\s*:/ },
    // Product text may name a project's .codex/config.toml; auth files and the home config may not appear.
    { label: "Codex config path", pattern: /\.codex\/auth\.json|~\/\.codex\/config\.toml/ },
    ...(identity ? [{ label: "catalog account identity", literal: identity }] : [])
  ];
  for (const [name, content] of docs) {
    for (const rule of denied) {
      const hit = rule.literal ? content.includes(rule.literal) : rule.pattern.test(content);
      if (hit) throw new PrivacyError(`${name} contains a ${rule.label}; refusing to write outputs`);
    }
  }
}
