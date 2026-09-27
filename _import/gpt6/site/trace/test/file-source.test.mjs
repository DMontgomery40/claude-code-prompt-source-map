import {test} from 'node:test';
import assert from 'node:assert/strict';
import {capturePickedFiles, fileSource} from '../file-source.js';
import {findSessions} from '../loader.js';

const changed=()=>new DOMException('file changed','NotReadableError');
const stale={name:'active.jsonl',size:5,slice(){return {arrayBuffer:async()=>{throw changed();}}},arrayBuffer:async()=>{throw changed();}};

test('picked files are copied before asynchronous setup and remain readable after the disk file changes', async()=>{
 let available=true;
 const file={name:'active.jsonl',size:5,async arrayBuffer(){if(!available)throw changed();return new TextEncoder().encode('hello').buffer;}};
 const pending=capturePickedFiles([{path:file.name,file}],null);
 available=false;
 const [entry]=await pending;
 assert.equal(await entry.file.text(),'hello');
 assert.equal(entry.path,'active.jsonl');
});

test('folder capture touches the hinted root only, preserving handles and unrelated entries',async()=>{
 const a={path:'sessions/root-id.jsonl',file:new Blob(['root'])};
 const other={path:'sessions/other.jsonl',file:stale};
 const handled={path:'sessions/root-id-child.jsonl',file:stale,handle:{getFile(){throw Error('read too soon')}}};
 const got=await capturePickedFiles([a,other,handled],'root-id');
 assert.equal(await got[0].file.text(),'root');assert.equal(got[1],other);assert.equal(got[2],handled);
});

test('a directory handle refreshes a stale File, retries bounded reads, and freezes the selected prefix for drill-down',async()=>{
 let calls=0,content='hello';
 const src=fileSource(stale,{async getFile(){calls++;return calls===1?stale:new Blob([content]);}});
 await src.snapshot();
 content='changed and appended';
 assert.equal(new TextDecoder().decode(await src.slice(0,5)),'hello');
 assert.equal(calls,2);
 const denied=fileSource(stale,{getFile:async()=>stale});
 await assert.rejects(denied.snapshot(),/could not be read/i);
});

test('unreadable logs report the real I/O failure, while malformed JSON remains an unrecognized file',async()=>{
 for(const name of ['NotReadableError','NotFoundError','SecurityError']){
  await assert.rejects(findSessions([{path:'active.jsonl',source:{size:5,async slice(){throw new DOMException('unavailable',name);}}}]),e=>e.name===name);
 }
 const bytes=new TextEncoder().encode('not json\n');
 assert.deepEqual(await findSessions([{path:'bad.jsonl',source:{size:bytes.length,async slice(a,b){return bytes.slice(a,b);}}}]),[]);
});

// An unhinted load (drag and drop, the file and folder pickers) of a folder where one transcript is being
// written: that file cannot be read, and must not stop the other sessions from loading.
test('an unhinted load skips an unreadable or non-JSON file with a note and loads the readable session',async()=>{
 const {loadTrace}=await import('../loader.js');
 const {entriesFor}=await import('../dump.mjs');
 const {fileURLToPath}=await import('node:url');
 const FIX=fileURLToPath(new URL('./fixtures/',import.meta.url));
 const junk=new TextEncoder().encode('not json\n');
 for(const sub of ['claude','codex']){
  const entries=await entriesFor([FIX+sub]);
  try{
   const busy={path:`${sub}/busy/active.jsonl`,source:{size:5,async slice(){throw new Error('active.jsonl could not be read.',{cause:changed()});}}};
   const bad={path:`${sub}/busy/notes.jsonl`,source:{size:junk.length,async slice(a,b){return junk.slice(a,b);}}};
   const {trace}=await loadTrace([busy,...entries,bad]);
   assert.ok(trace.agents.length>0,`${sub}: the readable session loads`);
   assert.equal(trace.candidates.length,1,`${sub}: one candidate`);
   assert.ok(trace.notes.includes(`${sub}/busy/active.jsonl: could not be read (NotReadableError), skipped`),`${sub}: ${JSON.stringify(trace.notes)}`);
   assert.ok(trace.notes.includes(`${sub}/busy/notes.jsonl: its first line is not JSON, skipped`));
  }finally{await Promise.all(entries.map(e=>e.source.close()));}
 }
 // Alone, the unreadable file is the reason nothing loads: its own error, not "no transcript found".
 await assert.rejects(loadTrace([{path:'active.jsonl',source:{size:5,async slice(){throw new Error('active.jsonl could not be read.',{cause:changed()});}}}]),/active\.jsonl could not be read/);
});

test('an unreadable direct pick is left for the loader to skip unless the hint names it',async()=>{
 const good={path:'good.jsonl',file:new Blob(['{}'])},busy={path:'active.jsonl',file:stale};
 const got=await capturePickedFiles([good,busy],null);
 assert.equal(got[0].frozen,true);
 assert.equal(got[1],busy,'left unfrozen, not a rejected load');
 assert.equal((await capturePickedFiles([good,busy],'root-id'))[1],busy,'a hint that names another file');
 await assert.rejects(capturePickedFiles([{path:'root-id.jsonl',file:stale}],'root-id'),/could not be read/,'the hinted file itself must read');
});
