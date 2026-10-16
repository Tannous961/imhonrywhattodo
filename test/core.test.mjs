import test from 'node:test';
import assert from 'node:assert/strict';
import {plans} from '../public/content.mjs';
import {createPicker,decide,rouletteChoices,rouletteResult,nextRotation,normalizeResult,historyEntry,isLocalOrigin,wrapText} from '../public/core.mjs';

test('all 24 decision configurations give two distinct choices and all 48 curated suggestions are reachable',()=>{
 const pick=createPicker(()=>0),titles=new Set();
 for(const company of ['solo','partner','crush','bored'])for(const energy of ['low','high'])for(let boldness=0;boldness<3;boldness++){
  const first=decide({company,energy,boldness},pick),second=decide({company,energy,boldness},pick);
  assert.notEqual(first.title,second.title);normalizeResult(first);normalizeResult(second);titles.add(first.title);titles.add(second.title);
 }
 assert.equal(titles.size,48);assert.equal(Object.values(plans).flatMap(x=>Object.values(x).flat()).length,48);
 assert.throws(()=>decide({company:'unknown',energy:'low',boldness:0},pick));
});
test('wheel pointer matches every outcome across repeated spins, with bounded filters',()=>{
 let rotation=0;
 for(let spin=0;spin<30;spin++)for(let index=0;index<6;index++){
  const next=nextRotation(rotation,index);assert(next>=rotation+1800);assert.equal(Math.floor(((360-next%360)%360)/60),index);assert(rouletteResult(index).source.includes('ROULETTE'));rotation=next;
 }
 assert.deepEqual(rouletteChoices('out'),[1]);assert.deepEqual(rouletteChoices('stay'),[0,3]);assert.deepEqual(rouletteChoices('connect'),[2,4]);assert.equal(rouletteChoices('any').length,6);
 assert.throws(()=>nextRotation(0,6));assert.throws(()=>nextRotation(NaN,1));
});
test('result validation rejects corrupt history and optional context is excluded from saved history',()=>{
 const input={title:'A plot twist',body:'A usable idea.',source:'TEST',context:'private context'};
 assert.deepEqual(historyEntry(input),{title:input.title,body:input.body,source:input.source});
 for(const invalid of [null,{}, {...input,title:'x'.repeat(181)},{...input,body:42},{...input,context:{html:'no'}}])assert.throws(()=>normalizeResult(invalid));
 assert.equal(isLocalOrigin('http://localhost:4173'),true);assert.equal(isLocalOrigin('http://127.0.0.1:4173'),true);assert.equal(isLocalOrigin('http://[::1]:4173'),true);assert.equal(isLocalOrigin('https://imhornywhattodo.com'),false);
});
test('roulette includes three different usable suggestions in each category',()=>{
 const pick=createPicker(()=>0.99),titles=new Set();
 for(let category=0;category<6;category++)for(let turn=0;turn<5;turn++){const result=rouletteResult(category,pick);normalizeResult(result);titles.add(result.title)}
 // The no-repeat picker avoids its last choice; catalogue reachability is also checked with a cycling random source.
 let value=0;const cycle=createPicker(()=>{value=(value+0.37)%1;return value});
 for(let category=0;category<6;category++)for(let turn=0;turn<30;turn++)titles.add(rouletteResult(category,cycle).title);
 assert.equal(titles.size,18);
});
test('export text wrapping preserves paragraphs and bounds long tokens, Unicode and truncation',()=>{
 const measure=text=>Array.from(text).length;
 for(const value of ['a'.repeat(100),'🙂'.repeat(60),'a short sentence and a verylongwordwithoutspaces','first paragraph\n\nsecond paragraph']){
  const block=wrapText(value,measure,12,6);assert(block.lines.length<=6);assert(block.lines.every(line=>measure(line)<=12));
 }
 const long=wrapText('hello '.repeat(80),measure,12,3);assert(long.truncated);assert(long.lines.at(-1).endsWith('…'));
 assert.deepEqual(wrapText('first\n\nsecond',measure,20).lines,['first','','second']);
});
