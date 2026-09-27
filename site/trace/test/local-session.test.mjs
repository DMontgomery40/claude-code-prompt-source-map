import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openLocalSession, localFileSource} from '../local-session.js';

test('local session client falls back only when resolver is unavailable, not for missing or denied sessions', async()=>{
 const down=()=>Promise.reject(new TypeError('unreachable'));
 assert.equal(await openLocalSession('id',{fetcher:down}),null);
 const missing=async url=>new Response(JSON.stringify(url.endsWith('/health')?{service:'trace-local',version:1}:{error:'Session not found'}),{status:url.endsWith('/health')?200:404});
 await assert.rejects(openLocalSession('id',{fetcher:missing}),/Session not found/);
 const wrong=async()=>new Response(JSON.stringify({service:'another-app'}));
 assert.equal(await openLocalSession('id',{fetcher:wrong}),null);
});

test('local source reads byte ranges and never follows a manifest to an external host', async()=>{
 assert.throws(()=>localFileSource({url:'https://evil.example/private',size:9,path:'session.jsonl'}),/loopback/);
 const body=new TextEncoder().encode('café\nsecond line\n');
 const source=localFileSource({url:'http://127.0.0.1:8766/v1/file/token',size:body.length,path:'session.jsonl'},async url=>{
  const u=new URL(url);return new Response(body.slice(+u.searchParams.get('start'),+u.searchParams.get('end')));
 });
 assert.deepEqual(await source.slice(0,5),body.slice(0,5));
 assert.deepEqual(await source.slice(5,body.length),body.slice(5));
 await assert.rejects(source.slice(-1,2),/range/);
});
