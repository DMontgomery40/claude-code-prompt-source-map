import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { captureSessions,scopeCapture,analyzeCapture } from '../../site/trace/network/capture.js';
import { fileCapture } from '../capture/file-capture.mjs';
const A='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',B='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const frame=(type,data)=>({type,time:1,data:JSON.stringify(data)});
const entry=(headers=[],frames=[])=>({startedDateTime:'2026-01-01T00:00:00Z',request:{url:'https://chatgpt.com/backend-api/codex/responses',method:'GET',headers},response:{status:101,headers:[],content:{}},_webSocketMessages:frames});
const create=id=>frame('send',{type:'response.create',client_metadata:{thread_id:id,session_id:A},input:[],model:'synthetic'});
const receive=(type,id)=>frame('receive',{type,response:{id}});
const har=entries=>JSON.stringify({log:{entries}});
const shared=()=>har([entry([{name:'thread-id',value:A}],[create(A),receive('response.created','response-a'),receive('response.completed','response-a'),create(B),receive('response.created','response-b'),receive('response.completed','response-b')]),{...entry(),_webSocketMessages:undefined,request:{url:'https://chatgpt.com/backend-api/wham/usage',method:'GET',headers:[]}}]);
const trace=id=>({product:'codex',agents:[{id,kind:'root',requests:[],blocks:[]}]});

