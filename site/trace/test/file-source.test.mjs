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
