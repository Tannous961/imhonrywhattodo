import {randomBytes,createHmac} from 'node:crypto';
import {hashPassword,verifyPassword,validPassword,hashToken,sameSecret} from './passwords.mjs';
import {normalizeResult} from '../public/core.mjs';
import {plans,rouletteVariants,outcomes,lines} from '../public/content.mjs';

const invalid=(message,status=400)=>Object.assign(Error(message),{status});
const canonical=new Set();
const signature=result=>JSON.stringify([result.source,result.title,result.body]);
for(const company of Object.values(plans))for(const options of Object.values(company))options.forEach(([title,body],i)=>canonical.add(signature({title,body,source:'DECISION MACHINE · '+['SOFT LAUNCH','PLAYFUL','PLOT TWIST'][i%3]})));
rouletteVariants.forEach((variants,i)=>variants.forEach(([title,body])=>canonical.add(signature({title,body,source:'HORNY ROULETTE · '+outcomes[i][0].toUpperCase()}))));
const demoBodies=new Set(Object.values(lines).flatMap(modes=>Object.values(modes).flat()));
const username=value=>typeof value==='string'?value.trim().toLowerCase():'';
const validName=value=>typeof value==='string'&&value.trim().length>=2&&value.trim().length<=32&&!/[\u0000-\u001f\u007f]/.test(value);
function validateResult(body){try{return normalizeResult(body)}catch{throw invalid('Choose a valid result to save.')}}

