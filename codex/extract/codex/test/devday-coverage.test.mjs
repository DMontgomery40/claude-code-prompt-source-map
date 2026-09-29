import test from 'node:test';
import assert from 'node:assert/strict';
import {disposition, normalizeEndpoint, selectTriage} from '../devday-coverage.mjs';
test('template and literal endpoints compare without guessing identifier names',()=>{
 assert.equal(normalizeEndpoint('/pages/${e}/files'),normalizeEndpoint('/pages/{page_id}/files'));
 assert.notEqual(normalizeEndpoint('/pages/{page_id}/files'),normalizeEndpoint('/pages/{page_id}/shares'));
});
test('classifier confidence cannot determine shipped or model-facing disposition',()=>{
 assert.equal(disposition({kind:'i18n_namespaces',jev:1},[{}],[],[]),'unresolved');
 assert.equal(disposition({kind:'endpoints',jev:0},[{}],[],[]),'add documentation');
 assert.equal(disposition({kind:'asset_families',jev:1},[{}],[],[]),'incidental/non-model-facing');
 assert.equal(disposition({kind:'enums',name:'CODEX_ARTIFACT_PERSISTENCE_OUTCOME_'},[{}],[],[]),'add documentation');
 assert.equal(disposition({kind:'enums',name:'CHATGPT_CODEX_USAGE_ANALYTICS_CHART_'},[{}],[],[]),'incidental/non-model-facing');
 assert.equal(disposition({kind:'i18n_namespaces'},[{}],['record'],[{}]),'already captured');
 assert.equal(disposition({kind:'endpoints'},[],[],[]),'unresolved');
});

const previousReview = {
 source: {asar_sha256:'build-a',app_build:'1'},
 candidates:Array.from({length:355},(_,i)=>({name:`old-${i}`,triage_score:i<287?0.9:0.1})),
 scope:{classifier_positive:287,classifier_negative:68}
};
const currentScan = (hash, flagged=[], notes=[]) => ({source:{asar_sha256:hash,app_build:'2'},flagged,notes,baseline:true,summary:{documentable:0,labelled:0,unavailable:'disabled'}});
test('changed build uses the current scan, replacing old candidates and retaining removal notes',()=>{
 const flagged=[{kind:'endpoints',name:'/new/action',jev:null}];
 const notes=[{kind:'endpoints',name:'/old/action',change:'removed',previous:1}];
 const selected=selectTriage({scan:currentScan('build-b',flagged,notes),previous:previousReview,asarSha256:'build-b'});
 assert.deepEqual(selected.flagged,flagged);
 assert.deepEqual(selected.notes,notes);
 assert.equal(selected.universe,'current scan');
 assert.equal(selected.flagged.some(candidate=>candidate.name==='old-0'),false);
});
test('changed build with zero flagged candidates cannot retain the old universe',()=>{
 const selected=selectTriage({scan:currentScan('build-b'),previous:previousReview,asarSha256:'build-b'});
 assert.deepEqual(selected.flagged,[]);
 assert.equal(selected.summary.documentable,0);
});
test('same-build zero-delta rescan retains reviewed candidates and known classifier counts',()=>{
 const selected=selectTriage({scan:currentScan('build-a'),previous:previousReview,asarSha256:'build-a'});
 assert.equal(selected.flagged.length,355);
 assert.equal(selected.summary.documentable,287);
 assert.equal(selected.summary.labelled,355);
 assert.equal(selected.source.app_build,'2');
 assert.equal(selected.universe,'retained same-build review');
});
test('same-build removed candidates are a delta, not a reason to reuse the full review',()=>{
 const selected=selectTriage({scan:currentScan('build-a',[],[{name:'old-0',change:'removed'}]),previous:previousReview,asarSha256:'build-a'});
 assert.deepEqual(selected.flagged,[]);
 assert.equal(selected.notes.length,1);
});
test('stale or unidentified scan sources fail before coverage can be published',()=>{
 for(const scan of [currentScan('build-b'),{flagged:[],notes:[]}]){
  assert.throws(()=>selectTriage({scan,previous:previousReview,asarSha256:'build-a'}),/source hash does not match/);
 }
 assert.throws(()=>selectTriage({previous:previousReview,asarSha256:'build-b'}),/run the current surface scan/);
 assert.equal(selectTriage({previous:previousReview,asarSha256:'build-a'}).flagged.length,355);
});
