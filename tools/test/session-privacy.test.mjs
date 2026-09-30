import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {createSessionSanitizer,sanitizeSessionFiles,localSecretValues} from '../privacy/sanitize-session.mjs';
import {semanticCandidates,reviewSanitizedCandidates,validateSemanticAnswers} from '../privacy/review-session.mjs';
const A='019b76da-a800-7000-8000-000000000001',B='019b76da-f044-7000-8000-000000000003';
test('UUID aliases preserve UUID7 birth time and joins while removing secrets and sensitive records',()=>{
 const secret='fixtureOpaque'+ 'Q'.repeat(24);const s=createSessionSanitizer({salt:'fixture',secretValues:[secret],privateNames:['Private Person']});
 const row={type:'session_meta',timestamp:'2026-01-01T00:00:00Z',payload:{id:A,parent_thread_id:B,cwd:'/Users/fixture/private-project',usage:{input_tokens:923},text:`Private Person ${A} ${secret}`,credentials:{api_key:secret}}};
 const clean=s.walk(row);assert.equal(clean.timestamp,row.timestamp);assert.equal(clean.payload.usage.input_tokens,923);assert.notEqual(clean.payload.id,A);assert.equal(clean.payload.id.slice(0,13),A.slice(0,13));assert.equal(clean.payload.parent_thread_id,s.alias(B));assert.ok(clean.payload.text.includes(clean.payload.id));assert.doesNotMatch(JSON.stringify(clean),/fixtureOpaque|Private Person|\/Users\/fixture/);
 assert.equal(s.walk({content:'patient diagnosis fixture'}).content,'[withheld sensitive source text]');
 assert.equal(s.walk({image_url:'data:image/png;base64,PRIVATE'}).image_url,'[withheld opaque payload]');
 assert.doesNotMatch(s.text('api_key="opaque-not-in-environment"'),/opaque-not/);
 assert.deepEqual(localSecretValues({},'API_KEY="fixture-secret"'),['fixture-secret']);
});
test('short signatures, inline Fernet and compact base64 payloads are withheld',()=>{
 const s=createSessionSanitizer({salt:'fixture'});
 const signature='signed'+ 'Q'.repeat(30);
 assert.equal(s.walk({signature}).signature,'[withheld opaque payload]');
 const encrypted='gAAAA'+ 'Z'.repeat(40);
 assert.doesNotMatch(s.text(`tool output ${encrypted} trailing neutral prose`),/gAAAA/);
 const compact='Q'.repeat(125)+'+/==';
 assert.doesNotMatch(s.text(`code payload: ${compact}`),/Q{120}/);
 const hex='a'.repeat(128);assert.equal(s.text(hex),hex,'ordinary hexadecimal digests remain usable');
 assert.equal(s.text('api_key="[redacted credential]"'),'api_key="[redacted credential]"','credential boundary rescans are idempotent');
});
test('streamed JSONL/gzip and subagent metadata keep all real rows and numbers; audits remain private',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'session-scrub-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const source=path.join(dir,'source');fs.mkdirSync(path.join(source,A,'subagents'),{recursive:true});
 const main=path.join(source,A+'.jsonl'),meta=path.join(source,A,'subagents','agent-fixture.meta.json');
 const rows=[{type:'session_meta',payload:{id:A}},{timestamp:'2026-01-01',type:'event_msg',payload:{usage:{total_tokens:42},text:'A neutral software engineering fixture describes request routing.'}}];
 fs.writeFileSync(main,rows.map(r=>JSON.stringify(r)).join('\n')+'\n');fs.writeFileSync(meta,JSON.stringify({toolUseId:A,spawnDepth:2,name:'fixture'}));const out=path.join(dir,'output');
 const result=await sanitizeSessionFiles([main,meta],{outputDirectory:out,auditFile:path.join(out,'private-audit.json'),policy:{salt:'fixture'}});
 assert.equal(result.records,3);assert.equal(result.publicationApproved,false);const audit=JSON.parse(fs.readFileSync(path.join(out,'private-audit.json')));assert.equal(audit.files.length,2);assert.equal(audit.idMap[A],path.basename(result.files[0].name).replace('.jsonl.gz',''));
 const clean=zlib.gunzipSync(fs.readFileSync(path.join(out,result.files[0].name))).toString().trim().split('\n').map(JSON.parse);assert.equal(clean.length,rows.length);assert.equal(clean[1].payload.usage.total_tokens,42);assert.equal(fs.statSync(path.join(out,'private-audit.json')).mode&0o777,0o600);
});
test('gzip input keeps original rows and hashes the compressed source',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'session-gzip-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));const input=path.join(dir,A+'.jsonl.gz');
 fs.writeFileSync(input,zlib.gzipSync(JSON.stringify({type:'event_msg',timestamp:'2026-01-01',payload:{session_id:A,total_tokens:19}})+'\n'));
 const out=path.join(dir,'review');const result=await sanitizeSessionFiles([input],{outputDirectory:out,auditFile:path.join(out,'audit.json'),policy:{salt:'fixture'}});
 const row=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(out,result.files[0].name))).toString());assert.equal(result.records,1);assert.equal(row.payload.total_tokens,19);assert.equal(row.timestamp,'2026-01-01');assert.notEqual(row.payload.session_id,A);
});
test('semantic review deduplicates, rejects raw secrets before sending, and validates every answer',async()=>{
 const candidates=semanticCandidates([{text:'A neutral software engineering fixture describes request routing.'},{text:'A neutral software engineering fixture describes request routing.'}]);assert.equal(candidates.length,1);let calls=0;
 const fetcher=async(url,options)=>{calls++;const sent=JSON.parse(options.body);assert.ok(sent.state.texts[candidates[0].hash]);return {ok:true,json:async()=>({answers:{['privacy_'+candidates[0].hash]:{noul:0.01}}})};};
 const config={key:'synthetic',endpoint:'https://fixture.example/',model:'fixture'};
 await assert.rejects(reviewSanitizedCandidates(candidates,{approvedHashes:[candidates[0].hash],boundary:{privateValues:['request routing']},config,fetcher}));assert.equal(calls,0);
 const review=await reviewSanitizedCandidates(candidates,{approvedHashes:[candidates[0].hash],config,fetcher});assert.equal(calls,1);assert.equal(review.publicationApproved,false);assert.equal(review.results[0].privateContentProbability,.01);
 assert.throws(()=>validateSemanticAnswers({answers:{['privacy_'+candidates[0].hash]:{noul:2}}},[candidates[0].hash]));assert.throws(()=>validateSemanticAnswers({answers:{}},[candidates[0].hash]));
});