export function createMemberService({store,config,send,readJSON,rate,checkRate}){
 const data=store.members,secure=new URL(config.publicURL).protocol==='https:',cookieName=secure?'__Host-ihw_session':'ihw_local_session';let hashing=0;
 function session(req){
  const cookies=String(req.headers.cookie||'').split(';').map(part=>part.trim());
  const token=cookies.find(part=>part.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const key=hashToken(token),found=data.session(key);return found?{...found,tokenHash:key}:null;
 }
 const hasCSRF=(req,current)=>current&&sameSecret(req.headers['x-csrf-token']||'',current.csrf);
 const requireSession=(req,write=false)=>{const current=session(req);if(!current)throw invalid('Sign in to continue.',401);if(write&&!hasCSRF(req,current))throw invalid('Your session changed. Refresh the page and try again.',403);return current};
 function setCookie(res,token,maxAge=43200){res.setHeader('Set-Cookie',`${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`)}
 function issue(req,res,id){
  const previous=session(req);if(previous)data.revoke(previous.tokenHash);
  const token=randomBytes(32).toString('base64url'),csrf=randomBytes(24).toString('base64url');data.addSession(hashToken(token),id,csrf,Date.now()+43200000);setCookie(res,token);return csrf;
 }
 const payload=(id,csrf)=>({member:data.snapshot(id),csrf});
 async function costly(fn){if(hashing>=2)throw invalid('Account service is busy. Try again in a moment.',503);hashing++;try{return await fn()}finally{hashing--}}
 function authLimit(req,res,name){
  if(!checkRate(res,rate(req,'account-auth',[[900000,12],[86400000,60]])))return false;
  const end=(Math.floor(Date.now()/900000)+1)*900000;
  const key='auth-name:'+createHmac('sha256',store.secret).update(name).digest('hex')+':'+end;
  return checkRate(res,store.consume([{key,limit:12,expires:end}]));
 }
 async function handle(req,res,route){
  if(!route.startsWith('/api/auth/')&&!route.startsWith('/api/member/'))return false;
  const reply=(status,body)=>{send(res,status,body);return true};
  if(route==='/api/auth/session'&&req.method==='GET'){const current=session(req);return reply(200,current?payload(current.user_id,current.csrf):{member:null,csrf:null})}
  if(route==='/api/auth/register'&&req.method==='POST'){
   const body=await readJSON(req),name=username(body?.username);
   if(!/^[a-z0-9_]{3,24}$/.test(name)||!validName(body?.displayName)||!validPassword(body?.password)||body?.adult!==true)throw invalid('Use a 3–24 character username (letters, numbers, underscore), a 2–32 character display name, a 12–128 character password, and confirm you are 18+.');
   if(!authLimit(req,res,name))return true;
   const recoveryCode=randomBytes(32).toString('base64url');
   const id=await costly(async()=>{
    const passwordHash=await hashPassword(body.password);
    try{return data.create({username:name,displayName:body.displayName.trim(),passwordHash,recoveryHash:hashToken(recoveryCode)})}
    catch(error){if(data.byName(name))throw invalid('That username is already taken.',409);throw error}
   });
   const csrf=issue(req,res,id);return reply(201,{...payload(id,csrf),recoveryCode});
  }
  if(route==='/api/auth/login'&&req.method==='POST'){
   const body=await readJSON(req),name=username(body?.username);
   if(!/^[a-z0-9_]{3,24}$/.test(name)||typeof body?.password!=='string'||body.password.length>128)throw invalid('Username or password is incorrect.',401);
   if(!authLimit(req,res,name))return true;
   const member=data.byName(name),correct=await costly(()=>verifyPassword(body.password,member?.password_hash));
   // Re-read after the expensive hash in case the password changed in another request.
   if(!correct||data.byId(member.id)?.password_hash!==member.password_hash)throw invalid('Username or password is incorrect.',401);
   return reply(200,payload(member.id,issue(req,res,member.id)));
  }
  if(route==='/api/auth/recover'&&req.method==='POST'){
   const body=await readJSON(req),name=username(body?.username);
   if(!/^[a-z0-9_]{3,24}$/.test(name)||typeof body?.recoveryCode!=='string'||body.recoveryCode.length>100||!validPassword(body?.newPassword))throw invalid('Check the username, recovery code and new password.');
   if(!authLimit(req,res,name))return true;
   const member=data.byName(name),given=hashToken(body.recoveryCode.trim()),correct=sameSecret(given,member?.recovery_hash||'0'.repeat(64));
   const nextCode=randomBytes(32).toString('base64url');
   const nextHash=await costly(()=>hashPassword(body.newPassword));
   if(!correct||!data.resetPassword(member.id,given,nextHash,hashToken(nextCode)))throw invalid('Username or recovery code is incorrect.',401);
   setCookie(res,'',0);return reply(200,{recoveryCode:nextCode,message:'Password reset. All previous sessions and the old recovery code are now invalid. Sign in again.'});
  }
  const current=requireSession(req,!['GET','HEAD'].includes(req.method)),id=current.user_id;
  if(route==='/api/auth/logout'&&req.method==='POST'){data.revoke(current.tokenHash);setCookie(res,'',0);return reply(200,{member:null,csrf:null})}
  if(route==='/api/member/check-in'&&req.method==='POST'){const pointsGranted=data.checkIn(id);return reply(200,{...payload(id,current.csrf),pointsGranted})}
  if(route==='/api/member/activity'&&req.method==='POST'){
   const body=await readJSON(req),result=validateResult(body?.result);let kind;
   if(canonical.has(signature(result)))kind=result.source.startsWith('DECISION MACHINE')?'decision':'roulette';
   else if(result.source==='AI WINGMAN · TEMPLATE DEMO'&&demoBodies.has(result.body))kind='wingman';
   else throw invalid('Generate a fresh playground result to record this activity.');
   const pointsGranted=data.activity(id,kind,result);return reply(200,{...payload(id,current.csrf),pointsGranted});
  }
  if(route==='/api/member/favorites'&&req.method==='GET')return reply(200,{results:data.list(id,'favorite')});
  if(route==='/api/member/history'&&req.method==='GET')return reply(200,{results:data.list(id,'history')});
  if(route==='/api/member/challenges'&&req.method==='GET')return reply(200,{challenges:data.challenges(id)});
  if(route==='/api/member/challenges'&&req.method==='POST'){
   const result=validateResult((await readJSON(req))?.result);
   if(!result.source.startsWith('HORNY ROULETTE · ')||!canonical.has(signature(result)))throw invalid('Spin the Roulette to choose a recognised challenge.');
   const challengeId=data.acceptChallenge(id,result);return reply(201,{...payload(id,current.csrf),challengeId});
  }
  const challenge=route.match(/^\/api\/member\/challenges\/([A-Za-z0-9_-]{24})$/);
  if(challenge&&req.method==='PATCH'){
   const body=await readJSON(req);if(!['completed','skipped'].includes(body?.status))throw invalid('Choose completed or skipped.');
   const outcome=data.closeChallenge(id,challenge[1],body.status);return reply(200,{...payload(id,current.csrf),status:outcome.status,pointsGranted:outcome.points,alreadyClosed:outcome.alreadyClosed});
  }
  if(route==='/api/member/favorites'&&req.method==='POST'){
   const result=validateResult(await readJSON(req)),saved=data.favorite(id,result);return reply(201,{...payload(id,current.csrf),resultId:saved.id,pointsGranted:saved.points});
  }
  const favorite=route.match(/^\/api\/member\/favorites\/([a-f0-9]{64})$/);
  if(favorite&&req.method==='DELETE'){const deleted=data.removeResult(id,favorite[1],'favorite');return reply(deleted?200:404,deleted?{deleted:true}:{error:'Favourite not found.'})}
  if(route==='/api/member/history'&&req.method==='DELETE'){data.clearHistory(id);return reply(200,{deleted:true})}
  if(route==='/api/member/preferences'&&req.method==='PATCH'){
   const body=await readJSON(req);if(!validName(body?.displayName)||typeof body?.historyEnabled!=='boolean'||typeof body?.cardStyle!=='string')throw invalid('Check your profile preferences.');
   data.preferences(id,{displayName:body.displayName.trim(),historyEnabled:body.historyEnabled,cardStyle:body.cardStyle});return reply(200,payload(id,current.csrf));
  }
  if(route==='/api/member/redeem'&&req.method==='POST'){
   const body=await readJSON(req);if(typeof body?.rewardId!=='string')throw invalid('Choose a reward.');
   const purchase=data.redeem(id,body.rewardId);return reply(200,{...payload(id,current.csrf),...purchase});
  }
  if(route==='/api/member/password'&&req.method==='POST'){
   const body=await readJSON(req),member=data.byId(id);if(typeof body?.currentPassword!=='string'||body.currentPassword.length>128||!validPassword(body?.newPassword))throw invalid('Use your current password and a new password of 12–128 characters.');
   if(!authLimit(req,res,member.username))return true;
   const newHash=await costly(async()=>{if(!await verifyPassword(body.currentPassword,member.password_hash))throw invalid('Current password is incorrect.',401);return hashPassword(body.newPassword)});
   if(!data.changePassword(id,member.password_hash,newHash))throw invalid('Account changed. Sign in again.',401);
   return reply(200,payload(id,issue(req,res,id)));
  }
  if(route==='/api/member/account'&&req.method==='DELETE'){
   const body=await readJSON(req),member=data.byId(id);if(typeof body?.password!=='string'||body.password.length>128||body?.confirmation!=='DELETE')throw invalid('Enter your password and type DELETE to delete the account.');
   if(!authLimit(req,res,member.username))return true;
   const correct=await costly(()=>verifyPassword(body.password,member.password_hash));if(!correct||!data.deleteAccount(id,member.password_hash))throw invalid('Password is incorrect or account changed.',401);
   setCookie(res,'',0);return reply(200,{deleted:true,member:null,csrf:null});
  }
  return reply(404,{error:'Member endpoint not found.'});
 }
 return {handle,session,
  awardLive(req,result){const current=session(req);if(!hasCSRF(req,current))return null;return {pointsGranted:data.activity(current.user_id,'wingman',result),member:data.snapshot(current.user_id)}},
 };
}
