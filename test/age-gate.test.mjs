import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/age-gate.js',import.meta.url),'utf8');
function run({confirmed=false,blockedStorage=false}={}){
 const handlers={},attributes={'aria-hidden':'true'},state={open:true,modal:false,inert:true,pending:true,checked:false,focus:false,stored:null,exit:null};
 const gate={get open(){return state.open},close(){state.open=false},showModal(){state.open=true;state.modal=true},addEventListener(name,handler){handlers[name]=handler}};
 const content={get inert(){return state.inert},set inert(value){state.inert=value},setAttribute(name,value){attributes[name]=value},removeAttribute(name){delete attributes[name]}};
 const elements={'#age-gate':gate,'#site-content':content,'#adult-confirm':{set checked(value){state.checked=value}},'.hero h1':{focus(){state.focus=true}},'#age-enter':{addEventListener(name,handler){handlers.enter=handler}},'#age-leave':{addEventListener(name,handler){handlers.leave=handler}}};
 vm.runInNewContext(source,{document:{querySelector:selector=>elements[selector],body:{classList:{remove(name){if(name==='age-pending')state.pending=false}}}},sessionStorage:{getItem(){if(blockedStorage)throw Error('blocked');return confirmed?'yes':null},setItem(key,value){if(blockedStorage)throw Error('blocked');state.stored={key,value}}},location:{replace(url){state.exit=url}}});
 return {state,handlers,attributes};
}
test('new visits show the adult notice and keep the whole site inert and hidden',()=>{
 const {state,handlers}=run();assert(state.modal);assert(state.inert);assert(state.pending);assert(!state.checked);let prevented=false;handlers.cancel({preventDefault(){prevented=true}});assert(prevented);
});
test('explicit adult confirmation unlocks the site and remembers only this session',()=>{
 const {state,handlers,attributes}=run();handlers.enter();assert(!state.inert);assert(!state.pending);assert(!state.open);assert(state.checked);assert(state.focus);assert.equal(state.stored.value,'yes');assert(!('aria-hidden' in attributes));
});
test('returning confirmed visits do not show the gate again; storage restrictions do not trap the user',()=>{
 const returning=run({confirmed:true});assert(!returning.state.modal);assert(!returning.state.inert);assert(!returning.state.open);
 const privateSession=run({blockedStorage:true});privateSession.handlers.enter();assert(!privateSession.state.inert);assert(!privateSession.state.open);
});
test('Leave leads to a neutral local page without saving adult confirmation',()=>{
 const {state,handlers}=run();handlers.leave();assert.equal(state.exit,'/goodbye');assert.equal(state.stored,null);assert(state.inert);
});
