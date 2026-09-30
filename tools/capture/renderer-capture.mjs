// Optional Electron renderer observation. Activation requires explicit temporary
// debugger access. No UI input/navigation, storage reads, or certificate changes.
import {createHash,randomBytes} from 'node:crypto';
import {writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {findSecrets,harSecrets} from './check-har.mjs';

const MARK='<redacted by trace-capture: renderer credential>';
const secret=/^(authorization|proxy-authorization|cookie|set-cookie|.*token.*|.*secret.*|password|code_verifier|.*api[-_]?key.*|chatgpt-account-id|openai-organization|openai-project)$/i;
const media=/^(sdp|audio|audio_data|audioData|video|encoded_audio|pcm)$/i;
function scrubString(value){return value.replace(/\bBearer\s+(?!<redacted)[A-Za-z0-9._~+/=-]+/gi,`Bearer ${MARK}`).replace(/\beyJ[A-Za-z0-9_-]{6,}\.eyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]+/g,MARK).replace(/\b(?:sk-(?:ant-|proj-)?[A-Za-z0-9_-]{8,}|npm_[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,})/g,MARK);}
export function sanitizeRecord(value){
 function walk(v,key='',depth=0){
  if(depth>30)return '<withheld: depth>';
  if(secret.test(key))return MARK;
  if(media.test(key))return '<withheld: media or SDP>';
  if(Array.isArray(v))return v.slice(0,10000).map(x=>walk(x,'',depth+1));
  if(v&&typeof v==='object'){
   if(typeof v.name==='string'&&typeof v.value==='string'&&secret.test(v.name))return {...v,value:MARK};
   const out={};for(const [k,x] of Object.entries(v))out[k]=walk(x,k,depth+1);return out;
  }
  if(typeof v!=='string')return v;
  if(v.length>2_000_000)return '<withheld: oversized payload>';
  if(key==='url'||key==='redirectURL')try{const u=new URL(v);for(const k of [...u.searchParams.keys()])if(secret.test(k)||/^(code|sig|signature|auth)$/i.test(k))u.searchParams.set(k,MARK);return scrubString(u.href);}catch{}
  if(v.startsWith('{')||v.startsWith('['))try{return JSON.stringify(walk(JSON.parse(v),'',depth+1));}catch{return '<withheld: undecodable JSON>';} 
  return scrubString(v);
 }
 const clean=walk(value);
 if(findSecrets(JSON.stringify(clean)).length)throw new Error('Renderer credential guard rejected a record');
 return clean;
}

