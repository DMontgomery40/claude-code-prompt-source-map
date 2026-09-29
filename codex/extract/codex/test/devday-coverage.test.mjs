import test from 'node:test';
import assert from 'node:assert/strict';
import {disposition, normalizeEndpoint} from '../devday-coverage.mjs';
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
