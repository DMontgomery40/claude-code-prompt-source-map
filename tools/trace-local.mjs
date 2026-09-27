#!/usr/bin/env node
// Loopback-only Trace resolver. No uploads, arbitrary paths, or directory-listing API.
import {createServer} from 'node:http';
import {readdir, lstat, realpath, readFile, open} from 'node:fs/promises';
import {join, resolve, relative, extname} from 'node:path';
import {homedir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {narrowByHint} from '../site/trace/loader.js';
import {SITE, siteOrigin} from '../site/src/shared/site.mjs';

export const PORT = 8766;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// The one site, plus the retired hosts (they redirect to it, but a tab opened before the move may still call).
const ORIGINS = new Set([siteOrigin(), ...Object.values(SITE.products).map(p => `https://${p.legacyHost}`)]);
const within = (root, file) => {const rel=relative(root,file);return rel!== '..' && !rel.startsWith('../') && !rel.startsWith('/');};
const defaultRoots = {codex:join(homedir(),'.codex','sessions'),'claude-code':join(homedir(),'.claude','projects')};

async function list(root) {
 const entries=[];
 async function walk(dir) {
  let names;try{names=await readdir(dir,{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
  for(const item of names){
   const path=join(dir,item.name);
   if(item.isSymbolicLink())continue;
   if(item.isDirectory())await walk(path);
   else if(item.isFile() && /\.(jsonl|json|txt)$/.test(item.name)){
    const size=(await lstat(path)).size;
    entries.push({path,source:{name:path,size,async slice(a,b){
     if(!within(root,await realpath(path)))throw new Error('Outside session root');
     const fh=await open(path,'r');try{const bytes=new Uint8Array(Math.max(0,Math.min(b,size)-a));let n=0;
      while(n<bytes.length){const {bytesRead}=await fh.read(bytes,n,bytes.length-n,a+n);if(!bytesRead)break;n+=bytesRead;}return bytes.subarray(0,n);
     }finally{await fh.close();}
    }}});
   }
  }
 }
 await walk(root);return entries;
}

export function createTraceServer({roots=defaultRoots,siteRoot=null}={}){
 const tickets=new Map();
 const server=createServer(async(req,res)=>{
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const local=`http://127.0.0.1:${server.address().port}`;
  // Block DNS rebinding and cross-site requests before doing any filesystem work.
  if(req.headers.host!==new URL(local).host)return reply(403,{error:'Forbidden host'});
  const origin=req.headers.origin;
  const trusted=ORIGINS.has(origin) || origin===local || (!origin && req.headers['sec-fetch-site']==='same-origin');
  if(origin && !trusted)return reply(403,{error:'Forbidden origin'});
  if(trusted){res.setHeader('Access-Control-Allow-Origin',origin||local);res.setHeader('Vary','Origin');}
  const url=new URL(req.url,local);
  if(req.method==='OPTIONS'){
   if(!trusted)return reply(403,{error:'Forbidden origin'});
   res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Trace-Request');
   res.setHeader('Access-Control-Allow-Private-Network','true');res.writeHead(204);return res.end();
  }
  if(url.pathname==='/health' && req.method==='GET')return reply(200,{service:'trace-local',version:1});
  if(url.pathname.startsWith('/v1/')){
   if(!trusted || req.headers['x-trace-request']!=='1')return reply(403,{error:'Forbidden request'});
   try{
    if(url.pathname==='/v1/session' && req.method==='POST'){
     let body='';for await(const chunk of req){body+=chunk;if(body.length>1024)return reply(413,{error:'Request too large'});}
     let id;try{id=JSON.parse(body).id;}catch{return reply(400,{error:'Invalid request'});}
     if(typeof id!=='string'||!UUID.test(id))return reply(400,{error:'Invalid session ID'});
     id=id.toLowerCase();let hit,root;
     for(const dir of Object.values(roots)){
      root=await realpath(dir).catch(()=>resolve(dir));const entries=await list(root);
      hit=await narrowByHint(entries,id);if(hit)break;
     }
     if(!hit)return reply(404,{error:'Session not found on this machine'});
     const session=hit.session;
     const entries=[...session.entries,...session.metas||[],...session.toolResults||[]];
     // Tickets contain only this requested family. No absolute paths are sent to the page.
     const now=Date.now();for(const [key,value] of tickets)if(value.expires<now)tickets.delete(key);
     while(tickets.size>20000)tickets.delete(tickets.keys().next().value);
     const files=entries.map(entry=>{
      const token=randomBytes(24).toString('hex');tickets.set(token,{entry,root,expires:now+24*60*60*1000});
      return {path:relative(root,entry.path).split('\\').join('/'),size:entry.source.size,url:'/v1/file/'+token};
     });
     return reply(200,{id,product:session.product,files});
    }
    if(url.pathname.startsWith('/v1/file/') && req.method==='GET'){
     const ticket=tickets.get(url.pathname.slice('/v1/file/'.length));
     if(!ticket || ticket.expires<Date.now())return reply(404,{error:'Session file expired; reopen the session'});
     const start=Number(url.searchParams.get('start')),end=Number(url.searchParams.get('end'));
     if(!url.searchParams.has('start')||!url.searchParams.has('end')||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||end<start||end>ticket.entry.source.size||end-start>16*1024*1024)return reply(400,{error:'Invalid range'});
     if(!within(ticket.root,await realpath(ticket.entry.path)))return reply(403,{error:'Outside session root'});
     const bytes=await ticket.entry.source.slice(start,end);res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':bytes.length});return res.end(bytes);
    }
    return reply(404,{error:'Not found'});
   }catch(error){console.error('Trace resolver read failed:',error);return reply(500,{error:'Could not read the session'});}
  }
  if(siteRoot && req.method==='GET'){
   try{
    const base=resolve(siteRoot);let path=resolve(base,'.'+decodeURIComponent(url.pathname));
    if(!within(base,path))return reply(404,{error:'Not found'});
    if((await lstat(path)).isDirectory())path=join(path,'index.html');
    if(!within(base,await realpath(path)))return reply(404,{error:'Not found'});
    const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
    const body=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});return res.end(body);
   }catch{return reply(404,{error:'Not found'});}
  }
  reply(404,{error:'Not found'});
 });
 return server;
}

if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const siteRoot=fileURLToPath(new URL('../site/dist/',import.meta.url));
 createTraceServer({siteRoot}).listen(PORT,'127.0.0.1',()=>console.log(`Trace local resolver: http://127.0.0.1:${PORT}/trace/`));
}
