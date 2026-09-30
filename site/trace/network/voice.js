// Optional voice evidence. Association comes from observed metadata, never timing.
export function scopeVoice(records=[],ids=[]){
 const mine=new Set(ids.map(x=>String(x).toLowerCase())),owners=new Map();
 const key=r=>`${r.targetId||''}:${r.peerId||''}`;
 for(const r of records)if(r.kind==='association'&&r.threadId)owners.set(key(r),String(r.threadId).toLowerCase());
 return records.filter(r=>!owners.has(key(r))||mine.has(owners.get(key(r)))).map(r=>({...r,_traceAssociation:owners.has(key(r))?'request-id':'unattributed'}));
}
export function summarizeVoice(records=[]){return {observed:records.some(r=>r.peerId),messages:records.filter(r=>r.kind==='datachannel').length,calls:[...new Set(records.filter(r=>r.kind==='association').map(r=>r.callId).filter(Boolean))],audio:'not recorded'};}
