import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {installVoiceObserver,sanitizeRecord,voiceSummary} from '../capture/renderer-capture.mjs';
class Channel extends EventTarget {sent=[];send(value){this.sent.push(value);}close(){this.dispatchEvent(new Event('close'));}}
class Peer extends EventTarget {connectionState='new';iceConnectionState='new'; channels=[];createDataChannel(){const c=new Channel;this.channels.push(c);return c;}setLocalDescription(description){return Promise.resolve(description);}getStats(){return Promise.resolve(new Map());}close(){this.connectionState='closed';this.dispatchEvent(new Event('connectionstatechange'));}}
function context(){const records=[];const scope={RTCPeerConnection:Peer,RTCDataChannel:Channel,EventTarget,Date,JSON,TextEncoder,Map,Set,WeakMap,Promise,setInterval:()=>0,clearInterval:()=>{},emit:s=>records.push(JSON.parse(s))};scope.globalThis=scope;return {scope:vm.createContext(scope),records};}
test('optional voice observer does nothing until a peer exists and preserves send/receive',async()=>{
 const {scope,records}=context();vm.runInContext(`(${installVoiceObserver.toString()})('emit')`,scope);assert.equal(records.length,0);
 vm.runInContext("pc=new RTCPeerConnection();dc=pc.createDataChannel('events');dc.send('{\"type\":\"hello\"}')",scope);
 assert.deepEqual(scope.dc.sent,['{"type":"hello"}']);
 const incoming=new Event('message');incoming.data='{"type":"response.done"}';scope.dc.dispatchEvent(incoming);
 assert.equal(records.filter(r=>r.kind==='datachannel').length,2);
 scope.pc.close();assert.equal(records.at(-1).state,'closed');
 vm.runInContext(`(${installVoiceObserver.toString()})('emit')`,scope);scope.dc.send('again');assert.equal(records.filter(r=>r.kind==='datachannel').length,3,'installation is idempotent');
});
test('renderer records scrub credentials before persistence and withhold audio and binary payloads',()=>{
 const clean=sanitizeRecord({kind:'datachannel',data:JSON.stringify({type:'event',access_token:'test-secret-token',token:'other-secret',audio:'private-audio',text:'Bearer abcdefghijklmnopqrstuvwxyz0123456789'})});
 assert.doesNotMatch(JSON.stringify(clean),/test-secret|other-secret|private-audio|abcdefghijklmnopqrstuvwxyz/);
 assert.match(clean.data,/redacted/);
 const request=sanitizeRecord({kind:'http',url:'https://chatgpt.com/wham/realtime/calls?token=very-secret',headers:[{name:'Authorization',value:'Basic opaque'},{name:'Cookie',value:'session=secret'}],sdp:'private-sdp'});
 assert.doesNotMatch(JSON.stringify(request),/very-secret|opaque|session=secret|private-sdp/);
});
test('no voice is a successful empty enrichment and exact call IDs remain observable',()=>{
 assert.deepEqual(voiceSummary([]),{observed:false,peers:0,messages:0,calls:[],closedCalls:[]});
 const rows=[{kind:'peer',peerId:'p1'},{kind:'datachannel',peerId:'p1',direction:'receive',data:'{}'},{kind:'association',peerId:'p1',callId:'rtc_test',threadId:'11111111-2222-4333-8444-555555555555'},{kind:'state',peerId:'p1',state:'closed'}];
 const state=voiceSummary(rows);assert.equal(state.messages,1);assert.deepEqual(state.calls,['rtc_test']);assert.deepEqual(state.closedCalls,['rtc_test']);
});

