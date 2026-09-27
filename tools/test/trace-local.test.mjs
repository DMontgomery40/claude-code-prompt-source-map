import {test} from 'node:test';
import {request} from 'node:http';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, rm, symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createTraceServer} from '../trace-local.mjs';
import {codexFiles, claudeFiles, CODEX, CC} from '../../site/trace/test/fixtures/make.mjs';
const origin='https://gpt6aeon.dtmont.com';

test('local resolver opens only the requested family, refreshes new files, and rejects outside origins and paths', async t=>{
 const dir=await mkdtemp(join(tmpdir(),'trace-local-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const roots={codex:join(dir,'codex'), 'claude-code':join(dir,'claude')};
 for(const [kind,build] of [['codex',codexFiles],['claude-code',claudeFiles]]){
  await mkdir(roots[kind],{recursive:true});
  for(const [path,body] of Object.entries(build())){const dest=join(roots[kind],path);await mkdir(join(dest,'..'),{recursive:true});await writeFile(dest,body);}
 }
 const server=createTraceServer({roots});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const call=(path,body,from=origin)=>fetch(base+path,{method:body?'POST':'GET',headers:{Origin:from,'X-Trace-Request':'1',...(body?{'Content-Type':'application/json'}:{})},body:body&&JSON.stringify(body)});
 for(const [id,n] of [[CODEX.root,3],[CC.session,4]]){
  const res=await call('/v1/session',{id});assert.equal(res.status,200);const manifest=await res.json();assert.equal(manifest.files.length,n);
  const file=manifest.files[0];const part=await call(file.url+'?start=0&end=16');assert.equal(part.status,200);assert.equal((await part.arrayBuffer()).byteLength,16);
  assert.equal((await call(file.url+'?start=-1&end=16')).status,400);
  assert.equal(await new Promise((resolve,reject)=>{
   const req=request(base+file.url+'?start=0&end=16',{headers:{Origin:origin,'X-Trace-Request':'1',Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});
   req.on('error',reject);req.end();
  }),403);
  assert.equal((await call(file.url+'?start=0&end=16',null,'https://evil.example')).status,403);
 }
 assert.equal((await call('/v1/session',{id:CODEX.root},'https://gpt6aeon.dtmont.com.evil.example')).status,403);
 assert.equal((await call('/v1/session',{id:'../../secret'})).status,400);
 assert.equal((await fetch(base+'/v1/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({id:CODEX.root})})).status,403);
 assert.equal((await call('/v1/file/not-a-token?start=0&end=2')).status,404);
 const id='11111111-2222-4333-8444-555555555555';
 const external=join(dir,id+'.jsonl');await writeFile(external,'secret');await symlink(external,join(roots['claude-code'],id+'.jsonl'));
 assert.equal((await call('/v1/session',{id})).status,404);
 // Sessions created after server startup must be discoverable, not stale cached File blobs.
 const fresh='22222222-2222-4333-8444-555555555555';
 await writeFile(join(roots['claude-code'],fresh+'.jsonl'),JSON.stringify({type:'user',sessionId:fresh,message:{role:'user',content:'new'}})+'\n');
 assert.equal((await call('/v1/session',{id:fresh})).status,200);
 const preflight=await fetch(base+'/v1/session',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'x-trace-request,content-type'}});
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),origin);
});

test('resolver manifest goes through the actual worker without File objects or a picker', async t=>{
 const {openLocalSession}=await import('../../site/trace/local-session.js');
 const dir=await mkdtemp(join(tmpdir(),'trace-worker-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 for(const [path,body] of Object.entries(codexFiles())){const dest=join(dir,path);await mkdir(join(dest,'..'),{recursive:true});await writeFile(dest,body);}
 const server=createTraceServer({roots:{codex:dir}});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
 const base='http://127.0.0.1:'+server.address().port;
 const originalFetch=globalThis.fetch;
 // Node has no browser Origin header; supply exactly the header the browser sends.
 globalThis.fetch=(url,options={})=>originalFetch(url,{...options,headers:{...options.headers,Origin:origin}});
 t.after(()=>{globalThis.fetch=originalFetch;delete globalThis.self;});
 const files=await openLocalSession(CODEX.root,{base});
 const messages=[];globalThis.self={postMessage:m=>messages.push(m)};
 await import('../../site/trace/worker.js');
 await self.onmessage({data:{type:'load',files,root:CODEX.root}});
 assert.deepEqual(messages.filter(m=>m.type==='error'),[]);
 const trace=messages.find(m=>m.type==='trace')?.trace;
 assert.equal(trace.agents.length,3);assert.equal(trace.agents[1].parentId,CODEX.root);
 const ref=trace.agents[0].blocks[0].ref;
 await self.onmessage({data:{type:'text',id:'read',ref}});
 assert.ok(messages.find(m=>m.id==='read'&&m.type==='text')?.text);
});
