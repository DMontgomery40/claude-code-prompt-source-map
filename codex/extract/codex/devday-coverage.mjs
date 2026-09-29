#!/usr/bin/env node
// Public coverage ledger for every locally triaged structural candidate. Classifier scores
// are retained only as triage metadata; source evidence and conservative rules set dispositions.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { codexApp } from './lib/app-layout.mjs';
import { openAsar, byteOffset } from './lib/asar.mjs';
import { familyOf } from './surface-scan.mjs';
import { privacyScan } from './lib/privacy.mjs';
import { productOrigin } from '../../../site/src/shared/site.mjs';
import { categories } from '../../../site/src/codex/catalog.mjs';

export const normalizeEndpoint = s => s.replace(/\$\{[^}]*\}|\{[a-z_]+\}/g, '{}').replace(/\/+$/, '');
export function disposition(candidate, sources, captures, prompts) {
  if (!sources.length) return 'unresolved';
  if (candidate.kind === 'enums' && /ARTIFACT|SITES_OPERATION/.test(candidate.name)) return 'add documentation';
  if (candidate.kind === 'asset_families' || candidate.kind === 'enums') return 'incidental/non-model-facing';
  if (captures.length) return 'already captured';
  if (candidate.kind === 'endpoints' || prompts.length || candidate.kind === 'content_reference_categories') return 'add documentation';
  // UI strings alone do not establish an injected instruction, a tool or a rollout.
  return 'unresolved';
}
// A review universe belongs to exact bytes. New scans may carry no changes; only an
// unchanged build with no removals can retain the previously reviewed universe.
export function selectTriage({ scan = null, previous = null, asarSha256 }) {
  const previousMatches = previous?.source?.asar_sha256 === asarSha256;
  const reviewed = () => ({
    source: previous.source,
    flagged: previous.candidates.map(candidate => ({ ...candidate, jev: candidate.triage_score })),
    notes: previous.removed ?? [],
    baseline: previous.scan_baseline ?? true,
    baseline_source: previous.baseline_source ?? null,
    summary: {
      documentable: previous.scope.classifier_positive,
      labelled: previous.scope.classifier_labelled ?? previous.scope.classifier_positive + previous.scope.classifier_negative,
      unavailable: previous.scope.classifier_unavailable ?? null
    },
    universe: 'retained same-build review'
  });
  if (!scan) {
    if (!previousMatches) throw new Error('Coverage source changed or is unavailable; run the current surface scan and supply its triage file.');
    return reviewed();
  }
  if (!scan.source?.asar_sha256 || scan.source.asar_sha256 !== asarSha256) {
    throw new Error('Surface triage source hash does not match the installed app.asar; run the current surface scan.');
  }
  if (!Array.isArray(scan.flagged) || !Array.isArray(scan.notes)) throw new Error('Surface triage requires flagged and notes arrays.');
  if (previousMatches && !scan.flagged.length && !scan.notes.length) {
    return { ...reviewed(), source: scan.source, baseline: scan.baseline, baseline_source: scan.baseline_source ?? null, notes: scan.notes };
  }
  return { ...scan, universe: 'current scan' };
}