test('renderer collector records HTTP and exact-SDP call association; no voice does not fail',async t=>{
 const {mkdtemp,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {createRendererCapture}=await import('../capture/renderer-capture.mjs');
 const directory=await mkdtemp(join(tmpdir(),'renderer-fixture-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 let emit;const commands=[];const connection={on:fn=>emit=fn,send:async(method,params)=>{commands.push([method,params]);return {identifier:'fixture-script'};},close:()=>{}};
 const collector=await createRendererCapture({port:9876,directory,fetcher:async()=>({ok:true,json:async()=>[{id:'fixture',type:'page',url:'app://-/index.html',webSocketDebuggerUrl:'ws://127.0.0.1:9876/devtools/page/fixture'}]}),connect:async()=>connection});
 await collector.poll();assert.equal(collector.status().voice.observed,false);
 const binding=commands.find(([name])=>name==='Runtime.addBinding')[1].name;
 emit({method:'Network.requestWillBeSent',params:{requestId:'1',request:{method:'POST',url:'https://chatgpt.com/wham/realtime/calls',headers:{Authorization:'Bearer fixture-secret-credential'},postData:JSON.stringify({sdp:'exact-offer',session:{thread_id:'11111111-2222-4333-8444-555555555555'}})}}});
 emit({method:'Network.responseReceived',params:{requestId:'1',response:{status:200,statusText:'OK',mimeType:'application/sdp',headers:{location:'/wham/realtime/calls/rtc_test'}}}});
 emit({method:'Runtime.bindingCalled',params:{name:binding,executionContextId:1,payload:JSON.stringify({kind:'offer',peerId:'peer-1',time:1,sdp:'exact-offer'})}});
 emit({method:'Runtime.bindingCalled',params:{name:binding,executionContextId:1,payload:JSON.stringify({kind:'datachannel',peerId:'peer-1',time:2,direction:'receive',data:'{"type":"response.done","access_token":"secret"}'})}});
 emit({method:'Runtime.bindingCalled',params:{name:binding,executionContextId:1,payload:JSON.stringify({kind:'state',peerId:'peer-1',time:3,state:'closed'})}});
 await collector.stop();const text=await readFile(join(directory,'renderer.har'),'utf8');assert.doesNotMatch(text,/fixture-secret|exact-offer|"access_token":"secret"/);
 const har=JSON.parse(text);assert.equal(har.log.entries.length,1);assert.equal(collector.status().voice.messages,1);assert.deepEqual(collector.status().voice.closedCalls,['rtc_test']);
 const association=har.log._traceVoice.find(r=>r.kind==='association');assert.equal(association.threadId,'11111111-2222-4333-8444-555555555555');
 assert.ok(commands.some(([method])=>method==='Runtime.removeBinding'));
});

test('buddy signaling associates the exact peer and call without inventing a thread',async t=>{
 const {mkdtemp,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {createRendererCapture}=await import('../capture/renderer-capture.mjs');
 const directory=await mkdtemp(join(tmpdir(),'renderer-buddy-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 let emit;const commands=[];const connection={on:fn=>emit=fn,send:async(method,params)=>{commands.push([method,params]);return {identifier:'script'};},close:()=>{}};
 const collector=await createRendererCapture({port:9876,directory,fetcher:async()=>({ok:true,json:async()=>[{id:'buddy',type:'page',url:'app://-/index.html?initialRoute=/orbit',webSocketDebuggerUrl:'ws://127.0.0.1:9876/devtools/page/buddy'}]}),connect:async()=>connection});
 await collector.poll();assert.equal(collector.status().targets,1);
 const binding=commands.find(([name])=>name==='Runtime.addBinding')[1].name;
 emit({method:'Runtime.bindingCalled',params:{name:binding,executionContextId:1,payload:JSON.stringify({kind:'offer',peerId:'p',time:1,sdp:'buddy-offer'})}});
 emit({method:'Network.requestWillBeSent',params:{requestId:'b',request:{method:'POST',url:'https://chatgpt.com/tbo/buddy/voice/calls',headers:{},postData:JSON.stringify({sdp:'buddy-offer'})}}});
 emit({method:'Network.responseReceived',params:{requestId:'b',response:{status:201,statusText:'Created',mimeType:'application/sdp',headers:{location:'/tbo/buddy/voice/calls/rtc_buddy'}}}});
 emit({method:'Runtime.bindingCalled',params:{name:binding,executionContextId:1,payload:JSON.stringify({kind:'state',peerId:'p',time:2,state:'closed'})}});
 await collector.stop();const har=JSON.parse(await readFile(join(directory,'renderer.har')));const row=har.log._traceVoice.find(r=>r.kind==='association');assert.equal(row.callId,'rtc_buddy');assert.equal(row.threadId,undefined);assert.deepEqual(collector.status().voice.closedCalls,['rtc_buddy']);
});

test('observer cleanup still removes instrumentation when future-script removal fails',async t=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {createRendererCapture}=await import('../capture/renderer-capture.mjs');const directory=await mkdtemp(join(tmpdir(),'renderer-cleanup-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const commands=[];let closed=false;const connection={on:()=>{},send:async(method,params)=>{commands.push([method,params]);if(method==='Page.removeScriptToEvaluateOnNewDocument')throw new Error('fixture failure');return {identifier:'script'};},close:()=>{closed=true;}};
 const collector=await createRendererCapture({port:9876,directory,fetcher:async()=>({ok:true,json:async()=>[{id:'test',type:'page',url:'app://-/index.html',webSocketDebuggerUrl:'ws://127.0.0.1:9876/devtools/page/test'}]}),connect:async()=>connection});await collector.poll();await collector.stop();assert.ok(commands.some(([method,params])=>method==='Runtime.evaluate'&&params.expression==='globalThis.__traceVoiceObserver?.stop()'));assert.ok(commands.some(([method])=>method==='Runtime.removeBinding'));assert.equal(closed,true);
});
