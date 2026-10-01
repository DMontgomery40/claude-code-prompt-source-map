// Semantic review is an extra signal after deterministic/local review, never proof.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {decisionConfig,ask,JevUnavailableError} from '../../codex/extract/codex/lib/jev-provider.mjs';
import {createSessionSanitizer,localSecretValues} from './sanitize-session.mjs';
function localBoundary(){let envText='';try{envText=fs.readFileSync(path.join(os.homedir(),'.env'),'utf8');}catch{}return {secretValues:localSecretValues(process.env,envText),privateValues:[os.homedir(),os.userInfo().username]};}
export const textHash=text=>crypto.createHash('sha256').update(text).digest('hex');
export function semanticCandidates(rows,{maxChars=4000,boundary}={}) {
 if(!Number.isInteger(maxChars)||maxChars<1)throw new Error('Invalid semantic chunk size.');
 const unique=new Map();
 const walk=value=>{if(typeof value==='string'&&value.length>=40&&!/^\[(?:redacted|withheld)/.test(value)){
  const context={hash:textHash(value),text:value};
  if(boundary&&!neutralText(value,boundary))return;
  for(let at=0;at<value.length;at+=maxChars){
   const text=value.slice(at,at+maxChars),hash=textHash(text);
   if(!unique.has(hash))unique.set(hash,{hash,text,sourceContexts:[]});
   const contexts=unique.get(hash).sourceContexts;
   if(!contexts.some(c=>c.hash===context.hash))contexts.push(context);
  }
 }else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};
 rows.forEach(walk);return [...unique.values()];
}
export function neutralCandidate(candidate,{secretValues=[],privateValues=[],originalIds=[],originalIdSet=null}={}) {
 if(typeof candidate.text!=='string'||candidate.hash!==textHash(candidate.text))return false;
 if(!Array.isArray(candidate.sourceContexts)||!candidate.sourceContexts.length)return false;
 if(candidate.sourceContexts.some(c=>typeof c.text!=='string'||c.hash!==textHash(c.text)||!c.text.includes(candidate.text)||!neutralText(c.text,{secretValues,privateValues,originalIds,originalIdSet})))return false;
 return neutralText(candidate.text,{secretValues,privateValues,originalIds,originalIdSet});
}
function neutralText(text,{secretValues=[],privateValues=[],originalIds=[],originalIdSet=null}={}) {
 if([...secretValues,...privateValues].filter(Boolean).some(value=>text.includes(value)))return false;
 const sourceIds=originalIdSet||new Set(originalIds.map(id=>id.toLowerCase()));
 if((text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi)||[]).some(id=>sourceIds.has(id.toLowerCase())))return false;
 // A second independent boundary scan rejects recognizable unsanitized literals.
 const sanitizer=createSessionSanitizer({salt:'semantic-boundary',secretValues,privateValues});
 const withoutIds=text.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,'neutral-id');
 return sanitizer.text(withoutIds)===withoutIds;
}
// One answer per request: exactly the `privacy` question, a finite probability within [0,1].
export function validateSemanticAnswer(json,hash) {
 const answers=json?.answers;if(!answers||typeof answers!=='object'||Object.keys(answers).length!==1||!('privacy' in answers))throw new Error('Invalid semantic review answer schema.');
 const p=answers.privacy?.noul;if(typeof p!=='number'||!Number.isFinite(p)||p<0||p>1)throw new Error('Invalid semantic review probability.');
 return {hash,privateContentProbability:p,origin:'Jev semantic review',publicationApproved:false};
}
const privacyQuestion={type:'noul',instructions:'Does state.text contain personal, clinical, financial, credential, private infrastructure, private identities, or other third-party sensitive information that should not be published as a software-session example? Public author credit David Montgomery is permitted. Judge meaning, not merely presence of a redaction marker.',criteria:{true:'Contains potentially private or sensitive information.',false:'Neutral software engineering text or already safely redacted text.'}};
// Provider errors can carry response bodies or thrown messages; rebuild them from fixed text with no cause.
function reviewFailure(error){
 const status=String((error instanceof JevUnavailableError?error.reason:error?.message)??'').match(/^\S+ (\d{3})\b/)?.[1];
 const detail=status?` (HTTP ${status})`:'';
 if(error instanceof JevUnavailableError)return new JevUnavailableError(`semantic review failed${detail}; no source content or response body printed`);
 return new Error(`Semantic review failed${detail}; no source content or response body printed.`);
}
export async function reviewSanitizedCandidates(candidates,{approvedHashes=[],boundary={},config=decisionConfig(),fetcher, localBoundaryLoader=localBoundary, concurrency=4, askOptions={}}={}) {
 if(!Number.isInteger(concurrency)||concurrency<1||concurrency>16)throw new Error('Invalid review concurrency.');
 const local=localBoundaryLoader();
 boundary={...boundary,secretValues:[...local.secretValues,...boundary.secretValues||[],config.key].filter(Boolean),privateValues:[...local.privateValues,...boundary.privateValues||[]]};
 const approved=new Set(approvedHashes),selected=candidates.filter(candidate=>approved.has(candidate.hash));
 // Validate the entire selection before any network call, including missing/stale hashes.
 if(selected.length!==approved.size||selected.some(candidate=>!neutralCandidate(candidate,boundary)))throw new Error('Review boundary rejected candidate; no source content printed or sent.');
 if(!config.key)throw new Error('Semantic review credential unavailable.');
 // One text per request: packing several texts into one state skews each judgment by its position.
 const review=async candidate=>{
  let response;try{response=await ask(config,{state:{text:candidate.text},questions:{privacy:privacyQuestion}},{...askOptions,fetchImpl:fetcher});}catch(error){throw reviewFailure(error);}
  return validateSemanticAnswer(response,candidate.hash);
 };
 const results=new Array(selected.length);let next=0,failure=null;
 const worker=async()=>{while(!failure&&next<selected.length){const at=next++;try{results[at]=await review(selected[at]);}catch(error){failure??=error;}}};
 await Promise.all(Array.from({length:Math.min(concurrency,selected.length)},worker));
 if(failure)throw failure;
 return {schemaVersion:1,publicationApproved:false,reviewed:results.length,results,limitations:['Confidence is a review signal, not privacy proof. Independent human/source review remains required.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [auditPath,candidatePath]=process.argv.slice(2);if(!auditPath||!candidatePath)throw new Error('Usage: node tools/privacy/review-session.mjs private/audit.json private/candidates.json (prepare only; no network)');
 const privateRoot=path.resolve('private')+path.sep;for(const p of[auditPath,candidatePath])if(!path.resolve(p).startsWith(privateRoot))throw new Error('Review inputs and output must remain private.');
 const audit=JSON.parse(fs.readFileSync(auditPath,'utf8')),rows=[];
 for(const file of audit.files){const raw=fs.readFileSync(path.join(path.dirname(auditPath),file.name));if(textHash(raw)!==file.sha256)throw new Error('Sanitized file hash changed; rebuild audit.');const text=zlib.gunzipSync(raw).toString('utf8');for(const line of text.split('\n'))if(line.trim()){try{rows.push(JSON.parse(line));}catch{rows.push(line);}}}
 const boundary={...localBoundary(),originalIdSet:new Set(Object.entries(audit.idMap).filter(([original,alias])=>original!==alias).map(([original])=>original.toLowerCase()))};
 const candidates=semanticCandidates(rows,{boundary}).filter(c=>neutralCandidate(c,boundary));
 fs.writeFileSync(candidatePath,JSON.stringify({schemaVersion:1,publicationApproved:false,candidates},null,2),{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({prepared:candidates.length,networkCalls:0,publicationApproved:false}));
}
