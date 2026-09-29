import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecordingController,recordingAttachment,canStopRecording,recordingNotice} from '../help/recording.js';
const id='00000000-0000-4000-8000-000000000001';
const response=(data,ok=true)=>({ok,json:async()=>data});
function fixture(fetcher){
 const scheduled=[],cancelled=[],changes=[];
 const controller=createRecordingController({fetcher,schedule:fn=>{scheduled.push(fn);return scheduled.length;},cancel:id=>cancelled.push(id),onChange:state=>changes.push(state)});
 return {controller,scheduled,cancelled,changes};
}
test('recorder construction never accesses the local network; only an explicit check starts polling',async()=>{
 const calls=[];const f=fixture(async(...args)=>{calls.push(args);return response({supported:true,phase:'idle'});});
 assert.equal(calls.length,0);assert.equal(f.scheduled.length,0);
 await f.controller.check();
 assert.equal(calls[0][0],'http://127.0.0.1:8766/v1/recording/status');
 assert.equal(calls[0][1].method,'GET');
 assert.equal(calls[0][1].headers['X-Trace-Request'],'1');
 assert.equal(f.scheduled.length,1);
 f.controller.dispose();assert.equal(f.cancelled.length,1);
 await f.scheduled[0]();assert.equal(calls.length,1,'disposed polling does not fetch');
});
test('start and normal stop send no guessed session attachment and never call quit or relaunch routes',async()=>{
 const calls=[];const f=fixture(async(url,options)=>{calls.push({url,options});return response({supported:true,phase:url.endsWith('/start')?'recording':'stopped',appRunning:true,forwarding:true,flows:0,frames:0});});
 await f.controller.start();await f.controller.stop();
 assert.deepEqual(calls.map(call=>new URL(call.url).pathname),['/v1/recording/start','/v1/recording/stop']);
 for(const {options} of calls){assert.equal(options.method,'POST');assert.equal(options.body,'{}');assert.equal(options.headers['X-Trace-Request'],'1');assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');}
 assert.equal(f.controller.snapshot.status.forwarding,true,'Stop does not assume forwarding ended');
 f.controller.dispose();
});
test('attachment is a separate explicit action to the validated open Codex/ChatGPT root',async()=>{
 const calls=[];const f=fixture(async(url,options)=>{calls.push({url,options});return response({phase:'stopped',pendingAttachment:false,filed:1});});
 assert.equal(recordingAttachment({product:'claude-code',agents:[{id,kind:'root'}]}),null);
 assert.equal(recordingAttachment({product:'codex',agents:[{id:'root',kind:'root'}]}),null);
 const attachment=recordingAttachment({product:'codex',agents:[{id:'child',kind:'worker'},{id,kind:'root'}]});
 await f.controller.attach(null);assert.equal(calls.length,0);
 await f.controller.attach(attachment);
 assert.deepEqual(JSON.parse(calls[0].options.body),{attachment:{product:'codex',sessionIds:[id]}});
 f.controller.dispose();
});
test('running unowned app refusal remains an error and does not attempt recovery or poll',async()=>{
 const calls=[];const f=fixture(async(url)=>{calls.push(url);return response({phase:'error',appRunning:true,error:{code:'APP_ALREADY_RUNNING',message:'Quit when ready'}},false);});
 await f.controller.start();
 assert.equal(f.controller.snapshot.status.error.code,'APP_ALREADY_RUNNING');
 assert.equal(calls.length,1);assert.equal(f.scheduled.length,0);
 f.controller.dispose();
});
test('unavailable resolver requires a new explicit check and disposes an in-flight request safely',async()=>{
 const f=fixture(async()=>{throw new Error('network');});
 await f.controller.check();assert.equal(f.controller.snapshot.status.error.code,'RESOLVER_UNREACHABLE');assert.equal(f.scheduled.length,0);
 let complete;const pending=fixture(()=>new Promise(resolve=>{complete=resolve;}));
 const task=pending.controller.check();pending.controller.dispose();const changeCount=pending.changes.length;
 complete(response({phase:'recording'}));await task;
 assert.equal(pending.changes.length,changeCount);assert.equal(pending.scheduled.length,0);
 f.controller.dispose();
});

test('an explicit start exposes starting state immediately while its launch request is pending',async()=>{
 let complete;const f=fixture(()=>new Promise(resolve=>{complete=resolve;}));
 const task=f.controller.start();
 assert.equal(f.controller.snapshot.status.phase,'starting');
 assert.equal(f.controller.snapshot.busy,true);
 complete(response({phase:'recording',flows:0,frames:0}));await task;
 assert.equal(f.controller.snapshot.status.phase,'recording');f.controller.dispose();
});

test('NO_APP_SERVER startup failure keeps Stop available while its proxy still forwards',async()=>{
 const f=fixture(async()=>response({supported:true,phase:'error',forwarding:true,appRunning:true,error:{code:'NO_APP_SERVER',message:'Stop recording before trying again.'}}));
 await f.controller.start();assert.equal(canStopRecording(f.controller.snapshot),true);
 assert.match(recordingNotice(f.controller.snapshot).text,/Stop recording/);f.controller.dispose();
});
test('a network failure after an active recording retains Stop, but busy requests do not enable it',async()=>{
 let count=0;const f=fixture(async()=>{if(!count++)return response({supported:true,phase:'recording',forwarding:false});throw new Error('offline');});
 await f.controller.start();await f.controller.check();
 assert.equal(f.controller.snapshot.status.phase,'error');assert.equal(f.controller.snapshot.active,true);
 assert.equal(canStopRecording(f.controller.snapshot),true);assert.equal(canStopRecording({...f.controller.snapshot,busy:true}),false);
 f.controller.dispose();
});
test('stopped credential and filing errors remain visible and never claim a saved capture',()=>{
 const credential=recordingNotice({status:{phase:'stopped',error:{code:'CREDENTIALS',message:'deleted'}}});
 assert.equal(credential.kind,'warn');assert.match(credential.text,/HAR was deleted/);assert.match(credential.text,/no saved capture/);assert.doesNotMatch(credential.text,/saved capture is frozen/);
 const filing=recordingNotice({status:{phase:'stopped',error:{code:'FILING',message:'failed'}}});
 assert.equal(filing.kind,'warn');assert.match(filing.text,/kept privately/);assert.match(filing.text,/session log locally/);assert.match(filing.text,/explicitly/);assert.doesNotMatch(filing.text,/saved capture is frozen/);
});
test('old helper 404 maps to an unsupported update state with a local helper restart command',async()=>{
 const calls=[];const f=fixture(async(url)=>{calls.push(url);return {...response({error:'Not found'},false),status:404};});
 await f.controller.check();
 assert.equal(f.controller.snapshot.status.supported,false);assert.equal(f.controller.snapshot.status.error.code,'HELPER_UPDATE');
 assert.match(recordingNotice(f.controller.snapshot).text,/npm --prefix site run trace:local/);
 assert.match(recordingNotice(f.controller.snapshot).text,/does not restart the desktop app/);
 assert.equal(canStopRecording(f.controller.snapshot),false);assert.equal(f.scheduled.length,0);assert.equal(calls.length,1);f.controller.dispose();
});
