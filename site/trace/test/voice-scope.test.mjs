import {test} from 'node:test';import assert from 'node:assert/strict';import {scopeVoice} from '../network/voice.js';
test('voice records from a different known thread cannot leak through a scoped HAR',()=>{
 const rows=[{kind:'datachannel',targetId:'a',peerId:'p',data:'mine'},{kind:'association',targetId:'a',peerId:'p',threadId:'111',callId:'rtc_mine'},{kind:'datachannel',targetId:'b',peerId:'p',data:'other'},{kind:'association',targetId:'b',peerId:'p',threadId:'222',callId:'rtc_other'},{kind:'datachannel',targetId:'c',peerId:'p',data:'unknown'}];
 const scoped=scopeVoice(rows,['111']);assert.ok(scoped.some(r=>r.data==='mine'));assert.ok(!scoped.some(r=>r.data==='other'));assert.equal(scoped.find(r=>r.data==='unknown')._traceAssociation,'unattributed');
});
