import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, mkdir, rm, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {createServer, request} from 'node:http';
import {createDesktopRecorder, scopedWrapper, recordingStatus, runDesktopRecording, desktopEnvironment, finalCheckpoint} from '../capture/desktop-capture.mjs';
import {createTraceServer} from '../trace-local.mjs';

test('an already running desktop app is refused before any launch or capture files', async t=>{
 const directory=await mkdtemp(join(tmpdir(),'desktop-refuse-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 let launched=0;
 const recorder=createDesktopRecorder({directory,runtime:{platform:'darwin',inspect:async()=>({main:'/app/ChatGPT',binary:'/app/codex'}),appRunning:async()=>true,launchWorker:()=>launched++}});
 await assert.rejects(recorder.start(),e=>e.code==='APP_RUNNING' && /quit/i.test(e.message));
 assert.equal(launched,0);
 assert.equal((await recorder.status()).appRunning,true);
 await assert.rejects(readFile(join(directory,'active.json')),e=>e.code==='ENOENT');
});

test('wrapper scopes proxy and CA to the desktop app-server and safely quotes paths',()=>{
 const wrapper=scopedWrapper({binary:"/Applications/App's CLI/codex",ca:"/private/run's/ca.pem",receipt:'/private/run/owned.json',proxy:'http://127.0.0.1:1234'});
 assert.match(wrapper,/CODEX_CA_CERTIFICATE=/);
 assert.match(wrapper,/NODE_EXTRA_CA_CERTS=/);
 assert.match(wrapper,/app-server/);
 assert.match(wrapper,/exec /);
 assert.doesNotMatch(wrapper,/NODE_TLS_REJECT_UNAUTHORIZED|ssl_insecure|security add-trusted-cert/);
 assert.match(wrapper,/'"'"'/);
 const original={EXISTING:'keep',HTTPS_PROXY:'existing-proxy'};
 const launch=desktopEnvironment(original,'/private/wrapper');assert.equal(launch.EXISTING,'keep');assert.equal(launch.HTTPS_PROXY,'existing-proxy');
 assert.equal(launch.CODEX_APP_SERVER_FORCE_CLI,'1');assert.equal(launch.CODEX_APP_SERVER_USE_LOCAL_DAEMON,'0');assert.equal(launch.CODEX_CLI_PATH,'/private/wrapper');assert.deepEqual(original,{EXISTING:'keep',HTTPS_PROXY:'existing-proxy'});
});

test('recording status never sends capture paths or commands to the page',()=>{
 const out=recordingStatus({phase:'stopped',forwarding:true,flows:3,frames:8,filed:2,pendingAttachment:true,har:'/private/secret.har',layout:{main:'/private/app'},worker:123,error:{code:'NO_IDS',message:'Choose a session.'}});
 assert.equal(out.phase,'stopped');assert.equal(out.forwarding,true);assert.equal(out.pendingAttachment,true);
 assert.equal(out.flows,3);assert.equal(out.frames,8);assert.equal(out.filed,2);
 assert.equal('har' in out,false);assert.equal('layout' in out,false);assert.equal('worker' in out,false);
});

test('a dead resolver startup lock is recovered without disturbing a live owner',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'desktop-lock-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const lock=join(directory,'start.lock');await mkdir(lock);await writeFile(join(lock,'owner.json'),JSON.stringify({pid:999999,created:Date.now()}));
 let launches=0;
 const runtime={platform:'darwin',inspect:async()=>({main:'/app/ChatGPT'}),appRunning:async()=>false,isAlive:pid=>pid===process.pid,launchWorker:dir=>{launches++;writeFile(join(dir,'status.json'),JSON.stringify({phase:'error',error:{code:'FIXTURE',message:'fixture'}}));return {pid:999998};}};
 const recorder=createDesktopRecorder({directory,runtime,waitMs:1000});
 assert.equal((await recorder.start()).phase,'error');assert.equal(launches,1);
 await mkdir(lock);await writeFile(join(lock,'owner.json'),JSON.stringify({pid:process.pid,created:Date.now()}));
 await assert.rejects(recorder.start(),e=>e.code==='RECORDER_STARTING');assert.equal(launches,1);
});

test('Start rechecks an app that opened while the startup lock was being acquired',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'desktop-start-race-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 let checks=0,launches=0;
 const recorder=createDesktopRecorder({directory,waitMs:1000,runtime:{inspect:async()=>({main:'/app/ChatGPT'}),appRunning:async()=>++checks>1,isAlive:()=>false,launchWorker:dir=>{launches++;writeFile(join(dir,'status.json'),JSON.stringify({phase:'error'}));return {pid:999998};}}});
 await assert.rejects(recorder.start(),e=>e.code==='APP_RUNNING');assert.equal(launches,0);
});

test('final filing requires a completed freeze acknowledgement, including slow checkpoints',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'desktop-checkpoint-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const file=join(dir,'status.json');await writeFile(file,'{"recording":true}');
 assert.equal(await finalCheckpoint(file,{timeoutMs:30,tickMs:5}),null,'an earlier recording snapshot is never accepted');
 const complete=setTimeout(()=>writeFile(file,'{"recording":false,"flows":3,"checkpoints":9}'),80);t.after(()=>clearTimeout(complete));
 const final=await finalCheckpoint(file,{timeoutMs:500,tickMs:5});assert.equal(final.recording,false);assert.equal(final.checkpoints,9);
});

