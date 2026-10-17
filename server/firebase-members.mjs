import {randomUUID} from 'node:crypto';
import {canonicalKind,validateRoulette} from './firebase-validation.mjs';
const daily={visit:5,decision:10,roulette:10,wingman:10,favorite:5,challenge:15},cap=55;
const rewards=[{id:'lemon-cards',name:'Lemon Pop cards',cost:50,description:'Unlock a lime frame.'},{id:'peach-cards',name:'Peach Glow cards',cost:90,description:'Unlock a peach frame.'},{id:'menace-badge',name:'Little Menace badge',cost:100,description:'Add a devil badge.'}];
const clean=r=>({title:r.title,body:r.body,source:r.source});
const ref=(db,uid)=>db.collection('ihw_members').doc(uid);
const base=(user)=>({username:user.email||user.uid,displayName:user.displayName||'Chaos member',balance:20,lifetime:20,ledger:[],ownedRewards:[],preferences:{historyEnabled:false,cardStyle:'classic'},favorites:[],history:[],challenges:[],daily:{}});
export async function handleMember({req,res,route,user,db,send,readJSON}){
 if(!route.startsWith('/api/member/'))return false;if(!user)return send(res,401,{error:'Sign in to continue.'}),true;
 const doc=ref(db,user.uid),snap=await doc.get();let data=snap.exists?snap.data():base(user);const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
 const reply=body=>{send(res,200,{member:{...data,favorites:undefined,history:undefined,challenges:undefined}});return true};
 if(route==='/api/member/check-in'&&req.method==='POST'){let granted=0;await db.runTransaction(async t=>{const s=await t.get(doc);const d=s.exists?s.data():data;d.daily=d.daily||{};if(d.daily[day]?.visit)return;d.daily[day]={...(d.daily[day]||{}),visit:5};d.balance=(d.balance||0)+5;d.lifetime=(d.lifetime||0)+5;granted=5;t.set(doc,d)});return reply({pointsGranted:granted})}
 if(route==='/api/member/activity'&&req.method==='POST'){const body=await readJSON(req),kind=canonicalKind(body?.result);if(!kind)return send(res,400,{error:'Generate a fresh playground result.'}),true;let granted=0;await db.runTransaction(async t=>{const s=await t.get(doc);const d=s.exists?s.data():data;d.daily=d.daily||{};const used=Object.values(d.daily[day]||{}).reduce((a,b)=>a+b,0);if(!d.daily[day]?.[kind]&&used<cap){granted=Math.min(daily[kind],cap-used);d.daily[day]={...(d.daily[day]||{}),[kind]:granted};d.balance=(d.balance||0)+granted;d.lifetime=(d.lifetime||0)+granted}t.set(doc,d)});return reply({pointsGranted:granted})}
 if(route==='/api/member/favorites'&&req.method==='POST'){const r=clean(await readJSON(req));data.favorites=[...(data.favorites||[]),r].slice(-30);await doc.set(data,{merge:true});return reply({pointsGranted:0})}
 if(route==='/api/member/favorites'&&req.method==='GET')return send(res,200,{results:data.favorites||[]}),true;
 if(route==='/api/member/history'&&req.method==='GET')return send(res,200,{results:data.history||[]}),true;
 if(route==='/api/member/challenges'&&req.method==='GET')return send(res,200,{challenges:data.challenges||[]}),true;
 if(route==='/api/member/challenges'&&req.method==='POST'){const r=validateRoulette((await readJSON(req)).result);if((data.challenges||[]).some(x=>x.status==='active'))return send(res,409,{error:'Finish your active challenge first.'}),true;const c={id:randomUUID(),...r,status:'active',createdAt:new Date().toISOString()};data.challenges=[...(data.challenges||[]),c];await doc.set(data,{merge:true});return send(res,201,{challengeId:c.id}),true}
 if(route==='/api/member/redeem'&&req.method==='POST'){const id=(await readJSON(req)).rewardId,r=rewards.find(x=>x.id===id);if(!r||data.balance<r.cost)return send(res,400,{error:'Not enough points.'}),true;data.balance-=r.cost;data.ownedRewards=[...(data.ownedRewards||[]),id];await doc.set(data,{merge:true});return reply({spent:r.cost})}
 if(route==='/api/member/preferences'&&req.method==='PATCH'){const p=await readJSON(req);data.preferences={historyEnabled:!!p.historyEnabled,cardStyle:p.cardStyle||'classic'};await doc.set(data,{merge:true});return reply({})}
 return send(res,404,{error:'Member endpoint not found.'}),true;
}
