import test from 'node:test';
import assert from 'node:assert/strict';
import {semanticCandidates,reviewSanitizedCandidates,neutralCandidate} from '../privacy/review-session.mjs';
const secret='plantedOpaqueCredentialCrossingBoundary';
const uuid='019b76da-a800-7000-8000-000000000001';
const localBoundaryLoader=()=>({secretValues:[],privateValues:[]});
for(const [kind,value,boundary] of [['secret',secret,{secretValues:[secret]}],['UUID',uuid,{originalIds:[uuid]}]])test(`${kind} spanning chunk boundary is rejected before any provider call`,async()=>{
 for(const offset of [1,Math.floor(value.length/2),value.length-1]){
  const source='n'.repeat(4000-offset)+value+' neutral engineering trailing text '.repeat(130);
  const candidates=semanticCandidates([{text:source}]);
  let calls=0;
  for(const approvedHashes of [[candidates[0].hash],candidates.map(c=>c.hash)])await assert.rejects(reviewSanitizedCandidates(candidates,{approvedHashes,boundary,localBoundaryLoader,batchSize:1,config:{key:'fixture-review-key'},fetcher:async()=>{calls++;throw Error('must not send');}}),/boundary rejected/);
  assert.equal(calls,0);
  assert.equal(semanticCandidates([{text:source}],{boundary}).length,0);
 }
});
test('deduplicated safe chunk retains every full source boundary and rejects a stale context',async()=>{
 const prefix='a'.repeat(4000);const candidates=semanticCandidates([{text:prefix+' safe engineering remainder'},{text:prefix+secret}]);
 assert.equal(neutralCandidate(candidates[0],{secretValues:[secret]}),false);
 const safe=semanticCandidates([{text:'Neutral engineering text explains a parser and event routing.'}]);
 safe[0].sourceContexts[0].text+=' stale';
 await assert.rejects(reviewSanitizedCandidates(safe,{approvedHashes:[safe[0].hash],localBoundaryLoader,config:{key:'fixture'},fetcher:async()=>{throw Error('must not send');}}),/boundary rejected/);
});
test('private source context is excluded from provider body',async()=>{
 const candidates=semanticCandidates([{text:'Neutral engineering text explains a parser and event routing. '.repeat(90)}]);let calls=0;
 const selected=candidates[0];
 await reviewSanitizedCandidates(candidates,{approvedHashes:[selected.hash],localBoundaryLoader,config:{key:'fixture'},fetcher:async(url,options)=>{
  calls++;const body=JSON.parse(options.body);assert.deepEqual(body.state.texts,{[selected.hash]:selected.text});assert.ok(!options.body.includes('sourceContexts'));assert.ok(!options.body.includes(selected.sourceContexts[0].hash));
  return {ok:true,json:async()=>({answers:{['privacy_'+selected.hash]:{noul:0}}})};
 }});assert.equal(calls,1);
});
test('effective provider credential boundary rejects a later batch before the first send',async()=>{
 const rows=[{text:'Neutral first engineering chunk describes parser routing.'},{text:'x'.repeat(3990)+secret+' neutral trailing engineering context'}];
 const candidates=semanticCandidates(rows);let calls=0;
 await assert.rejects(reviewSanitizedCandidates(candidates,{approvedHashes:candidates.map(c=>c.hash),localBoundaryLoader,batchSize:1,config:{key:secret},fetcher:async()=>{calls++;throw Error('must not send');}}),/boundary rejected/);
 assert.equal(calls,0);
});
