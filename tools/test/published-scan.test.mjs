import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {publishedText,forbiddenMatcher} from '../privacy/published-scan.mjs';

test('gzip logs expose secrets to the ordinary publication boundary',()=>{
  const match=forbiddenMatcher([['example.secret+value','credential']]);
  const bytes=gzipSync('{"text":"example.secret+value"}\n');
  assert.deepEqual(match(publishedText(bytes,'session.jsonl.gz')),[{kind:'credential',length:20}]);
  assert.deepEqual(match('exampleXsecretvalue'),[]);
});
test('compressed logs fail closed on corruption, binary content and oversized expansion',()=>{
  assert.throws(()=>publishedText(Buffer.from('broken'),'session.jsonl.gz'));
  assert.throws(()=>publishedText(gzipSync(Buffer.from([0,1,2])),'session.jsonl.gz'));
  assert.throws(()=>publishedText(gzipSync('x'.repeat(1000)),'session.jsonl.gz',{maxOutputLength:100}));
  assert.throws(()=>publishedText(gzipSync('text'),'session.jsonl.gz.part-001'));
});
test('ordinary source remains readable and ordinary binary assets remain excluded',()=>{
  assert.equal(publishedText(Buffer.from('ordinary source'),'source.js'),'ordinary source');
  assert.equal(publishedText(Buffer.from([0,1,2]),'image.png'),null);
  assert.equal(publishedText(gzipSync(Buffer.from([0,1,2])),'evidence.tar.gz'),null);
});