// Self-contained function installed only in the explicitly approved app renderer.
export function installVoiceObserver(binding){
 const g=globalThis,key='__traceVoiceObserver';
 if(g[key]?.active)return;
 const Native=g.RTCPeerConnection;if(typeof Native!=='function')return;
 let serial=0;const dispose=[],state={active:true};
 const emit=(record)=>{if(!state.active)return;try{g[binding](JSON.stringify({version:1,time:Date.now(),...record}));}catch{}};
 const listen=(target,type,fn)=>{target.addEventListener(type,fn);dispose.push(()=>target.removeEventListener(type,fn));};
 const patch=(target,key,fn)=>{const original=target[key];target[key]=fn(original);const replacement=target[key];dispose.push(()=>{if(target[key]===replacement)target[key]=original;});};
 const channel=(dc,peerId)=>{
  emit({kind:'channel',peerId});
  const data=(direction,value)=>{if(typeof value==='string')emit({kind:'datachannel',peerId,direction,data:value});else emit({kind:'datachannel',peerId,direction,binary:true,bytes:value?.byteLength??value?.size??null});};
  patch(dc,'send',original=>function(value){const result=original.call(this,value);data('send',value);return result;});
  listen(dc,'message',event=>data('receive',event.data));
 };
 const Wrapped=new Proxy(Native,{construct(target,args,newTarget){
  const pc=Reflect.construct(target,args,newTarget),peerId=`peer-${++serial}`;emit({kind:'peer',peerId});
  patch(pc,'createDataChannel',original=>function(...args){const dc=original.apply(this,args);channel(dc,peerId);return dc;});
  listen(pc,'datachannel',event=>channel(event.channel,peerId));
  patch(pc,'setLocalDescription',original=>function(description){const result=original.call(this,description);Promise.resolve(result).then(()=>{const sdp=this.localDescription?.sdp??description?.sdp;if(sdp)emit({kind:'offer',peerId,sdp});},()=>{});return result;});
  listen(pc,'connectionstatechange',()=>emit({kind:'state',peerId,state:pc.connectionState}));
  patch(pc,'close',original=>function(...args){const result=original.apply(this,args);emit({kind:'state',peerId,state:'closed'});return result;});
  listen(pc,'iceconnectionstatechange',()=>emit({kind:'ice',peerId,state:pc.iceConnectionState}));
  if(typeof pc.getStats==='function'){
   let pending=false;const timer=setInterval(async()=>{if(pc.connectionState==='closed'){clearInterval(timer);return;}if(pending||!state.active)return;pending=true;try{const stats=await pc.getStats();for(const row of stats.values())if(['inbound-rtp','outbound-rtp','transport'].includes(row.type)){const fields={};for(const k of ['bytesSent','bytesReceived','packetsSent','packetsReceived','packetsLost','jitter','roundTripTime','dtlsState'])if(row[k]!=null)fields[k]=row[k];emit({kind:'stats',peerId,type:row.type,...fields});}}catch{}finally{pending=false;}},2000);dispose.push(()=>clearInterval(timer));
  }
  return pc;
 }});
 g.RTCPeerConnection=Wrapped;
 state.stop=()=>{state.active=false;for(const fn of dispose.reverse())try{fn();}catch{}if(g.RTCPeerConnection===Wrapped)g.RTCPeerConnection=Native;};
 g[key]=state;
}
export function voiceSummary(records){
 const peers=new Set(),calls=new Set(),closed=new Set(),associations=new Map();let messages=0;
 for(const r of records){if(r.peerId)peers.add(`${r.targetId||''}:${r.peerId}`);if(r.kind==='association'&&r.callId){calls.add(r.callId);associations.set(`${r.targetId||''}:${r.peerId}`,r.callId);}if(r.kind==='datachannel')messages++;if(r.kind==='state'&&r.state==='closed')closed.add(`${r.targetId||''}:${r.peerId}`);}
 return {observed:peers.size>0,peers:peers.size,messages,calls:[...calls],closedCalls:[...closed].map(p=>associations.get(p)).filter(Boolean)};
}
const headers=h=>Object.entries(h||{}).map(([name,value])=>({name,value:String(value)}));
const hash=s=>createHash('sha256').update(s).digest('hex');

export async function connectCDP(url,{WebSocketImpl=globalThis.WebSocket,timeoutMs=5000}={}){
 const socket=new WebSocketImpl(url),pending=new Map(),listeners=new Set(),closeListeners=new Set();let serial=0;
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{socket.close();reject(new Error('Debugger connection timed out'));},timeoutMs);socket.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});socket.addEventListener('error',()=>{clearTimeout(timer);reject(new Error('Debugger connection failed'));},{once:true});});
 socket.addEventListener('message',event=>{let row;try{row=JSON.parse(event.data);}catch{return;}if(row.id){const hit=pending.get(row.id);if(hit){pending.delete(row.id);clearTimeout(hit.timer);row.error?hit.reject(new Error('Debugger command rejected')):hit.resolve(row.result);}}else for(const fn of listeners)fn(row);});
 socket.addEventListener('close',()=>{for(const hit of pending.values()){clearTimeout(hit.timer);hit.reject(new Error('Debugger disconnected'));}pending.clear();for(const fn of closeListeners)fn();});
 return {on:fn=>listeners.add(fn),onClose:fn=>closeListeners.add(fn),send:(method,params={})=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Debugger command timed out'));},timeoutMs);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));}),close:()=>socket.close()};
}

