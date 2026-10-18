import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

test('Wingman distinguishes selected demo from live AI and requests sign-in only for AI',()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const mode=source.slice(source.indexOf('function modeUI(){'),source.indexOf('async function checkService(){'));
 const elements=new Map();
 const $=selector=>{if(!elements.has(selector))elements.set(selector,{setAttribute(k,v){this[k]=v}});return elements.get(selector)};
 let member=null;
 const context={$,getMember:()=>member,backend:{mode:'live'},wingmanBusy:false};
 vm.createContext(context);vm.runInContext(mode,context);
 $('#use-demo').checked=true;vm.runInContext('modeUI()',context);
 assert.equal($('.demo-tag').textContent,'TEMPLATE DEMO');
 assert.equal($('#context').disabled,true);
 assert.equal($('#switch-to-ai').hidden,false);
 assert.equal($('#wingman-signin').hidden,true);
 $('#use-demo').checked=false;vm.runInContext('modeUI()',context);
 assert.equal($('.demo-tag').textContent,'LIVE AI');
 assert.equal($('#context').disabled,false);
 assert.equal($('#wingman-signin').hidden,false);
 member={id:'test'};vm.runInContext('modeUI()',context);
 assert.equal($('#wingman-signin').hidden,true);
 assert.match($('#wingman-status').textContent,/1 live AI request/);
 context.backend.mode='offline';$('#use-demo').checked=true;vm.runInContext('modeUI()',context);
 assert.equal($('#switch-to-ai').disabled,true);
 assert.match($('#wingman-status').textContent,/unavailable/);
});

test('AI is selected when available, while an explicit demo choice survives service retries',async()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('async function checkService(){'),source.indexOf("$('#use-demo').addEventListener"));
 const nodes=new Map();const $=key=>{if(!nodes.has(key))nodes.set(key,{});return nodes.get(key)};
 const context={$,backend:{},modeChosen:false,requestJSON:async()=>({mode:'live'}),modeUI(){},shareNote(){}};
 vm.createContext(context);vm.runInContext(fn,context);
 $('#use-demo').checked=true;await vm.runInContext('checkService()',context);
 assert.equal($('#use-demo').checked,false);
 context.modeChosen=true;$('#use-demo').checked=true;await vm.runInContext('checkService()',context);
 assert.equal($('#use-demo').checked,true);
});

test('a generated reply is rendered as text in its own full-width card',()=>{
 const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const fn=source.slice(source.indexOf('function renderWingmanReply('),source.indexOf('const demoTitles='));
 const classes=new Set(),nodes=new Map();const $=key=>{if(!nodes.has(key))nodes.set(key,{classList:{add:x=>classes.add(x)}});return nodes.get(key)};
 const context={$};vm.createContext(context);vm.runInContext(fn,context);
 context.result={body:'<test> Coffee tomorrow?',source:'AI WINGMAN · LIVE AI'};
 vm.runInContext('renderWingmanReply(result)',context);
 assert.equal($('.message-options p').textContent,'<test> Coffee tomorrow?');
 assert.equal($('.message-options .reply-origin').textContent,'Your AI reply');
 assert.equal(classes.has('has-generated'),true);
 assert.equal($('#wingman-view').hidden,false);
});
