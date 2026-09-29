import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { codex } from '../targets/codex.mjs';

const generated = [
 ['extract/codex/chatgpt-prompts.mjs','outputs/chatgpt-conversation-prompts.json'],
 ['extract/codex/bundle-resources.mjs','outputs/chatgpt-bundled-plugins.json'],
 ['extract/codex/tool-manifest.mjs','outputs/desktop-tool-manifest.json'],
 ['extract/codex/learning-blocks.mjs','outputs/chatgpt-learning-blocks.json']
];
const fingerprint = {cli_sha256:'current-cli',app_build:'current-build'};
async function fixture(check, {scripts=true}={}) {
 const repo=fs.mkdtempSync(path.join(os.tmpdir(),'codex-required-inputs-'));
 fs.mkdirSync(path.join(repo,'outputs'));
 fs.mkdirSync(path.join(repo,'work'));
 if(scripts) for(const [script,output] of generated){
  fs.mkdirSync(path.dirname(path.join(repo,script)),{recursive:true});
  fs.writeFileSync(path.join(repo,script),'// fixture');
  fs.writeFileSync(path.join(repo,output),'old record');
 }
 try {await check(repo);} finally {fs.rmSync(repo,{recursive:true,force:true});}
}
function runner(failure) {
 const calls=[];
 return {
  calls,
  run(command,args){
   calls.push({command,args});
   if(args[0]===failure) return {status:1,stderr:'required input unavailable',stdout:''};
   if(args[0]==='extract/codex/refresh.mjs') return {status:0,stderr:'',stdout:JSON.stringify({sources:{app_version:'current',app_build:'current',cli_version:'current'},changed:[]})};
   return {status:0,stderr:'',stdout:'{}'};
  }
 };
}
function assertNoPublication(repo,calls) {
 assert.equal(calls.some(call=>/^extract\/codex\/(?:devday-coverage|devday-overview|key-findings)\.mjs$/.test(call.args[0])),false,'no derived current summary ran');
 assert.equal(calls.some(call=>call.command==='git' && call.args[0]==='status'),false,'no publish-plan decision ran');
 assert.equal(fs.existsSync(path.join(repo,'outputs/status.json')),false,'no status advanced');
 assert.equal(fs.existsSync(path.join(repo,'CHANGELOG.md')),false,'no publication changelog written');
 assert.ok(calls.some(call=>call.command==='git' && call.args[0]==='checkout'),'failed outputs were restored');
}
const runtime = (repo,commandRunner) => ({repo,run:commandRunner.run,notify:()=>{},log:()=>{}});
test('required config refresh failure aborts before model extraction or publication',async()=>fixture(async repo=>{
 const commands=runner('extract/codex-config/run_all.sh');
 await assert.rejects(codex.refresh({now:Date.now(),dryRun:false,fingerprint,previous:null},runtime(repo,commands)),/required config\/env extraction failed.*publication stopped/);
 assert.equal(commands.calls.some(call=>call.args[0]==='extract/codex/refresh.mjs'),false);
 assertNoPublication(repo,commands.calls);
}));
for(const [script] of generated) test(`required ${script} failure aborts instead of publishing restored old records`,async()=>fixture(async repo=>{
 const commands=runner(script);
 await assert.rejects(codex.refresh({now:Date.now(),dryRun:false,fingerprint,previous:fingerprint},runtime(repo,commands)),/required extractor .* failed.*publication stopped/);
 assert.equal(commands.calls.some(call=>call.args[0]==='extract/codex/prompt-sweep.mjs'),false);
 assertNoPublication(repo,commands.calls);
}));
test('required prompt sweep failure aborts before summaries can use old model-facing text',async()=>fixture(async repo=>{
 const commands=runner('extract/codex/prompt-sweep.mjs');
 await assert.rejects(codex.refresh({now:Date.now(),dryRun:false,fingerprint,previous:fingerprint},runtime(repo,commands)),/required prompt sweep failed.*publication stopped/);
 assertNoPublication(repo,commands.calls);
}));
test('missing required generated extractor aborts rather than skipping a summary input',async()=>fixture(async repo=>{
 const commands=runner(null);
 await assert.rejects(codex.refresh({now:Date.now(),dryRun:false,fingerprint,previous:fingerprint},runtime(repo,commands)),/required extractor .* is missing; publication stopped/);
 assert.equal(commands.calls.some(call=>call.args[0]==='extract/codex/prompt-sweep.mjs'),false);
 assert.equal(commands.calls.some(call=>/^extract\/codex\/(?:devday-coverage|devday-overview|key-findings)\.mjs$/.test(call.args[0])),false);
},{scripts:false}));
