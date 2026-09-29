// The optional resolver reads session files on this same machine. The browser
// receives byte ranges only from the requested family; no file paths go to a server.
const BASE = 'http://127.0.0.1:8766';
const headers = {'X-Trace-Request':'1'};

export async function openLocalSession(id, {fetcher=fetch,base=BASE}={}) {
  let health;
  try {health=await fetcher(base+'/health',{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(800)});}
  catch {return null;}
  if(!health.ok)return null;
  try {if((await health.json()).service!=='trace-local')return null;}catch{return null;}
  const result=await fetcher(base+'/v1/session',{method:'POST',credentials:'omit',redirect:'error',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({id,captures:true})});
  if(!result.ok){const error=await result.json().catch(()=>({}));throw new Error(error.error||'Could not open the local session');}
  const manifest=await result.json();
  return manifest.files.map(file=>{
    const url=new URL(file.url,base);
    if(url.origin!==new URL(base).origin || !url.pathname.startsWith('/v1/file/'))throw new Error('Invalid local session file');
    return {path:file.path,local:{path:file.path,size:file.size,url:url.href}};
  });
}

// Every local source of a session (tools/sources on the resolver): the report, and one source's content.
// null when no resolver answers, so the page can say how to start it.
export async function localSources(id,{fetcher=fetch,base=BASE}={}){
  let health;
  try {health=await fetcher(base+'/health',{credentials:'omit',redirect:'error',signal:AbortSignal.timeout(800)});}
  catch {return null;}
  if(!health.ok)return null;
  try {if((await health.json()).service!=='trace-local')return null;}catch{return null;}
  const result=await fetcher(base+'/v1/sources',{method:'POST',credentials:'omit',redirect:'error',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({id})});
  if(!result.ok){const error=await result.json().catch(()=>({}));throw new Error(error.error||'Could not read the local sources');}
  return result.json();
}
export async function localSource(id,source,{offset=0,part=null}={},{fetcher=fetch,base=BASE}={}){
  const result=await fetcher(base+'/v1/source',{method:'POST',credentials:'omit',redirect:'error',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({id,source,offset,part})});
  if(!result.ok){const error=await result.json().catch(()=>({}));throw new Error(error.error||'Could not read that source');}
  return result.json();
}

export function localFileSource(file,fetcher=fetch){
  const url=new URL(file.url);
  if(url.protocol!=='http:' || url.hostname!=='127.0.0.1' || !url.pathname.startsWith('/v1/file/'))throw new Error('Session source must use loopback');
  return {name:file.path,size:file.size,async slice(a,b){
    if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<0||b<a||b>file.size)throw new Error('Invalid byte range');
    const bytes=new Uint8Array(b-a);
    for(let start=a;start<b;start+=8*1024*1024){
      const end=Math.min(b,start+8*1024*1024);const part=new URL(url);part.searchParams.set('start',start);part.searchParams.set('end',end);
      const res=await fetcher(part.href,{headers,credentials:'omit',redirect:'error'});
      if(!res.ok)throw new Error('Could not read the local session; reopen it');
      const data=new Uint8Array(await res.arrayBuffer());
      if(data.length!==end-start)throw new Error('Session file changed; reopen it');
      bytes.set(data,start-a);
    }
    return bytes;
  }};
}
