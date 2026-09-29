import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Read credentials as data; never source the environment file or expose its contents.
export function decisionConfig(env = process.env, read = () => fs.readFileSync(path.join(os.homedir(), '.env'), 'utf8')) {
  let text = '';
  try { text = read(); } catch { /* Environment variables can supply credentials. */ }
  const value = name => env[name] || text.match(new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=\\s*["']?([^"'\\s]+)`, 'm'))?.[1];
  const router = value('OPENROUTER_API_KEY');
  const useRouter = env.JEV_PROVIDER === 'openrouter' || (env.JEV_PROVIDER !== 'typesafe' && Boolean(router));
  return useRouter
    ? { provider: 'OpenRouter', key: router, endpoint: 'https://openrouter.ai/api/v1/systemone', model: 'typesafe/jev-1.13' }
    : { provider: 'TypeSafe', key: value('TYPESAFE_API_KEY'), endpoint: 'https://api.typesafe.ai/v1/systemone', model: 'jev-latest' };
}

// Preserve the typed System One request/response schema for existing classifiers.
export function decisionFetch(config, fetchImpl = globalThis.fetch) {
  return (url, options = {}) => {
    if (url !== 'https://api.typesafe.ai/v1/systemone') return fetchImpl(url, options);
    const body = JSON.parse(options.body);
    return fetchImpl(config.endpoint, {
      ...options,
      headers: { ...options.headers, authorization: `Bearer ${config.key}` },
      body: JSON.stringify({ ...body, model: config.model }),
      signal: options.signal ?? AbortSignal.timeout(60_000)
    });
  };
}