export function generate(root = path.resolve(import.meta.dirname, '../..'), triageFile = null) {
  const asar = openAsar(codexApp().asar);
  const previousFile = path.join(root,'outputs/devday-surface-coverage.json');
  const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile)) : null;
  const scan = triageFile ? JSON.parse(fs.readFileSync(triageFile)) : null;
  const triage = selectTriage({ scan, previous, asarSha256: asar.sha256 });
  const docLink = filename => {
    const entry=categories.flatMap(c=>c.files).find(f=>typeof f.records==='string' ? f.records==='outputs/'+filename : f.records?.file==='outputs/'+filename);
    return entry ? `${productOrigin('codex')}/${entry.slug}/` : `${productOrigin('codex')}/devday-surface-coverage-records/`;
  };
  const docs = fs.readdirSync(path.join(root, 'outputs')).filter(n => n.endsWith('.json') && /prompts|learning-blocks|tool-manifest|bundled-plugins/.test(n)).map(name => ({name, text:JSON.stringify((({items,tools,blocks,how_blocks_arrive,type_enum_without_manifest})=>({items,tools,blocks,how_blocks_arrive,type_enum_without_manifest}))(JSON.parse(fs.readFileSync(path.join(root,'outputs',name),'utf8'))))}));
  const hashes = new Map();
  const hash = entry => { if (!hashes.has(entry.path)) hashes.set(entry.path, asar.fileSha256(entry)); return hashes.get(entry.path); };
  const messages = [], endpoints = [], refs = [];
  for (const entry of asar.appScripts) {
    if (/(?:^|\/)[a-z]{2}(?:-[A-Za-z0-9]+)?-[0-9a-f]{12}\.js$/.test(entry.path)) continue;
    const text = asar.textOf(entry);
    const source = (at,length) => ({file:entry.path, sha256:hash(entry), byte_offset:byteOffset(text,at),byte_length:Buffer.byteLength(text.slice(at,at+length),'utf8')});
    for (const m of text.matchAll(/\bid:\s*`([A-Za-z][\w-]*(?:\.[\w$-]+)+)`\s*,\s*defaultMessage:\s*`([^`]*)`/g)) messages.push({id:m[1], text:m[2], source:source(m.index,m[0].length)});
    for (const m of text.matchAll(/\.safe(Get|Post|Put|Patch|Delete)\(\s*`(\/[^`]+)`/g)) endpoints.push({name:normalizeEndpoint(m[2]), method:m[1].toUpperCase(), literal:m[2], source:source(m.index,m[0].length)});
    for (const m of text.matchAll(/[`"'](\/(?:[a-z][a-z0-9_-]*|\{[a-z_]+\})(?:\/(?:[a-z0-9_-]+|\{[a-z_]+\}))+)[`"']/g)) endpoints.push({name:normalizeEndpoint(m[1]),method:null,literal:m[1],source:source(m.index,m[0].length)});
    for (const m of text.matchAll(/category:\s*`([a-z][a-z0-9_]*)`\s*,\s*contentReferenceIndex/g)) refs.push({name:m[1],source:source(m.index,m[0].length)});
  }
  const candidates = triage.flagged.map((candidate,index) => {
    const ns = messages.filter(m => m.id.startsWith(candidate.name+'.'));
    // This message's shipped description identifies the editable introductory
    // paragraph above the interactive Page prompt, rather than a model request.
    const humanFacing = ns.filter(m => m.id === 'codex.space.creation.overview.aboutPrompt');
    const prompts = ns.filter(m => !humanFacing.includes(m) && /(?:prompt(?:With\w*)?|promptPrefix|instructions?|request)$/i.test(m.id) && (m.text.length>55 || /prompt(?:With\w*)?$/i.test(m.id)) && /(?:\b(?:you|please|use|make|create|resolve|review|attached|changes|run)\b)/i.test(m.text));
    let evidence = [];
    if (candidate.kind.startsWith('i18n_')) evidence = (prompts.length ? prompts : ns).slice(0,4).map(m => ({...m.source,message_id:m.id,text:m.text}));
    else if (candidate.kind==='endpoints') evidence = endpoints.filter(e=>e.name===normalizeEndpoint(candidate.name)).slice(0,4).map(e=>({...e.source,method:e.method,literal:e.literal}));
    else if (candidate.kind==='content_reference_categories') evidence = refs.filter(e=>e.name===candidate.name).map(e=>e.source);
    else if (candidate.kind==='asset_families') evidence = asar.entries.filter(e=>familyOf(e.path)?.family===candidate.name).slice(0,4).map(e=>({file:e.path,sha256:hash(e)}));
    else if (candidate.kind==='enums') for (const entry of asar.appScripts) {const text=asar.textOf(entry), at=text.indexOf((candidate.evidence?.samples?.[0] ?? candidate.evidence?.[0]?.literal ?? candidate.name));if(at>=0){evidence.push({file:entry.path,sha256:hash(entry),byte_offset:byteOffset(text,at),literal:(candidate.evidence?.samples?.[0] ?? candidate.evidence?.[0]?.literal ?? candidate.name)});if(evidence.length===4)break;}}
    const captureNeedles = candidate.kind.startsWith('i18n_') ? [...ns.map(m=>m.id),...prompts.map(m=>JSON.stringify(m.text))] : [candidate.name];
    const captures = docs.filter(d=>captureNeedles.some(n=>d.text.includes(n))).map(d=>'codex/outputs/'+d.name);
    const status=disposition(candidate,evidence,captures,prompts);
    const trigger = candidate.kind==='endpoints' ? `Client ${[...new Set(evidence.map(e=>e.method).filter(Boolean))].join('/')} call or shipped path literal in the endpoint family ${candidate.name.split('/')[1]}; surrounding caller and server authorization determine execution.` : prompts.length ? 'The shipped localized instruction is available to the UI action represented by its message ID; the ledger does not prove the event handler executes it or which account enables it.' : candidate.kind==='content_reference_categories' ? 'Rendering a content reference whose category matches this literal.' : candidate.kind==='enums' ? (/ARTIFACT|SITES_OPERATION/.test(candidate.name) ? 'Artifact/content operation enum: structural vocabulary is shipped, but dispatch, model injection and activation trigger are unverified.' : 'Client enum/event vocabulary; no model-facing trigger established by the declaration.') : candidate.kind==='asset_families' ? 'Loading a UI asset; the family name alone establishes no instruction.' : 'Localized UI namespace; model-facing activation remains unresolved.';
    return {id:index+1,kind:candidate.kind,name:candidate.name,change:candidate.change,count:candidate.count,previous:candidate.previous,triage_score:candidate.jev,disposition:status,captured_in:captures,evidence,prompt_candidates:prompts,reviewed_human_facing_messages:humanFacing.map(m=>({...m,review:'Editable introductory Page paragraph; distinct from the interactive model request.'})),uncaptured_prompt_candidates:prompts.filter(m=>!docs.some(d=>d.text.includes(m.id)||d.text.includes(JSON.stringify(m.text)))),trigger,activation:'Shipped static evidence only. Availability, rollout, server behavior and live model injection are unverified.'};
  });
  const counts=Object.fromEntries(['already captured','add documentation','incidental/non-model-facing','unresolved'].map(s=>[s,candidates.filter(c=>c.disposition===s).length]));
  const featureDefinitions = [
    {name:'Spaces and teams', namespaces:['teams','space','pages'], pattern:/agent instructions|Team Space|pagePrompt|sampleContentInstructions|answeredSetupInstructions/i, behavior:'Team Space selection says future scheduled runs use its agent instructions; clearing it stops that use. Page/template prompts are separate UI actions.', limit:'Scheduled-run composition is described by shipped UI text; no captured server injection or live team run is asserted.'},
    {name:'Dots, custom rules and permissions', namespaces:['settings.userRules','browserPluginSettings.permission','orbit'], pattern:/wants to|write an email|read-only|reading or making|Read without asking/i, behavior:'Rules settings name actions the assistant wants to take; browser permissions distinguish asking, read-only access, and asking before changes. /wham/user-rules and /wham/work/settings are shipped settings paths.', limit:'The ledger does not establish the complete rule evaluator, precedence or account rollout.'},
    {name:'Reusable cloud environments and secrets', namespaces:['environmentSetup','settings.cloudEnvironments'], pattern:/Secrets|destinations|Internet access|Workspace members|Visible only|exact host/i, behavior:'Saved environment drafts expose internet host allowances, destination-scoped secrets and workspace visibility/editor controls. /settings/codex-cloud is a settings endpoint.', limit:'These controls configure execution; secret transmission, effective policy and server enforcement are unverified.'},
    {name:'Review and repository operations', namespaces:['codeReviewPlugin','codeReview','settings.codeReviewPlugin'], pattern:/manualReview.request|gitlabConflictFixPrompt|fixCommentsPrompt|reviewer|GitHub|GitLab/i, behavior:'Manual review asks a fresh reviewer subagent to find actionable bugs without posting or changing code. GitLab conflict-fix text requests repository/branch verification before resolving, checking, committing and pushing. GitHub/GitLab operation endpoints separately name reads and mutations.', limit:'A request prompt is an instruction, not proof that every operation is exposed as a tool or authorized. No security-cloud feature activation is established by these candidates.'},
    {name:'Plugin creation and file/editor surfaces', namespaces:['plugins.create','fileViewer','settings.fileTypeHandlers','localConversation.pageToolActivity'], pattern:/CreatorPrompt|MCP|archive|file|editor/i, behavior:'Plugin creation UI supports MCP Apps and archive upload; creator prompt text can ask the assistant to construct a plugin. File viewers and handlers are client UI surfaces unless an exact injected instruction is present.', limit:'Plugin availability, installed capabilities and file-handler dispatch require additional runtime evidence.'},
    {name:'Visualizations, artifacts and GIF editing', namespaces:['codex','gifEditor','artifactHandoff'], pattern:/publishToSitesPrompt|googleSlidesPrompt|promptWithOutline|gifEditor.comments/i, behavior:'Visualization publication and slide actions contain explicit assistant requests. GIF comment text assembles frame-relative coordinates and timing instructions. Artifact interaction/persistence enums describe client events, not independently proved model tools.', limit:'Rendered visualization category is shipped; generation availability and runtime editor behavior are not inferred from that category.'},
    {name:'Scheduling and event triggers', namespaces:['automations','scheduled','teams'], pattern:/triggered by events|Repeat interval|scheduled task runs|agent instructions/i, behavior:'Automation UI states event-triggered automations cannot be run manually and exposes minute intervals. Team Space instructions are described as inputs to scheduled runs. Schedule-policy, execution-thread and backing-run endpoints are shipped.', limit:'Supported event sources, scheduler enforcement and runtime prompt assembly are unverified.'},
    {name:'Writing style', namespaces:['workOnboarding.writingStyle'], pattern:/writing style|Library|Connect apps/i, behavior:'Onboarding says style can use chats and Library files, with optional connected apps. The refreshed Work prompt record documents the separate skill-creation requests, representative authored sampling and privacy instructions.', limit:'The onboarding description does not prove a generated skill exists or that memory/style has been learned for an account.'}
  ];
  const features=featureDefinitions.map(f=>({...f,evidence:messages.filter(m=>f.namespaces.some(ns=>m.id.startsWith(ns+'.')) && f.pattern.test(m.id+' '+m.text)).slice(0,8).map(m=>({message_id:m.id,text:m.text,...m.source})),candidate_ids:candidates.filter(c=>f.namespaces.includes(c.name)).map(c=>c.id)})).map(({pattern,...f})=>f);
  const labelled = triage.summary?.labelled ?? triage.flagged.filter(candidate=>typeof candidate.jev==='number').length;
  const positive = triage.summary?.documentable ?? triage.flagged.filter(candidate=>typeof candidate.jev==='number' && candidate.jev>=0.5).length;
  const report={schema_version:1,title:'Codex/ChatGPT Dev Day surface coverage',source:{...triage.source,asar_sha256:asar.sha256},scan_baseline:triage.baseline,baseline_source:triage.baseline_source??null,review_universe:triage.universe,scope:{candidates:candidates.length,classifier_positive:positive,classifier_negative:labelled-positive,classifier_labelled:labelled,classifier_unlabelled:candidates.length-labelled,classifier_unavailable:triage.summary?.unavailable??null},dispositions:counts,features:features.filter(feature=>feature.evidence.length),removed:triage.notes??[],removal_qualification:'Absent from the current structural inventory relative to the scan baseline. This does not establish feature disablement or server-side removal.',candidates};
  privacyScan(new Map([['devday-surface-coverage.json',JSON.stringify(report)]]));
  fs.writeFileSync(path.join(root,'outputs/devday-surface-coverage.json'),JSON.stringify(report,null,2)+'\n');
  const escape=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
  let md=`# Codex/ChatGPT Dev Day surface coverage\n\nA complete disposition ledger of ${candidates.length} structural candidates against the refreshed prompt, tool, plugin and learning-block records. “Dev Day” names the review, not an independently established launch date. Source: shipped app.asar, SHA-256 \`${asar.sha256}\`.\n\nThe classifier labelled ${positive} candidates positive and ${labelled-positive} negative; ${candidates.length-labelled} are unlabelled. The reviewed universe comes from the ${triage.universe}. Neither its score nor a new inventory entry establishes a newly launched or enabled feature. Endpoint paths are client-side evidence, not a public API contract. “Already captured” means a namespace has at least one exact message ID or instruction text in a published record (absence/exclusion lists are ignored); it does not certify that every message in that namespace is model-facing or fully extracted.\n\n`;
  md+='| Disposition | Candidates |\n|---|---:|\n'+Object.entries(counts).map(([s,n])=>`| ${s} | ${n} |`).join('\n')+'\n\n';
  md+='## Feature-level map\n\nThe following triggers are described by exact shipped text. They establish client intent and instruction contents, with runtime and account activation qualifications.\n\n';
  for(const feature of report.features){md+=`### ${feature.name}\n\n${feature.behavior} ${feature.limit}\n\n`;for(const e of feature.evidence)md+=`- \`${e.message_id}\`: ${escape(e.text)} Source: \`${e.file}\`, byte ${e.byte_offset}, SHA-256 \`${e.sha256}\`.\n`;md+='\n';}
  md+='## Endpoint families\n\nEach endpoint candidate below has its own source locator and method where visible. Calls cover team/space/page collaboration, browser credentials, connectors, messaging, automations, persistent runtime controls, Sites hosting, shopping/business profiles, GitHub/GitLab review operations, model configuration and rules. These client calls do not by themselves expose model-visible tools. Server-side dispatch and authorization remain outside this evidence.\n\n';
  const endpointFamilies=new Map();
  for(const candidate of candidates.filter(c=>c.kind==='endpoints')){const segments=candidate.name.split('/').filter(Boolean);const family=segments[0]==='wham' && ['github','gitlab'].includes(segments[1])?'/'+segments.slice(0,2).join('/'):'/'+segments[0];endpointFamilies.set(family,(endpointFamilies.get(family)??0)+1);}
  md+='| Endpoint family | Candidates |\n|---|---:|\n'+[...endpointFamilies].sort(([a],[b])=>a.localeCompare(b)).map(([family,count])=>`| \`${family}\` | ${count} |`).join('\n')+'\n\n';
  md+='## Instruction-bearing gaps\n\n';
  for(const c of candidates.filter(c=>c.prompt_candidates.length && c.disposition!=='already captured')) {md+=`### ${c.name}\n\n${c.trigger}\n\n`;for(const p of c.prompt_candidates) md+=`- \`${p.id}\`: ${escape(p.text)} Source: \`${p.source.file}\`, byte ${p.source.byte_offset}, SHA-256 \`${p.source.sha256}\`.\n`;md+='\n';}
if (report.removed.length) {
    md+='## Removed inventory entries\n\n'+report.removal_qualification+'\n\n';
    for(const entry of report.removed) md+=`- ${escape(entry.kind)} \`${escape(entry.name)}\` (${entry.previous??'?'} prior members).\n`;
    md+='\n';
  }
  md+=`## Complete ledger\n\nSource offsets are UTF-8 bytes within the named asar entry. Full evidence, exact message text and activation qualifications are in [the structured ledger](${productOrigin('codex')}/devday-surface-coverage-records/).\n\n| # | Kind | Candidate | Disposition | Evidence and existing records |\n|---:|---|---|---|---|\n`;
  md+=candidates.map(c=>`| ${c.id} | ${c.kind} | \`${escape(c.name)}\` | ${c.disposition} | ${c.evidence.map(e=>`\`${e.file}\`${e.byte_offset!=null?` @ ${e.byte_offset}`:''} SHA-256 \`${e.sha256}\``).join('; ')||'No exact shipped match recovered'}${c.captured_in.length?'; '+c.captured_in.map(n=>`[${path.basename(n)}](${docLink(path.basename(n))})`).join(', '):''} |`).join('\n')+'\n';
  fs.writeFileSync(path.join(root,'outputs/devday-surface-coverage.md'),md);
  return report;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(generate(undefined,process.argv[2]??null).dispositions));
