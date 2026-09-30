import {gunzipSync} from 'node:zlib';

// Compressed public source logs must pass the same boundary as ordinary text.
// Do not let binary detection or the on-disk size limit hide gzip contents.
export function publishedText(buffer, filename, {maxOutputLength=768*1024*1024}={}) {
  if (/\.gz\.part-\d+$/.test(filename)) throw new Error('Multipart gzip requires assembled privacy review.');
  if (/\.gz$/.test(filename)) {
    const expanded=gunzipSync(buffer,{maxOutputLength});
    if (expanded.includes(0)) {
      if(/\.(?:jsonl|json|txt)\.gz$/.test(filename)) throw new Error('Compressed public source contains binary data.');
      return null; // Existing binary archives are handled like ordinary binary assets.
    }
    return new TextDecoder('utf-8',{fatal:true}).decode(expanded);
  }
  return buffer.includes(0)?null:buffer.toString('utf8');
}

export function forbiddenMatcher(entries) {
  const kinds=new Map(entries);
  const escape=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const pattern=new RegExp([...kinds.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|') || '(?!)','g');
  return text=> {
    const found=new Map();
    for (const match of text.matchAll(pattern)) found.set(match[0],kinds.get(match[0]));
    return [...found].map(([value,kind])=>({kind,length:value.length}));
  };
}
