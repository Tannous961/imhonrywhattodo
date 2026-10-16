import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import http from 'node:http';
import {createMemberStore,dailyRules} from '../server/member-store.mjs';
import {hashPassword,verifyPassword,validPassword,hashToken} from '../server/passwords.mjs';
import {createApplication,configuration} from '../server/app.mjs';
import {decide,rouletteResult} from '../public/core.mjs';
const sample={title:'A private idea',body:'Say hello.',source:'TEST',context:'Do not store me'};
const create=(m,name)=>m.create({username:name,displayName:name,passwordHash:'testhash',recoveryHash:'testrecovery'});
test('member ledger: daily cap, replay, lifetime levels, reward debits and owned styles',()=>{
 const db=new DatabaseSync(':memory:'),m=createMemberStore(db);try{
 const id=create(m,'first'),now=Date.now();assert.equal(m.snapshot(id).balance,20);
 assert.equal(m.checkIn(id,now),5);assert.equal(m.checkIn(id,now),0);
 for(const kind of ['decision','roulette','wingman'])assert.equal(m.activity(id,kind,sample,now),10);
 assert.equal(m.favorite(id,sample,now).points,5);assert.equal(m.snapshot(id).daily.earned,40);assert.equal(m.snapshot(id).balance,60);
 assert.equal(m.activity(id,'wingman',sample,now),0);
 assert.throws(()=>m.preferences(id,{displayName:'first',historyEnabled:false,cardStyle:'lemon'}),/Unlock/);
 assert.equal(m.redeem(id,'lemon-cards').spent,50);assert.equal(m.redeem(id,'lemon-cards').spent,0);assert.equal(m.snapshot(id).balance,10);assert.equal(m.snapshot(id).lifetime,60);assert.equal(m.snapshot(id).level.name,'Plot Starter');
 assert.throws(()=>m.redeem(id,'peach-cards'),/Not enough/);assert.throws(()=>m.redeem(id,'made-up'),/Unknown/);
 m.preferences(id,{displayName:'first',historyEnabled:true,cardStyle:'lemon'});assert.equal(m.snapshot(id).preferences.cardStyle,'lemon');
 const next=now+86400000;assert.equal(m.checkIn(id,next),5);assert.equal(m.activity(id,'wingman',sample,next),10);
 }finally{db.close()}
});
test('private data: bounded history, consent, context removal, ownership and account cascade',()=>{
 const db=new DatabaseSync(':memory:'),m=createMemberStore(db);try{
 const id=create(m,'first'),other=create(m,'other');m.activity(id,'wingman',sample);assert.equal(m.list(id,'history').length,0);
 m.preferences(id,{displayName:'first',historyEnabled:true,cardStyle:'classic'});
 for(let i=0;i<55;i++)m.activity(id,'wingman',{...sample,title:'Idea '+i});assert.equal(m.list(id,'history').length,50);assert(!JSON.stringify(m.list(id,'history')).includes('Do not store me'));
 const result=m.favorite(id,sample);assert.equal(m.list(other,'favorite').length,0);assert.equal(m.removeResult(other,result.id,'favorite'),false);
 for(let i=0;i<29;i++)m.favorite(id,{...sample,title:'Saved '+i});assert.throws(()=>m.favorite(id,{...sample,title:'One too many'}),/30/);
 m.addSession('hash',id,'csrf',Date.now()+50000);assert(m.session('hash'));assert.equal(m.deleteAccount(id,'wrong'),false);assert.equal(m.deleteAccount(id,'testhash'),true);assert.equal(m.session('hash'),null);
 for(const table of ['member_results','member_rewards','point_ledger','member_sessions'])assert.equal(db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE user_id=?`).get(id).n,0);
 }finally{db.close()}
});
test('passwords: salted scrypt, validation and constant-time verification',async()=>{
 assert(validPassword('a-local-test-password'));assert(!validPassword('short'));assert(!validPassword('a'.repeat(129)));
 const a=await hashPassword('a-local-test-password'),b=await hashPassword('a-local-test-password');assert.notEqual(a,b);assert(!a.includes('a-local-test-password'));assert(await verifyPassword('a-local-test-password',a));assert(!await verifyPassword('wrong',a));assert(!await verifyPassword('wrong',null));
});
async function fixture(){const app=createApplication({config:configuration({DATA_DIR:':memory:'})}),server=http.createServer(app.handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;return {client(){let cookie='',csrf='';return {async call(route,method='GET',body,headers={}){const res=await fetch(base+'/api/'+route,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await res.json();const next=res.headers.get('set-cookie');if(next)cookie=next.split(';')[0];if(data.csrf!==undefined)csrf=data.csrf;return {status:res.status,data,headers:res.headers}},cookies:()=>cookie}},async close(){server.closeAllConnections();await new Promise(r=>server.close(r));app.close()}}}
const registration=name=>({username:name,displayName:'Local Tester',password:'only-for-local-testing-123',adult:true});
test('HTTP accounts: sign in, CSRF, private favourites, canonical rewards and logout',async()=>{
 const f=await fixture();try{const a=f.client(),b=f.client();assert.equal((await a.call('auth/session')).data.member,null);assert.equal((await a.call('auth/register','POST',{...registration('tester'),adult:false})).status,400);
 const signed=await a.call('auth/register','POST',registration('tester'));assert.equal(signed.status,201);assert.equal(signed.data.member.balance,20);assert.match(signed.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);assert(signed.data.recoveryCode);assert(!JSON.stringify(signed.data.member).includes('password'));
 assert.equal((await a.call('member/check-in','POST',{}, {'X-CSRF-Token':'wrong'})).status,403);assert.equal((await a.call('member/check-in','POST',{})).data.member.balance,25);assert.equal((await a.call('member/check-in','POST',{})).data.pointsGranted,0);
 assert.equal((await a.call('member/activity','POST',{result:sample,points:9000})).status,400);
 const canonical=decide({company:'solo',energy:'low',boldness:1},items=>items[0]);assert.equal((await a.call('member/activity','POST',{result:canonical,points:9000})).data.pointsGranted,10);assert.equal((await a.call('member/activity','POST',{result:canonical})).data.pointsGranted,0);
 const saved=await a.call('member/favorites','POST',sample);assert.equal(saved.status,201);await b.call('auth/register','POST',registration('other'));assert.equal((await b.call('member/favorites')).data.results.length,0);assert.equal((await b.call('member/favorites/'+saved.data.resultId,'DELETE')).status,404);
 assert.equal((await a.call('member/preferences','PATCH',{displayName:'Local Tester',historyEnabled:false,cardStyle:'lemon'})).status,400);assert.equal((await a.call('member/redeem','POST',{rewardId:'lemon-cards',cost:0})).status,400);
 assert.equal((await a.call('auth/logout','POST',{})).status,200);assert.equal((await a.call('member/favorites')).status,401);assert.equal((await a.call('auth/login','POST',{username:'tester',password:'wrong'})).status,401);assert.equal((await a.call('auth/login','POST',registration('tester'))).status,200);
 }finally{await f.close()}
});
test('HTTP recovery rotates secrets, invalidates sessions, password change and deletion',async()=>{
 const f=await fixture();try{const a=f.client(),b=f.client();const signup=await a.call('auth/register','POST',registration('recoverme'));const code=signup.data.recoveryCode;await b.call('auth/login','POST',registration('recoverme'));
 const recovered=await a.call('auth/recover','POST',{username:'recoverme',recoveryCode:code,newPassword:'the-new-test-password'});assert.equal(recovered.status,200);assert.notEqual(recovered.data.recoveryCode,code);assert.equal((await b.call('member/favorites')).status,401);
 assert.equal((await a.call('auth/recover','POST',{username:'recoverme',recoveryCode:code,newPassword:'the-new-test-password'})).status,401);assert.equal((await a.call('auth/login','POST',{username:'recoverme',password:'the-new-test-password'})).status,200);
 assert.equal((await a.call('member/password','POST',{currentPassword:'the-new-test-password',newPassword:'a-third-test-password'})).status,200);assert.equal((await a.call('member/account','DELETE',{password:'a-third-test-password',confirmation:'NO'})).status,400);assert.equal((await a.call('member/account','DELETE',{password:'a-third-test-password',confirmation:'DELETE'})).status,200);assert.equal((await a.call('auth/session')).data.member,null);
 }finally{await f.close()}
});

test('member SQLite survives reopening with balance, rewards and private results intact',async()=>{
 const {mkdtempSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const path=await import('node:path');const {createStore}=await import('../server/store.mjs');const dir=mkdtempSync(path.join(tmpdir(),'ihw-member-'));let store=createStore(dir);try{
 const m=store.members,id=create(m,'persistent');for(const kind of Object.keys(dailyRules)){if(kind==='visit')m.checkIn(id);else if(kind==='favorite')m.favorite(id,sample);else m.activity(id,kind,sample)}m.redeem(id,'lemon-cards');store.close();store=createStore(dir);assert.equal(store.members.snapshot(id).balance,25);assert(store.members.snapshot(id).ownedRewards.includes('lemon-cards'));assert.equal(store.members.list(id,'favorite').length,1);
 }finally{store.close();rmSync(dir,{recursive:true,force:true})}
});

test('challenge lifecycle is private, persistent, idempotent and awards completion once',()=>{
 const db=new DatabaseSync(':memory:'),m=createMemberStore(db);try{
 const id=create(m,'challenger'),other=create(m,'watcher'),result={title:'Take a walk.',body:'Pick a route and enjoy it.',source:'HORNY ROULETTE · RESET'},now=Date.now();
 const challengeId=m.acceptChallenge(id,result,now);assert.equal(m.challenges(id)[0].status,'active');assert.equal(m.challenges(other).length,0);assert.throws(()=>m.acceptChallenge(id,result,now),/active challenge/);
 assert.throws(()=>m.closeChallenge(other,challengeId,'completed',now),/not found/i);
 const complete=m.closeChallenge(id,challengeId,'completed',now);assert.equal(complete.points,15);assert.equal(m.snapshot(id).balance,35);assert(m.snapshot(id).badges.find(b=>b.id==='first-move').owned);
 const replay=m.closeChallenge(id,challengeId,'completed',now);assert.equal(replay.points,0);assert.equal(replay.alreadyClosed,true);assert.throws(()=>m.closeChallenge(id,challengeId,'skipped',now),/already closed/);
 const skippedId=m.acceptChallenge(id,{...result,title:'Another move.'},now);assert.equal(m.closeChallenge(id,skippedId,'skipped',now).points,0);assert.equal(m.challenges(id).filter(c=>c.status!=='active').length,2);
 }finally{db.close()}
});

test('HTTP challenges accept only canonical Roulette results and keep one active item',async()=>{
 const f=await fixture();try{const user=f.client();await user.call('auth/register','POST',registration('challenge_http'));const roulette=rouletteResult(0,items=>items[0]);
 assert.equal((await user.call('member/challenges','POST',{result:sample})).status,400);
 const accepted=await user.call('member/challenges','POST',{result:roulette});assert.equal(accepted.status,201);assert.equal((await user.call('member/challenges','POST',{result:roulette})).status,409);
 let list=await user.call('member/challenges');assert.equal(list.data.challenges[0].status,'active');
 const done=await user.call('member/challenges/'+accepted.data.challengeId,'PATCH',{status:'completed'});assert.equal(done.status,200);assert.equal(done.data.pointsGranted,15);assert.equal(done.data.member.daily.cap,55);
 const replay=await user.call('member/challenges/'+accepted.data.challengeId,'PATCH',{status:'completed'});assert.equal(replay.data.pointsGranted,0);
 list=await user.call('member/challenges');assert.equal(list.data.challenges[0].status,'completed');assert(list.data.member===undefined);
 }finally{await f.close()}
});
test('live Wingman awards the authenticated account on the server, once per day',async()=>{
 const app=createApplication({config:configuration({DATA_DIR:':memory:',OPENAI_API_KEY:'fake-test-key'}),fetcher:async()=>new Response(JSON.stringify({output:[{type:'message',content:[{type:'output_text',text:'Want to grab coffee and compare bookshop finds?'}]}]}),{status:200,headers:{'Content-Type':'application/json'}})});const server=http.createServer(app.handler);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;try{
 const signup=await fetch(base+'/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(registration('live_tester'))});const data=await signup.json(),cookie=signup.headers.get('set-cookie').split(';')[0];const headers={'Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':data.csrf};
 const invoke=()=>fetch(base+'/api/wingman',{method:'POST',headers,body:JSON.stringify({situation:'opener',tone:'playful',context:'Books',adult:true})});
 const one=await (await invoke()).json();assert.equal(one.memberAward.pointsGranted,10);assert.equal(one.memberAward.member.balance,30);const two=await (await invoke()).json();assert.equal(two.memberAward.pointsGranted,0);
 const fake=await fetch(base+'/api/member/activity',{method:'POST',headers,body:JSON.stringify({result:{title:one.title,body:one.body,source:one.source}})});assert.equal(fake.status,400);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));app.close()}
});
