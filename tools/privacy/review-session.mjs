// Semantic review is an extra signal after deterministic/local review, never proof.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {decisionConfig,decisionFetch} from '../../codex/extract/codex/lib/jev-provider.mjs';
import {createSessionSanitizer,localSecretValues} from './sanitize-session.mjs';
function localBoundary(){let envText='';try{envText=fs.readFileSync(path.join(os.homedir(),'.env'),'utf8');}catch{}return {secretValues:localSecretValues(process.env,envText),privateValues:[os.homedir(),os.userInfo().username]};}
export const textHash=text=>crypto.createHash('sha256').update(text).digest('hex');
export function semanticCandidates(rows,{maxChars=4000}={}) {
 const unique=new Map();
 const walk=value=>{if(typeof value==='string'&&value.length>=40&&!/^\[(?:redacted|withheld)/.test(value)){
  for(let at=0;at<value.length;at+=maxChars){const text=value.slice(at,at+maxChars);const hash=textHash(text);unique.set(hash,{hash,text});}
 }else if(Array.isArray(value))value.forEach(walk);else if(value&&typeof value==='object')Object.values(value).forEach(walk);};
 rows.forEach(walk);return [...unique.values()];
}
export function neutralCandidate(candidate,{secretValues=[],privateValues=[],originalIds=[],originalIdSet=null}={}) {
 if(candidate.hash!==textHash(candidate.text))return false;
 if([...secretValues,...privateValues].filter(Boolean).some(value=>candidate.text.includes(value)))return false;
 const sourceIds=originalIdSet||new Set(originalIds.map(id=>id.toLowerCase()));
 if((candidate.text.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi)||[]).some(id=>sourceIds.has(id.toLowerCase())))return false;
 // A second independent boundary scan rejects recognizable unsanitized literals.
 const sanitizer=createSessionSanitizer({salt:'semantic-boundary',secretValues,privateValues});
 const withoutIds=candidate.text.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,'neutral-id');
 return sanitizer.text(withoutIds)===withoutIds;
}
export function validateSemanticAnswers(json,hashes) {
 const answers=json?.answers;if(!answers||typeof answers!=='object'||Object.keys(answers).length!==hashes.length)throw new Error('Invalid semantic review answer schema.');
 return hashes.map(hash=>{const p=answers['privacy_'+hash]?.noul;if(typeof p!=='number'||!Number.isFinite(p)||p<0||p>1)throw new Error('Invalid semantic review probability.');return {hash,privateContentProbability:p,origin:'Jev semantic review',publicationApproved:false};});
}
export async function reviewSanitizedCandidates(candidates,{approvedHashes=[],boundary={},config=decisionConfig(),fetcher, batchSize=8}={}) {
 if(!Number.isInteger(batchSize)||batchSize<1||batchSize>16)throw new Error('Invalid review batch size.');
 const local=localBoundary();
 boundary={...boundary,secretValues:[...local.secretValues,...boundary.secretValues||[],config.key].filter(Boolean),privateValues:[...local.privateValues,...boundary.privateValues||[]]};
 const approved=new Set(approvedHashes),selected=candidates.filter(candidate=>approved.has(candidate.hash));
 // Validate the entire batch before any network call, including missing/stale hashes.
 if(selected.length!==approved.size||selected.some(candidate=>!neutralCandidate(candidate,boundary)))throw new Error('Review boundary rejected candidate; no source content printed or sent.');
 if(!config.key)throw new Error('Semantic review credential unavailable.');
 const send=decisionFetch(config,fetcher);const results=[];
 for(let at=0;at<selected.length;at+=batchSize){
  const batch=selected.slice(at,at+batchSize),questions={};
  for(const candidate of batch)questions['privacy_'+candidate.hash]={type:'noul',instructions:`Does state.texts.${candidate.hash} contain personal, clinical, financial, credential, private infrastructure, private identities, or other third-party sensitive information that should not be published as a software-session example? Public author credit David Montgomery is permitted. Judge meaning, not merely presence of a redaction marker.`,criteria:{true:'Contains potentially private or sensitive information.',false:'Neutral software engineering text or already safely redacted text.'}};
  const response=await send('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{authorization:`Bearer ${config.key}`,'content-type':'application/json'},body:JSON.stringify({model:'jev-latest',state:{texts:Object.fromEntries(batch.map(c=>[c.hash,c.text]))},questions})});
  if(!response.ok)throw new Error(`Semantic review failed (HTTP ${response.status}); no response body printed.`);
  results.push(...validateSemanticAnswers(await response.json(),batch.map(c=>c.hash)));
 }
 return {schemaVersion:1,publicationApproved:false,reviewed:results.length,results,limitations:['Confidence is a review signal, not privacy proof. Independent human/source review remains required.']};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [auditPath,candidatePath]=process.argv.slice(2);if(!auditPath||!candidatePath)throw new Error('Usage: node tools/privacy/review-session.mjs private/audit.json private/candidates.json (prepare only; no network)');
 const privateRoot=path.resolve('private')+path.sep;for(const p of[auditPath,candidatePath])if(!path.resolve(p).startsWith(privateRoot))throw new Error('Review inputs and output must remain private.');
 const audit=JSON.parse(fs.readFileSync(auditPath,'utf8')),rows=[];
 for(const file of audit.files){const raw=fs.readFileSync(path.join(path.dirname(auditPath),file.name));if(textHash(raw)!==file.sha256)throw new Error('Sanitized file hash changed; rebuild audit.');const text=zlib.gunzipSync(raw).toString('utf8');for(const line of text.split('\n'))if(line.trim()){try{rows.push(JSON.parse(line));}catch{rows.push(line);}}}
 const boundary={...localBoundary(),originalIdSet:new Set(Object.keys(audit.idMap))};
 const candidates=semanticCandidates(rows).filter(c=>neutralCandidate(c,boundary));
 fs.writeFileSync(candidatePath,JSON.stringify({schemaVersion:1,publicationApproved:false,candidates},null,2),{mode:0o600,flag:'wx'});
 console.log(JSON.stringify({prepared:candidates.length,networkCalls:0,publicationApproved:false}));
}
