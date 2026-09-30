// Public examples are immutable scrubbed source logs, parsed by the normal worker.
// No loopback discovery, account access, or normalized/synthetic Trace data is used.
export const EXAMPLE_ID = 'source-map-development';
const ASSET_LIMIT = 25 * 1024 * 1024;
const TOTAL_LIMIT = 768 * 1024 * 1024;
export function validateExample(manifest, manifestUrl) {
  if(manifest?.schemaVersion!==1 || manifest.id!==EXAMPLE_ID || !manifest.title || !manifest.privacyStatement || !manifest.rootSessionId || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error('The example manifest is incomplete. Try again after the site finishes updating.');
  if(!Number.isInteger(manifest.counts?.agents) || manifest.counts.agents<1 || !Number.isInteger(manifest.counts?.subagents) || manifest.counts.subagents<0 || !Number.isInteger(manifest.counts?.requests) || manifest.counts.requests<1) throw new Error('The example is missing its recorded session counts.');
  const base=new URL(manifestUrl), seen=new Set();let total=0;
  for(const file of manifest.files){
    const parts=file.parts || [file];
    if(!/\.(jsonl|json)$/.test(file.path) || file.path.startsWith('/') || file.path.split('/').includes('..') || seen.has(file.path) || !Array.isArray(parts) || !parts.length) throw new Error('The example contains an invalid source file.');
    if(!Number.isInteger(file.bytes) || file.bytes<1 || !Number.isInteger(file.uncompressedBytes) || file.uncompressedBytes<1 || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('The example source size or checksum is missing.');
    let compressed=0;
    for(const part of parts){
      const url=new URL(part.url,base);
      if(url.origin!==base.origin || !url.pathname.startsWith(base.pathname.slice(0,base.pathname.lastIndexOf('/')+1)) || !/\.(jsonl|json)\.gz(?:\.part-\d+)?$/.test(url.pathname)) throw new Error('The example contains an invalid source download.');
      if(!Number.isInteger(part.bytes) || part.bytes<1 || part.bytes>=ASSET_LIMIT || !/^[a-f0-9]{64}$/.test(part.sha256)) throw new Error('The example source size or checksum is missing.');
      compressed+=part.bytes;
    }
    if(compressed!==file.bytes || compressed>TOTAL_LIMIT) throw new Error('The example source parts are incomplete or too large.');
    seen.add(file.path);total+=file.uncompressedBytes;
  }
  if(total>TOTAL_LIMIT) throw new Error('This example is too large to open safely in this browser.');
  return manifest;
}
export async function loadPublicExample({id=EXAMPLE_ID,base=new URL('./examples/',import.meta.url),fetcher=fetch,onProgress=()=>{},signal}={}){
  if(id!==EXAMPLE_ID) throw new Error('That example is not available. Choose Open a real example, or open your own session.');
  const manifestUrl=new URL(`${id}/manifest.json`,base);
  const options={credentials:'omit',redirect:'error',signal};
  onProgress(0,'Reading the public example manifest…');
  const response=await fetcher(manifestUrl,options);
  if(!response.ok) throw new Error('The public example could not be downloaded. Check your connection and try again, or open your own session.');
  const manifest=validateExample(await response.json(),manifestUrl);
  if(typeof DecompressionStream==='undefined') throw new Error('This browser cannot decompress the example. Use a current browser, or open your own session files.');
  const files=new Array(manifest.files.length), pool=new AbortController();
  const abort=()=>pool.abort(signal.reason);
  if(signal?.aborted) abort();
  else signal?.addEventListener('abort',abort,{once:true});
  let next=0,completed=0,failure=null;
  const poolOptions={...options,signal:pool.signal};
  const checkAbort=()=>{if(pool.signal.aborted)throw pool.signal.reason || new DOMException('Example loading cancelled.','AbortError');};
  onProgress(0,`Loading sources: 0 of ${manifest.files.length} complete…`);
  async function readSource(index){
    checkAbort();const source=manifest.files[index];
    const parts=[];
    const checksum=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
    for(const part of source.parts || [source]){
      const result=await fetcher(new URL(part.url,manifestUrl),poolOptions);
      if(!result.ok) throw new Error('An example source could not be downloaded. Check your connection and try again.');
      const partBytes=await result.arrayBuffer();
      if(partBytes.byteLength!==part.bytes) throw new Error('The example download is incomplete. Try again.');
      if(await checksum(partBytes)!==part.sha256) throw new Error('The example source checksum did not match. Try again after the site finishes updating.');
      parts.push(partBytes);
    }
    const bytes=parts.length===1?parts[0]:await new Blob(parts).arrayBuffer();
    if(bytes.byteLength!==source.bytes || await checksum(bytes)!==source.sha256) throw new Error('The example source checksum did not match. Try again after the site finishes updating.');
    checkAbort();
    const blob=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'),{signal:pool.signal})).blob();
    if(blob.size!==source.uncompressedBytes) throw new Error('The example source is incomplete after decompression. Try again.');
    checkAbort();
    files[index]={path:source.path,file:blob,frozen:true,publicExample:true};
    completed++;
    onProgress(completed/manifest.files.length,`Loading sources: ${completed} of ${manifest.files.length} complete…`);
  }
  async function consume(){
    while(next<manifest.files.length){
      checkAbort();const index=next++;
      try{await readSource(index);}
      catch(error){failure ||= error;pool.abort(failure);throw failure;}
    }
  }
  try{await Promise.all(Array.from({length:Math.min(4,manifest.files.length)},consume));}
  finally{signal?.removeEventListener('abort',abort);}
  return {manifest,files};
}

// A superseded parse must never resolve another load's pending worker promise.
export function createLoadOwnership(){
  let generation=0,cancel=null;
  return {
    begin(){cancel?.();cancel=null;const id=++generation;return {current:()=>id===generation,onCancel:fn=>{if(id===generation)cancel=fn;else fn();},finish:()=>{if(id===generation)cancel=null;}};},
    cancel(){cancel?.();cancel=null;generation++;}
  };
}
