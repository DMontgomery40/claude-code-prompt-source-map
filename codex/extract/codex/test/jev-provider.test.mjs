import assert from 'node:assert/strict';
import test from 'node:test';
import { decisionConfig, decisionFetch } from '../lib/jev-provider.mjs';

test('OpenRouter is selected with an environment key without leaking it into configuration labels', () => {
  const config = decisionConfig({ OPENROUTER_API_KEY: 'router-secret', TYPESAFE_API_KEY: 'direct-secret' }, () => '');
  assert.equal(config.key, 'router-secret');
  assert.equal(config.endpoint, 'https://openrouter.ai/api/v1/systemone');
  assert.equal(config.model, 'typesafe/jev-1.13');
  assert.equal(config.provider, 'OpenRouter');
});

test('home environment fallback is parsed as data and explicit TypeSafe selection remains available', () => {
  const read = () => 'OPENROUTER_API_KEY="router-secret"\nTYPESAFE_API_KEY=direct-secret\n';
  assert.equal(decisionConfig({}, read).key, 'router-secret');
  assert.equal(decisionConfig({ JEV_PROVIDER: 'typesafe' }, read).key, 'direct-secret');
});

test('provider adapter preserves typed state and questions and sends the selected model and authorization', async () => {
  const config = decisionConfig({ OPENROUTER_API_KEY: 'router-secret' }, () => '');
  let seen;
  const fetchImpl = decisionFetch(config, async (url, opts) => { seen = { url, ...opts }; return { ok: true }; });
  const state = { item: 'bundle evidence' }, questions = { documentable: { type: 'noul' } };
  await fetchImpl('https://api.typesafe.ai/v1/systemone', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'jev-latest', state, questions }) });
  assert.equal(seen.url, config.endpoint);
  assert.equal(seen.headers.authorization, 'Bearer router-secret');
  assert.deepEqual(JSON.parse(seen.body), { model: config.model, state, questions });
  assert.ok(seen.signal instanceof AbortSignal);
});

test('adapter does not redirect unrelated requests', async () => {
  const fetchImpl = decisionFetch(decisionConfig({}, () => ''), async (url) => url);
  assert.equal(await fetchImpl('https://example.org/evidence', {}), 'https://example.org/evidence');
});
