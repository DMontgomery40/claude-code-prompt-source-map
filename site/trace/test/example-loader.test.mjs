import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {autoHealthAllowed} from '../help/help.js';
import {EXAMPLE_ID,loadPublicExample,validateExample,createLoadOwnership} from '../example-loader.js';
const url=`https://example.test/trace/examples/${EXAMPLE_ID}/manifest.json`;
function fixture(){
 const raw=Buffer.from('{"type":"session_meta","payload":{"id":"published-id"}}\n');
 const gzip=gzipSync(raw);
 const manifest={schemaVersion:1,id:EXAMPLE_ID,title:'Recorded development',privacyStatement:'Scrubbed for publication.',rootSessionId:'published-id',counts:{agents:2,subagents:1,requests:3},files:[{url:'source.jsonl.gz',path:'root.jsonl',bytes:gzip.length,uncompressedBytes:raw.length,sha256:createHash('sha256').update(gzip).digest('hex')}]};
 return {manifest,raw,gzip};
}
test('public source downloads decompress to normal frozen files without any local or credential access',async()=>{
 const {manifest,raw,gzip}=fixture(),calls=[],progress=[];
 const {files}=await loadPublicExample({base:new URL('https://example.test/trace/examples/'),fetcher:async(url,options)=>{calls.push({url:String(url),options});return String(url).endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>gzip.buffer.slice(gzip.byteOffset,gzip.byteOffset+gzip.length)};},onProgress:(...value)=>progress.push(value)});
 assert.equal(files.length,1);assert.equal(files[0].path,'root.jsonl');assert.equal(await files[0].file.text(),raw.toString());assert.equal(files[0].frozen,true);assert.equal(files[0].publicExample,true);
 assert.equal(calls.length,2);assert.ok(calls.every(call=>new URL(call.url).origin==='https://example.test' && call.options.credentials==='omit' && call.options.redirect==='error'));assert.ok(progress.length>=3);
});
test('unknown share IDs never fetch and download errors offer an actionable own-session fallback',async()=>{
 let calls=0;await assert.rejects(loadPublicExample({id:'elsewhere',fetcher:()=>calls++}),/open your own session/);assert.equal(calls,0);
 await assert.rejects(loadPublicExample({fetcher:async()=>({ok:false})}),/Check your connection.*open your own session/);
});
test('manifests reject off-origin downloads, traversal, oversized files and missing actual counts',()=>{
 for(const change of [m=>m.files[0].url='https://other.test/source.jsonl.gz',m=>m.files[0].path='../secret.jsonl',m=>m.files[0].bytes=25*1024*1024,m=>delete m.counts]){
  const {manifest}=fixture();change(manifest);assert.throws(()=>validateExample(manifest,url));
 }
});
test('incomplete or changed immutable sources fail instead of reaching the session loader',async()=>{
 const {manifest,gzip}=fixture();manifest.files[0].sha256='0'.repeat(64);
 await assert.rejects(loadPublicExample({fetcher:async url=>String(url).endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>gzip.buffer.slice(gzip.byteOffset,gzip.byteOffset+gzip.length)}}),/checksum did not match/);
});

