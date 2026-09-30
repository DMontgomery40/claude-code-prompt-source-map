#!/usr/bin/env node
// Agent entry point: no browser, resolver, existing thread or voice call required.
import {createDesktopRecorder} from './desktop-capture.mjs';
const args=process.argv.slice(2),action=args.shift();
const options={thread:null,renderer:false,openAfterCall:false,restart:false};
try{
 for(let i=0;i<args.length;i++){
  if(args[i]==='--thread')options.thread=args[++i];
  else if(args[i]==='--restart')options.restart=true;
  else if(args[i]==='--renderer')options.renderer=true;
  else if(args[i]==='--open-after-call')options.openAfterCall=true;
  else throw new Error('Unknown option');
 }
 if(!['arm','start','status','stop'].includes(action))throw new Error('usage: node tools/capture/trace-desktop.mjs arm|start|status|stop [--thread UUID] [--renderer]');
 if(action!=='arm'&&action!=='start'&&args.length)throw new Error('Recording options apply only to arm/start');
 if(options.restart&&action!=='arm')throw new Error('--restart requires arm and explicit approval to interrupt the app.');
 if(options.openAfterCall&&!options.renderer)throw new Error('--open-after-call requires the explicitly approved optional --renderer observer.');
 const recorder=createDesktopRecorder();
 if(action==='arm')await recorder.arm(options);
 if(action==='start')await recorder.start({targetThread:options.thread,renderer:options.renderer,openAfterCall:options.openAfterCall});
 if(action==='stop')await recorder.stop();
 const details=await recorder.details();
 console.log(JSON.stringify({...details,instructions:details.status.phase==='armed'?options.restart?'External worker will request the explicitly approved app exit in five seconds and relaunch recording.': 'Detached worker is waiting for the coordinated app exit, then launches recording automatically. No UI step is required.':undefined}));
}catch(error){console.error(JSON.stringify({error:{code:error.code||'ARGUMENT',message:error.message}}));process.exitCode=1;}
