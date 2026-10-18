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
