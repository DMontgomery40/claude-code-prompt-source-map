import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildTrace,qualifyTraceReferences} from '../../src/shared/trace-build.mjs';
import {siteHref} from '../panels.js';
import {categories as claude} from '../../src/claude-code/catalog.mjs';
import {categories as codex} from '../../src/codex/catalog.mjs';
const siteRoot=fileURLToPath(new URL('../../',import.meta.url));
test('reference URLs accept scoped product pages and legacy slugs but reject unsafe paths',()=>{
 for(const slug of ['claude-code/system-reminders','codex/tool-manifest','system-reminders'])assert.equal(siteHref({slug,anchor:'skills-listing'}),`../${slug}/#skills-listing`);
 for(const slug of ['other/page','codex/../secrets','//evil.test','https://evil.test','codex/page/extra','codex/%2e%2e','codex/page?x=1','codex/page#bad','codex\\page'])assert.equal(siteHref({slug}),null);
 assert.equal(siteHref({slug:'codex/tools',anchor:'" onclick="bad'}),'../codex/tools/');
});
test('qualification keeps all record/page references consistent and is idempotent',()=>{
 const index={pages:[{slug:'tools'}],records:[{slug:'tools'}],reminders:{x:{slug:'tools'}},templates:{x:{slug:'tools'}},tools:{x:{slug:'tools'}},lines:{hash:0},recordLines:{hash:[0]}};
 qualifyTraceReferences(index,'codex');qualifyTraceReferences(index,'codex');
 for(const ref of [...index.pages,...index.records,index.reminders.x,index.templates.x,index.tools.x])assert.equal(ref.slug,'codex/tools');
 assert.equal(index.pages[index.lines.hash].slug,index.records[index.recordLines.hash[0]].slug);
});
for(const [section,categories] of [['claude-code',claude],['codex',codex]])test(`${section} generated references target existing scoped pages and exact anchors`,async()=>{
 const {index}=await buildTrace({siteRoot,sourceRoot:path.resolve(siteRoot,'..',section),categories,section,copy:false,write:false,siteId:section});
 const refs=[...index.pages,...index.records,...Object.values(index.reminders),...Object.values(index.templates),...Object.values(index.tools)];
 assert.ok(refs.length>10);
 for(const ref of refs){
  assert.ok(ref.slug.startsWith(section+'/'));const href=siteHref(ref);assert.ok(href);
  const page=await readFile(path.join(siteRoot,'dist',ref.slug,'index.html'),'utf8');
  if(ref.anchor)assert.ok(page.includes(`id="${ref.anchor}"`),`${href} missing anchor`);
 }
 for(const record of index.records)assert.ok(index.pages.some(page=>page.slug===record.slug));
});
