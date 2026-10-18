import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/member.mjs',import.meta.url),'utf8');

test('an outdated account server produces an explicit compatibility error before changing the session',()=>{
 const fn=source.slice(source.indexOf('function accept(data){'),source.indexOf('export function acceptMemberAward'));
 const context={member:null};vm.createContext(context);vm.runInContext(fn,context);
 assert.throws(()=>vm.runInContext('accept({member:{id:"old-server"}})',context),/server is out of date/);
 assert.equal(context.member,null);
});

test('network errors are identified at fetch, while rendering failures are not reported as network failures',async()=>{
 const fn=source.slice(source.indexOf('async function api('),source.indexOf('const text='));
 const context={csrf:null,member:null,memberHeaders:()=>({}),AbortSignal,fetch:async()=>{throw new TypeError('network failure')}};
 vm.createContext(context);vm.runInContext(fn,context);
 await assert.rejects(vm.runInContext('api("auth/session")',context),/Cannot reach the account service/);
 const run=source.slice(source.indexOf('async function run('),source.indexOf('function accept(data){'));
 let message='';context.$=()=>({open:false});context.text=(selector,value)=>{message=value};
 vm.runInContext(run,context);
 await vm.runInContext('run(async()=>{throw new TypeError("view failure")})',context);
 assert.match(message,/account view could not update/);
 assert.doesNotMatch(message,/reach/);
});