test('public examples suppress automatic Help loopback health while own-session defaults stay intact',()=>{
 assert.equal(autoHealthAllowed('http://127.0.0.1:8766',{autoHealth:()=>false}),false);
 assert.equal(autoHealthAllowed('http://127.0.0.1:8766'),true);
 assert.equal(autoHealthAllowed('https://example.test'),false);
});
test('multipart gzip reconstructs one exact root file and rejects reordered parts',async()=>{
 const {manifest,gzip,raw}=fixture();const cut=Math.floor(gzip.length/2),chunks=[gzip.subarray(0,cut),gzip.subarray(cut)];
 const source=manifest.files[0];delete source.url;
 source.parts=chunks.map((bytes,index)=>({url:`root.jsonl.gz.part-${index+1}`,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}));
 const fetcher=async url=>String(url).endsWith('manifest.json')?{ok:true,json:async()=>manifest}:{ok:true,arrayBuffer:async()=>{const index=Number(String(url).split('-').pop())-1;const bytes=chunks[index];return bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length);}};
 const {files}=await loadPublicExample({fetcher});assert.equal(files.length,1);assert.equal(await files[0].file.text(),raw.toString());
 source.parts.reverse();await assert.rejects(loadPublicExample({fetcher}),/checksum did not match/);
});
test('four bounded downloads complete out of order but retain manifest order and completed progress',async()=>{
 const {manifest,gzip}=fixture();manifest.files=Array.from({length:7},(_,index)=>({...manifest.files[0],url:`source-${index}.jsonl.gz`,path:`source-${index}.jsonl`}));
 let active=0,maximum=0;const finished=[],progress=[];
 const {files}=await loadPublicExample({fetcher:async url=>{
  if(String(url).endsWith('manifest.json'))return {ok:true,json:async()=>manifest};
  const index=Number(/source-(\d+)/.exec(String(url))[1]);active++;maximum=Math.max(maximum,active);
  return {ok:true,arrayBuffer:async()=>{await new Promise(resolve=>setTimeout(resolve,index===0?25:2));active--;finished.push(index);return gzip.buffer.slice(gzip.byteOffset,gzip.byteOffset+gzip.length);}};
 },onProgress:(fraction,message)=>{if(message.startsWith('Loading sources:'))progress.push(fraction);}});
 assert.equal(maximum,4);assert.notEqual(finished[0],0);assert.deepEqual(files.map(file=>file.path),manifest.files.map(file=>file.path));
 assert.deepEqual(progress,Array.from({length:8},(_,index)=>index/7));
});
test('cancellation aborts in-flight example downloads and starts no queued sources',async()=>{
 const {manifest}=fixture();manifest.files=Array.from({length:7},(_,index)=>({...manifest.files[0],url:`source-${index}.jsonl.gz`,path:`source-${index}.jsonl`}));
 const controller=new AbortController();let started=0,aborted=0;let allStarted;
 const ready=new Promise(resolve=>allStarted=resolve);
 const loading=loadPublicExample({signal:controller.signal,fetcher:async(url,options)=>{
  if(String(url).endsWith('manifest.json'))return {ok:true,json:async()=>manifest};
  started++;if(started===4)allStarted();
  return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted++;reject(options.signal.reason);},{once:true}));
 }});
 await ready;controller.abort(new DOMException('Cancelled','AbortError'));
 await assert.rejects(loading,error=>error.name==='AbortError');assert.equal(started,4);assert.equal(aborted,4);
});

test('choosing own files cancels an awaiting example parse and rejects its late UI continuation',async()=>{
 const loads=createLoadOwnership(),example=loads.begin();let rejectParse,finishOwn;const shown=[];
 const parse=new Promise((resolve,reject)=>rejectParse=reject);
 example.onCancel(()=>rejectParse(new DOMException('Superseded','AbortError')));
 const exampleResult=parse.then(trace=>{if(example.current())shown.push('example:'+trace);}).catch(error=>{assert.equal(error.name,'AbortError');});
 const own=loads.begin();const ownParse=new Promise(resolve=>finishOwn=resolve);
 const ownResult=ownParse.then(trace=>{if(own.current())shown.push('own:'+trace);own.finish();});
 assert.equal(example.current(),false);finishOwn('selected-session');await Promise.all([exampleResult,ownResult]);
 // A queued message/continuation from the cancelled parser cannot label the own session.
 if(example.current())shown.push('late example');assert.deepEqual(shown,['own:selected-session']);
});
test('supersession before a parse registers cancellation cannot start stale worker work',()=>{
 const loads=createLoadOwnership(),example=loads.begin(),own=loads.begin();let cancelled=0;
 example.onCancel(()=>cancelled++);assert.equal(cancelled,1);assert.equal(example.current(),false);assert.equal(own.current(),true);
 example.finish();own.onCancel(()=>cancelled++);loads.cancel();assert.equal(cancelled,2);assert.equal(own.current(),false);
});
