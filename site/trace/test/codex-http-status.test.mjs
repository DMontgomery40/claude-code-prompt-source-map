import test from 'node:test';
import assert from 'node:assert/strict';
import {codexHttp} from '../network/findings.js';
import {createRedactor} from '../network/redact.js';
const decode = body => codexHttp({request:{headers:[],postData:{text:JSON.stringify({model:'fixture',input:[]})}},response:{headers:[],content:{text:typeof body==='string'?body:JSON.stringify(body)}}},{i:0,t:0,reqBytes:1},createRedactor());
test('HTTP API error JSON retains failure without claiming response completion',()=>{
 for(const body of [{error:{code:'rate_limit_exceeded',message:'fixture'}},{type:'error',error:{code:'invalid_request'}}]) {
  const call=decode(body);assert.equal(call.complete,false);assert.equal(call.status,'failed');assert.ok(call.error);assert.equal(call.requestId,null);
 }
});
test('nonterminal and unknown HTTP JSON statuses never synthesize terminal events',()=>{
 for(const status of ['in_progress','queued','unknown',undefined]) {
  const call=decode({id:'fixture-response',status});assert.equal(call.complete,false);assert.equal(call.status,status??null);assert.equal(call.requestId,'fixture-response');
 }
});
test('explicit HTTP terminal response statuses and SSE decoding remain supported',()=>{
 for(const status of ['completed','failed','incomplete']) {
  const call=decode({id:'fixture-response',status});assert.equal(call.complete,true);assert.equal(call.status,status);assert.equal(call.requestId,'fixture-response');
 }
 const call=decode('data: {"type":"response.created","response":{"id":"fixture-sse","status":"in_progress"}}\n\ndata: {"type":"response.completed","response":{"id":"fixture-sse","status":"completed"}}\n\n');
 assert.equal(call.complete,true);assert.equal(call.requestId,'fixture-sse');assert.equal(call.status,'completed');
});