export async function createRendererCapture({port,directory,expectedURL='app://-/index.html',fetcher=fetch,connect=connectCDP,now=Date.now}={}){
 const records=[],entries=new Map(),connections=new Map(),offers=new Map(),signaling=new Map(),bindings=new Map();let stopped=false,scriptIds=new Map(),dropped=0;
 const add=record=>{if(stopped)return;if(records.length>=100000){dropped++;return;}try{records.push(sanitizeRecord(record));}catch{dropped++;}};
 const associate=key=>{const offer=offers.get(key),signal=signaling.get(key);if(offer&&signal?.callId&&!offer.associated){offer.associated=true;add({kind:'association',time:now(),targetId:offer.targetId,peerId:offer.peerId,callId:signal.callId,...signal.threadId?{threadId:signal.threadId}:{},association:'exact-sdp'});}};
 async function attach(target){
  // Identify the packaged primary renderer by URL. Never observe other apps,
  // arbitrary web pages, DevTools, MCP Apps, or the browser side panel.
  if(target.type!=='page'||target.url.split(/[?#]/)[0]!==expectedURL||connections.has(target.id))return;
  const url=new URL(target.webSocketDebuggerUrl);if(!['127.0.0.1','localhost'].includes(url.hostname)||Number(url.port)!==port||url.protocol!=='ws:')throw new Error('Unexpected debugger endpoint');
  const c=await connect(url.href),binding='traceVoice_'+randomBytes(12).toString('hex');connections.set(target.id,c);bindings.set(target.id,binding);c.onClose?.(()=>{connections.delete(target.id);bindings.delete(target.id);scriptIds.delete(target.id);});
  c.on(({method,params:p={}})=>{
   if(stopped)return;try{const id=`${target.id}:${p.requestId}`;
   if(method==='Runtime.bindingCalled'&&p.name===binding){
    let row;try{row=JSON.parse(p.payload);}catch{return;}
    if(!['peer','channel','datachannel','offer','state','ice','stats'].includes(row.kind)||!Number.isFinite(row.time)||typeof row.peerId!=='string')return;
    if(row.kind==='offer'&&typeof row.sdp==='string'){const key=`${target.id}:${hash(row.sdp)}`;offers.set(key,{targetId:`${target.id}:${p.executionContextId}`,peerId:row.peerId});associate(key);}
    add({...row,targetId:`${target.id}:${p.executionContextId}`});
   }
   if(method==='Network.requestWillBeSent'){
    if(entries.size>=100000&&!entries.has(id)){dropped++;return;}
    const r=p.request;const entry={startedDateTime:new Date(now()).toISOString(),time:0,request:{method:r.method,url:r.url,httpVersion:'',headers:headers(r.headers),queryString:[],cookies:[],headersSize:-1,bodySize:-1,...r.postData?{postData:{mimeType:'application/json',text:r.postData}}:{}},response:{status:0,statusText:'',httpVersion:'',headers:[],cookies:[],content:{size:0,mimeType:''},redirectURL:'',headersSize:-1,bodySize:-1},cache:{},timings:{send:0,wait:0,receive:0},_traceSource:'electron-renderer'};
    if(r.method==='POST'&&/^(?:\/wham\/realtime\/calls|\/tbo\/[^/]+\/voice\/calls)$/.test(new URL(r.url).pathname))try{const body=JSON.parse(r.postData);if(typeof body.sdp==='string'){const key=`${target.id}:${hash(body.sdp)}`;signaling.set(key,{requestId:id,threadId:body.session?.thread_id||body.session?.conversation_id||null});entry._traceSignalingKey=key;}}catch{}
    try{entries.set(id,sanitizeRecord(entry));}catch{dropped++;}
   }
   if(method==='Network.responseReceived'){
    const e=entries.get(id);if(!e)return;const r=p.response;e.response={...e.response,status:r.status,statusText:r.statusText,headers:sanitizeRecord(headers(r.headers)),content:{size:0,mimeType:r.mimeType}};
    if(e._traceSignalingKey){const signal=signaling.get(e._traceSignalingKey);const location=Object.entries(r.headers||{}).find(([k])=>k.toLowerCase()==='location')?.[1];const callId=typeof location==='string'?location.split('?')[0].split('/').at(-1):null;if(callId&&/^rtc_[A-Za-z0-9_-]+$/.test(callId)){signal.callId=callId;associate(e._traceSignalingKey);}}
   }
   if(method==='Network.webSocketCreated'){if(entries.size>=100000&&!entries.has(id)){dropped++;return;}entries.set(id,sanitizeRecord({startedDateTime:new Date(now()).toISOString(),time:0,request:{method:'GET',url:p.url,headers:[],queryString:[],cookies:[],httpVersion:'',headersSize:-1,bodySize:0},response:{status:101,statusText:'',headers:[],cookies:[],content:{size:0,mimeType:''},httpVersion:'',redirectURL:'',headersSize:-1,bodySize:0},cache:{},timings:{send:0,wait:0,receive:0},_webSocketMessages:[],_traceSource:'electron-renderer'}));}
   if(method==='Network.webSocketFrameReceived'||method==='Network.webSocketFrameSent'){const e=entries.get(id);if(!e)return;if(e._webSocketMessages.length>=100000){dropped++;return;}const r=p.response;try{const frame=sanitizeRecord({type:method.endsWith('Sent')?'send':'receive',time:now()/1000,opcode:r.opcode,data:r.opcode===1?r.payloadData:'<withheld: binary websocket frame>'});e._webSocketMessages.push(frame);}catch{dropped++;}}
   }catch{dropped++;}
  });
  try{await c.send('Runtime.enable');await c.send('Network.enable',{maxPostDataSize:2_000_000});await c.send('Runtime.addBinding',{name:binding});await c.send('Page.enable');
  const source=`(${installVoiceObserver.toString()})(${JSON.stringify(binding)})`;
  const script=await c.send('Page.addScriptToEvaluateOnNewDocument',{source});scriptIds.set(target.id,script.identifier);await c.send('Runtime.evaluate',{expression:source});}catch(error){connections.delete(target.id);c.close();throw error;}
 }
 async function poll(){if(stopped)return;const response=await fetcher(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000)});if(!response.ok)throw new Error('Debugger targets unavailable');for(const target of await response.json())await attach(target);}
 async function checkpoint(){
  const har={log:{version:'1.2',creator:{name:'Trace Electron observer',version:'1'},entries:[...entries.values()].map(e=>{const copy={...e};delete copy._traceSignalingKey;return copy;}),_traceVoice:records,_traceRenderer:{targets:connections.size,dropped,audio:'not recorded',existingPeers:'Only peer connections created after observer installation are visible.'}}};
  if(findSecrets(JSON.stringify(har)).length||harSecrets(har).length)throw new Error('Renderer capture failed credential checks');
  const path=join(directory,'renderer.har'),temp=path+'.tmp';await writeFile(temp,JSON.stringify(har),{mode:0o600});await rename(temp,path);return har;
 }
 async function stop(){if(stopped)return;stopped=true;try{await checkpoint();}finally{for(const [id,c] of connections){for(const [method,params] of [['Page.removeScriptToEvaluateOnNewDocument',{identifier:scriptIds.get(id)}],['Runtime.evaluate',{expression:'globalThis.__traceVoiceObserver?.stop()'}],['Runtime.removeBinding',{name:bindings.get(id)}]])try{await c.send(method,params);}catch{}c.close();}}}
 return {poll,checkpoint,stop,status:()=>({targets:connections.size,flows:entries.size,dropped,voice:voiceSummary(records)})};
}