test('shared websocket create metadata overrides handshake and root session identifiers',async()=>{
 const text=shared();
 assert.deepEqual(captureSessions(text).sessions.map(s=>s.id).sort(),[A,B]);
 const b=scopeCapture(text,[B]);
 const frames=b.log.entries[0]._webSocketMessages;
 assert.equal(frames.length,3);
 assert.equal(JSON.parse(frames[0].data).client_metadata.thread_id,B);
 assert.equal(b.log.entries[1]._traceAssociation,'unattributed');
 const {capture,store}=await analyzeCapture([{name:'test.har',text:JSON.stringify(b)}],trace(B));
 assert.equal(capture.calls.length,1);
 assert.equal(capture.calls[0].requestId,'response-b');
 assert.ok(!store.body(0,'frames').text.includes('response-a'));
 assert.equal(capture.entries[1].association,'unattributed');
 assert.ok(capture.notes.some(n=>n.includes('timestamps do not establish ownership')));
});
test('overlapping creates do not assign unknown response frames to the latest thread',()=>{
 const text=har([entry([],[create(A),create(B),receive('response.created','unknown')])]);
 const scoped=scopeCapture(text,[B]);
 assert.equal(scoped.log.entries[0]._webSocketMessages[1]._traceAssociation,'unattributed');
});
test('filer writes exact independent thread subsets and explicit attachment never overrides IDs',()=>{
 const dir=mkdtempSync(path.join(os.tmpdir(),'capture-association-'));
 try{
  const root=path.join(dir,'sessions');mkdirSync(root);
  for(const id of [A,B])writeFileSync(path.join(root,`rollout-test-${id}.jsonl`),JSON.stringify({type:'session_meta',payload:{id}})+'\n');
  const file=path.join(dir,'shared.har');writeFileSync(file,shared());
  const plan=fileCapture(file,{roots:{codex:root}});
  assert.equal(plan.places.length,2);
  for(const place of plan.places){
   const body=readFileSync(place.dest,'utf8');
   const creates=JSON.parse(body).log.entries[0]._webSocketMessages.filter(f=>f.type==='send').map(f=>JSON.parse(f.data).client_metadata.thread_id);
   assert.deepEqual(creates,[place.id]);
  }
  assert.throws(()=>fileCapture(file,{roots:{codex:root},attachment:{product:'codex',sessionIds:[A]}}),/cannot override exact/);
  const unscoped=path.join(dir,'unscoped.har');writeFileSync(unscoped,har([entry([], [frame('send',{type:'response.create',input:[]})])]));
  assert.throws(()=>fileCapture(unscoped,{roots:{codex:root}}),/No.*session id/);
  const attached=fileCapture(unscoped,{roots:{codex:root},attachment:{product:'codex',sessionIds:[A]}});
  const content=JSON.parse(readFileSync(attached.places[0].dest,'utf8'));
  assert.equal(content.log._traceCaptureAttachment.association,'explicit');
  assert.equal(content.log.entries[0]._traceAssociation,'explicit');
  assert.throws(()=>fileCapture(unscoped,{roots:{codex:root},attachment:{product:'codex',sessionIds:['invalid']}}),/valid.*UUID/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('HTTPS/SSE fallback model calls join by exact response id and exclude another thread',async()=>{
 const http=(id,rid)=>({...entry([{name:'thread-id',value:A}]),_webSocketMessages:undefined,request:{...entry().request,method:'POST',headers:[{name:'thread-id',value:A}],postData:{text:JSON.stringify({model:'synthetic',client_metadata:{thread_id:id,session_id:A},input:[],instructions:'fixture instructions'})}},response:{status:200,headers:[],content:{mimeType:'text/event-stream',text:`data: ${JSON.stringify({type:'response.created',response:{id:rid,model:'synthetic'}})}\n\ndata: ${JSON.stringify({type:'response.completed',response:{id:rid,status:'completed',usage:{input_tokens:5,output_tokens:2,total_tokens:7}}})}\n\n`}}});
 const loaded=trace(B);loaded.agents[0].requests=[{responseId:'resp-b'}];
 const {capture}=await analyzeCapture([{name:'http.har',text:har([http(A,'resp-a'),http(B,'resp-b')])}],loaded);
 assert.equal(capture.calls.length,1);
 assert.equal(capture.calls[0].requestId,'resp-b');
 assert.equal(capture.calls[0].usage.input_tokens,5);
 assert.equal(capture.calls[0].complete,true);
 assert.equal(capture.join.matched,1);
 assert.equal(capture.entries[0].label,'Responses (HTTPS/SSE)');
});
test('an explicit attached HAR cannot silently attach to a different loaded thread',async()=>{
 const scoped=scopeCapture(har([entry([], [frame('send',{type:'response.create',input:[]})])]),[A],{explicit:true});
 await assert.rejects(analyzeCapture([{name:'explicit.har',text:JSON.stringify(scoped)}],trace(B)),/explicitly attached capture doesn't hold/);
});
test('known response IDs preserve per-call ownership across an interleaved socket',async()=>{
 const text=har([entry([],[create(A),receive('response.created','resp-a'),create(B),receive('response.completed','resp-a'),receive('response.created','resp-b'),receive('response.completed','resp-b')])]);
 const loaded=trace(A);loaded.agents.push({id:B,kind:'subagent',requests:[],blocks:[]});
 const {capture}=await analyzeCapture([{name:'interleaved.har',text}],loaded);
 assert.deepEqual(capture.calls.map(call=>call.requestId),['resp-a','resp-b']);
});
test('a reused handshake cannot claim an unidentified create after request-local thread IDs',()=>{
 const text=har([entry([{name:'thread-id',value:A}],[create(B),receive('response.completed','resp-b'),frame('send',{type:'response.create',input:[]}),receive('response.completed','unscoped')])]);
 const scoped=scopeCapture(text,[B]);
 assert.equal(scoped.log.entries[0]._webSocketMessages[2]._traceAssociation,'unattributed');
});
test('scope then analyze never promotes unresolved frames after removing a competing create',async()=>{
 const text=har([entry([],[create(A),create(B),frame('receive',{type:'response.created',response:{id:'unknown-response',model:'foreign-response-model'}}),receive('response.completed','unknown-response')])]);
 const scoped=scopeCapture(text,[B]);
 assert.deepEqual(scoped.log.entries[0]._webSocketMessages.map(frame=>frame._traceAssociation),['request-id','unattributed','unattributed']);
 const {capture,store}=await analyzeCapture([{name:'partition.har',text:JSON.stringify(scoped)}],trace(B));
 assert.equal(capture.calls.length,1);
 assert.equal(capture.calls[0].requestId,null);
 assert.equal(capture.calls[0].response,null);
 assert.ok(store.body(0,'frames').text.includes('[unattributed]'));
});
test('local ancestors group captures across an uncaptured intermediate thread',()=>{
 const C='cccccccc-cccc-cccc-cccc-cccccccccccc';
 const dir=mkdtempSync(path.join(os.tmpdir(),'capture-ancestors-'));
 try{
  const root=path.join(dir,'sessions');mkdirSync(root);
  const log=(id,parent)=>writeFileSync(path.join(root,`rollout-test-${id}.jsonl`),JSON.stringify({type:'session_meta',payload:{id,...parent?{source:{subagent:{thread_spawn:{parent_thread_id:parent}}}}:{}}})+'\n');
  log(A);log(B,A);log(C,B);
  const source=path.join(dir,'family.har');writeFileSync(source,har([entry([],[create(A),receive('response.completed','a'),create(C),receive('response.completed','c')])]));
  const plan=fileCapture(source,{roots:{codex:root}});
  assert.equal(plan.places.length,1);
  assert.equal(plan.places[0].id,A);
  assert.deepEqual(plan.places[0].sessionIds,[A,C]);
  assert.equal(plan.places[0].capture.websocketCreates,2);
  const childOnly=path.join(dir,'child.har');writeFileSync(childOnly,har([entry([],[create(C),receive('response.completed','c')])]));
  const childPlan=fileCapture(childOnly,{roots:{codex:root}});
  assert.equal(childPlan.places.length,1);
  assert.equal(childPlan.places[0].id,A);
  assert.deepEqual(childPlan.places[0].sessionIds,[C]);
  assert.ok(path.basename(childPlan.places[0].dest).includes(A));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