test('stop requests a final checkpoint without terminating the app or proxy',async t=>{
 const directory=await mkdtemp(join(tmpdir(),'desktop-stop-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const run='run-111111111111111111111111';await mkdir(join(directory,run));
 await writeFile(join(directory,'active.json'),JSON.stringify({run}));
 await writeFile(join(directory,run,'status.json'),JSON.stringify({phase:'recording',worker:42,forwarding:true}));
 let killed=0;
 const recorder=createDesktopRecorder({directory,runtime:{platform:'darwin',inspect:async()=>({main:'/app/ChatGPT'}),appRunning:async()=>true,isAlive:()=>true,kill:()=>killed++},waitMs:1000});
 const pause=setInterval(async()=>{
  try{const control=JSON.parse(await readFile(join(directory,run,'control.json')));if(!control.recording){await writeFile(join(directory,run,'status.json'),JSON.stringify({phase:'stopped',worker:42,forwarding:true,flows:5,filed:1,controlRequest:control.request}));clearInterval(pause);}}catch{}
 },10);t.after(()=>clearInterval(pause));
 const status=await recorder.stop();assert.equal(status.phase,'stopped');assert.equal(status.forwarding,true);assert.equal(killed,0);
});

test('recording endpoints share resolver origin, header and body guards',async t=>{
 let started=0,stopped=0;
 const recorder={status:async()=>({phase:'idle'}),start:async()=>{started++;return {phase:'recording'};},stop:async opts=>{stopped++;return {phase:'stopped',attachment:opts?.attachment};}};
 const server=createTraceServer({roots:{},recorder});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const call=(path,method='GET',body,origin=base,header=true)=>fetch(base+path,{method,headers:{Origin:origin,...header?{'X-Trace-Request':'1'}:{},'Content-Type':'application/json'},body:body&&JSON.stringify(body)});
 assert.equal((await call('/v1/recording/status')).status,200);
 assert.equal((await call('/v1/recording/start','POST',{},'https://evil.example')).status,403);
 assert.equal((await call('/v1/recording/start','POST',{},base,false)).status,403);
 assert.equal((await call('/v1/recording/start','POST',{appPath:'/arbitrary'})).status,400);
 assert.equal(started,0);
 assert.equal((await call('/v1/recording/start','POST',{})).status,200);assert.equal(started,1);
 assert.equal((await call('/v1/recording/stop','POST',{})).status,200);assert.equal(stopped,1);
 assert.equal((await call('/v1/recording/stop','POST',{attachment:{product:'codex',sessionIds:['invalid']}})).status,400);
 assert.equal(stopped,1);
});

const hasMitmproxy=spawnSync('mitmdump',['--version'],{stdio:'ignore'}).status===0;
for(const explicitStop of [true,false])test(explicitStop?'a recorded test process keeps forwarding after Stop and removes its scoped CA only after natural exit':'natural exit after a transient monitor failure still checks and files the recording',{skip:!hasMitmproxy},async t=>{
 // This is a harmless local fixture, not the installed desktop app. It proves
 // lifecycle isolation; real desktop UI capture remains a separate acceptance check.
 const dir=await mkdtemp(join(tmpdir(),'desktop-lifecycle-'));
 const marker=join(dir,'app-running'),quit=join(dir,'quit'),main=join(dir,'fixture-app'),binary=join(dir,'fixture-cli');
 await writeFile(main,'#!/bin/sh\nexec "$CODEX_CLI_PATH" app-server\n',{mode:0o700});
 await writeFile(binary,`#!/bin/sh\ntouch '${marker}'\nwhile [ ! -f '${quit}' ]; do sleep 0.1; done\nrm '${marker}'\n`,{mode:0o700});
 const session='11111111-2222-4333-8444-555555555555',sessions=join(dir,'sessions');await mkdir(sessions);
 await writeFile(join(sessions,`rollout-test-${session}.jsonl`),JSON.stringify({type:'session_meta',payload:{id:session}})+'\n');
 await writeFile(join(dir,'config.json'),JSON.stringify({layout:{main,binary},roots:{codex:sessions}}));await writeFile(join(dir,'control.json'),'{"recording":true}');
 let proxy,app,proxyURL,proxyKills=0,failMonitor=false;
 const runtime={isAlive:pid=>{try{process.kill(pid,0);return true;}catch{return false;}},appRunning:async()=>{if(failMonitor){failMonitor=false;throw new Error('transient process-list failure');}return !!app&&app.exitCode===null;},spawn:(command,args,options)=>{
  const child=spawn(command,args,options);if(command==='mitmdump'){proxy=child;proxyURL='http://127.0.0.1:'+args[args.indexOf('--listen-port')+1];const kill=child.kill.bind(child);child.kill=(signal)=>{proxyKills++;return kill(signal);};}else app=child;return child;
 }};
 const job=runDesktopRecording(dir,{runtime,tickMs:50,startupMs:10000});
 job.catch(()=>{});
 t.after(async()=>{await writeFile(quit,'');if(app)await new Promise(r=>{if(app.exitCode!==null)return r();app.once('exit',r);setTimeout(r,1000).unref();});if(proxy&&proxy.exitCode===null)proxy.kill('SIGINT');await job;await rm(dir,{recursive:true,force:true});});
 async function stateWhen(predicate){const end=Date.now()+15000;while(Date.now()<end){try{const state=JSON.parse(await readFile(join(dir,'status.json')));if(state.phase==='error'&&state.error?.code!=='MONITOR_RETRY')throw new Error(state.error.message);if(predicate(state))return state;}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError))throw e;}await new Promise(r=>setTimeout(r,50));}throw new Error('fixture recorder timed out');}
 await stateWhen(s=>s.phase==='recording');
 failMonitor=true;await new Promise(r=>setTimeout(r,150));assert.equal(proxyKills,0,'a transient process-list failure must never tear down an active proxy');
 const upstream=createServer((req,res)=>{res.end('forwarded after stop');});await new Promise(r=>upstream.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{upstream.closeAllConnections();upstream.close(r);}));
 const forward=()=>new Promise((resolve,reject)=>{
  const req=request(proxyURL,{path:`http://127.0.0.1:${upstream.address().port}/fixture`,headers:{Host:`127.0.0.1:${upstream.address().port}`,originator:'fixture','thread-id':session}},res=>{let body='';res.on('data',x=>body+=x);res.on('end',()=>resolve(body));});req.on('error',reject);req.end();
 });
 await forward();
 if(!explicitStop){await writeFile(quit,'');const ended=await job;assert.equal(ended.phase,'stopped');assert.equal(ended.filed,1);assert.equal(ended.forwarding,false);assert.ok((await readdir(sessions)).some(name=>name.endsWith('.har')));return;}
 await writeFile(join(dir,'control.json'),'{"recording":false,"request":"test-stop"}');
 const stopped=await stateWhen(s=>s.phase==='stopped');assert.equal(stopped.forwarding,true);assert.equal(proxyKills,0);
 const frozen=await readFile(join(dir,'capture.har'),'utf8');
 assert.equal(await forward(),'forwarded after stop');assert.equal(await readFile(join(dir,'capture.har'),'utf8'),frozen);assert.equal(proxyKills,0);
 await writeFile(quit,'');const ended=await job;assert.equal(ended.forwarding,false);assert.equal(proxyKills,1);
 await assert.rejects(readFile(join(dir,'authority','mitmproxy-ca-cert.pem')),e=>e.code==='ENOENT');
});
