import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {firebaseServices} from '../lib/firebase/admin.js';
import {reserveCounters} from '../server/firebase-runtime.mjs';
const base=process.env.QA_URL||'http://127.0.0.1:4184';
const {auth,db}=firebaseServices();
let uid,cookie='',shareId,password=randomBytes(24).toString('hex');
const email=`qa-${Date.now()}@example.com`;
async function call(path,method='GET',body,extra={}){const r=await fetch(base+'/api/'+path,{method,headers:{cookie,'Content-Type':'application/json',...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await r.json();if(r.headers.get('set-cookie'))cookie=r.headers.get('set-cookie').split(';')[0];return {r,data};}
try{
 let result=await call('auth/register','POST',{email,password,displayName:'Temporary QA',adult:true});assert.equal(result.r.status,201);uid=result.data.member.id;
 assert.equal((await call('member/check-in','POST',{})).data.pointsGranted,5);
 assert.equal((await call('member/check-in','POST',{})).data.pointsGranted,0);
 assert.equal((await call('member/check-in','POST',{}, {origin:'https://untrusted.example'})).r.status,403);
 assert.equal((await call('admin/metrics')).r.status,403);
 assert.equal((await call('member/preferences','PATCH',{displayName:'Temporary QA',historyEnabled:true,cardStyle:'lemon'})).r.status,400);
 assert.equal((await call('member/activity','POST',{result:{title:'Fake',body:'Forged',source:'DECISION MACHINE · PLAYFUL'}})).r.status,400);
 const share=await call('shares','POST',{title:'QA share',body:'No personal context.',source:'DECISION MACHINE',context:'must never be stored'});assert.equal(share.r.status,201);shareId=share.data.id;
 const read=(await call('shares/'+shareId)).data;assert.equal(read.context,undefined);assert.equal(read.body,'No personal context.');
 assert.equal((await call('shares/'+shareId,'DELETE',{token:'wrong'})).r.status,403);
 assert.equal((await call('shares/'+shareId,'DELETE',{token:share.data.deleteToken})).r.status,200);shareId=null;
 if(process.env.QA_LIVE==='true'){const live=await call('wingman','POST',{situation:'opener',tone:'playful',context:'A short friendly coffee invitation.',adult:true});assert.equal(live.r.status,200);assert.equal(live.data.source,'AI WINGMAN · LIVE AI');assert.equal(live.data.memberAward.pointsGranted,10);}
 await call('auth/logout','POST',{});assert.equal((await call('auth/session')).data.member,null);
 result=await call('auth/login','POST',{email,password});assert.equal(result.r.status,200);
 const newPassword=randomBytes(24).toString('hex');assert.equal((await call('member/password','POST',{currentPassword:password,newPassword})).r.status,200);password=newPassword;
 await new Promise(resolve=>setTimeout(resolve,1100));assert.equal((await call('auth/login','POST',{email,password})).r.status,200);
 const resetLink=await auth.generatePasswordResetLink(email);const code=new URL(resetLink).searchParams.get('oobCode');const resetPassword=randomBytes(24).toString('hex');
 const reset=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=AIzaSyBBbN9gp6mKjGeUCzVggpT8TG6EHcEGVt0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({oobCode:code,newPassword:resetPassword})});assert.equal(reset.status,200);password=resetPassword;
 await new Promise(resolve=>setTimeout(resolve,1100));assert.equal((await call('auth/login','POST',{email,password})).r.status,200);
 const prefix='qa-limit-'+Date.now();const buckets=[{key:prefix,limit:1,expires:Date.now()+10000}];const reservations=await Promise.all([reserveCounters(db,buckets),reserveCounters(db,buckets)]);assert.equal(reservations.filter(Boolean).length,1);
 assert.equal((await call('member/account','DELETE',{password,confirmation:'DELETE'})).r.status,200);uid=null;
 assert.equal((await call('auth/session')).data.member,null);
 console.log('PASS Firebase: registration, session, points replay, origin rejection, admin isolation, locked rewards, forged activity rejection, share ownership/deletion, password change/recovery, atomic quotas, account deletion'+(process.env.QA_LIVE==='true'?', live OpenRouter and server-awarded points':''));
}finally{
 if(shareId)await db.collection('ihw_shares').doc(shareId).delete();
 if(uid){await db.collection('ihw_members').doc(uid).delete();await auth.deleteUser(uid).catch(()=>{});}
 await db.terminate();
}
