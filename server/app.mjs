import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHmac,randomBytes,createHash} from 'node:crypto';
import {createStore} from './store.mjs';
import {generateWingman,validateWingman} from './wingman.mjs';
import {createBillingService} from './billing-service.mjs';
import {createMemberService} from './member-service.mjs';
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const files=new Set(['index.html','styles.css','app.js','layout.js','age-gate.js','core.mjs','member.mjs','hero-scroll.mjs','content.mjs','mascot.svg','assets/hero-scroll.mp4','assets/hero-scroll-poster.jpg','assets/hero.png','assets/decision.png','assets/roulette.png','assets/wingman.png']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=value=>createHash('sha256').update(value).digest('hex');
const loopback=origin=>['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname);
const errorPage=(title,body,action='Make a new plot twist ↗')=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · IMHORNY</title><link rel="stylesheet" href="/styles.css?v=4"></head><body class="error-layout"><main class="error-card"><img src="/mascot.svg" alt=""><h1>${escape(title)}</h1><p>${escape(body)}</p><a class="button primary" href="/">${escape(action)}</a></main></body></html>`;
export function configuration(env=process.env) {
 const integer=(key,fallback,max=100000)=>{const n=Number(env[key]||fallback);if(!Number.isInteger(n)||n<1||n>max)throw Error(`Invalid configuration: ${key}`);return n};
 const base=new URL(env.PUBLIC_URL||`http://localhost:${env.PORT||4173}`);
 if(!['http:','https:'].includes(base.protocol)||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw Error('PUBLIC_URL must be an HTTP(S) origin');
 if(env.NODE_ENV==='production'&&!path.isAbsolute(env.DATA_DIR||''))throw Error('Production requires DATA_DIR to be an absolute path to persistent storage outside the deployment directory.');
 return {publicURL:base.origin,dataDir:env.DATA_DIR||'./data',key:env.OPENAI_API_KEY||'',model:env.OPENAI_MODEL||'gpt-5.4-mini',trustProxy:env.TRUST_PROXY==='true',hourly:integer('AI_HOURLY_LIMIT',10),daily:integer('AI_DAILY_LIMIT',20),globalDaily:integer('AI_GLOBAL_DAILY_LIMIT',100),shareDays:integer('SHARE_DAYS',30,365),stripeKey:env.STRIPE_SECRET_KEY||'',stripePrice:env.STRIPE_PRICE_MONTHLY||''};
}
export function createApplication({config=configuration(),store=createStore(config.dataDir),fetcher=fetch}={}) {
 let inFlight=0,requests=0;
 const send=(res,status,payload)=>{if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload))};
 const rate=(req,group,limits)=>{
   const now=Date.now();const raw=config.trustProxy?String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',').at(-1).trim():req.socket?.remoteAddress||'unknown';
   const identity=createHmac('sha256',store.secret).update(`${Math.floor(now/86400000)}:${raw}`).digest('hex');
   return store.consume(limits.map(([period,limit,global=false])=>{const end=(Math.floor(now/period)+1)*period;return {key:`${group}:${global?'global':identity}:${period}:${end}`,expires:end,limit}}));
 };
 const readJSON=async req=>{
   if(!/^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type']||'')))throw Object.assign(Error('Use application/json.'),{status:415});
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>8192)throw Object.assign(Error('Request is too large.'),{status:413});chunks.push(chunk)}
   try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{throw Object.assign(Error('Invalid JSON.'),{status:400})}
 };
 const checkRate=(res,result)=>{if(result.allowed)return true;res.setHeader('Retry-After',String(result.retry));send(res,429,{error:'Too much chaos at once. Try again later.'});return false};
 const members=createMemberService({store,config,send,readJSON,rate,checkRate});
 const billing=createBillingService({store,config});
 async function handler(req,res) {
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
   if(++requests%100===0)store.cleanup();
   const url=new URL(req.url,'http://localhost');let route;try{route=decodeURIComponent(url.pathname)}catch{throw Object.assign(Error('This URL could not be read.'),{status:400})}
   if(route.startsWith('/api/')&&!['GET','HEAD'].includes(req.method)){
     if(req.headers.origin&&req.headers.origin!==config.publicURL){
       let localAlias=false;try{const origin=new URL(req.headers.origin),base=new URL(config.publicURL);localAlias=loopback(origin)&&loopback(base)&&origin.protocol===base.protocol&&origin.port===base.port}catch{}
       if(!localAlias)throw Object.assign(Error('This origin is not allowed.'),{status:403});
     }
     if(req.headers['sec-fetch-site']==='cross-site')throw Object.assign(Error('Cross-site requests are not allowed.'),{status:403});
     if(!checkRate(res,rate(req,'requests',[[3600000,180]])))return;
   }
   if(await members.handle(req,res,route))return;
   if(route==='/api/billing/status'&&req.method==='GET'){const current=members.session(req);return send(res,200,current?billing.status(current.user_id):{premiumUntil:null,active:false,subscription:null})}
   if(route==='/api/billing/checkout'&&req.method==='POST'){const current=members.session(req);if(!current)throw Object.assign(Error('Sign in to continue.'),{status:401});return send(res,200,await billing.checkout(current.user_id))}
   if(route==='/api/billing/portal'&&req.method==='POST'){const current=members.session(req);if(!current)throw Object.assign(Error('Sign in to continue.'),{status:401});return send(res,200,await billing.portal(current.user_id))}
   if(route==='/api/billing/webhook'&&req.method==='POST')return send(res,501,{error:'Stripe webhook adapter is not configured.'});
   if(req.method==='GET'&&route==='/api/status')return send(res,200,{version:'7.0.0',mode:config.key?'live':'demo',localOnly:loopback(config.publicURL),shareDays:config.shareDays,limits:{hourly:config.hourly,daily:config.daily}});
   if(req.method==='GET'&&route==='/healthz')return send(res,200,{ok:true});
   if(route==='/api/wingman'&&req.method==='POST'){
     const input=validateWingman(await readJSON(req));
     const memberUsage=members.consumeWingman(req);
     if(memberUsage&&!memberUsage.allowed)return send(res,429,{code:'WINGMAN_LIMIT_REACHED',error:'Your free Wingman quota is used for today. Premium unlocks more chaos.',remaining:0,premium:memberUsage.premium});
     if(!config.key)return send(res,503,{code:'DEMO_MODE',error:'Live AI is not configured. The local template demo is available.'});
     if(inFlight>=2)return send(res,503,{error:'The Wingman is busy. Try again in a moment.'});
     if(!checkRate(res,rate(req,'ai',[[3600000,config.hourly],[86400000,config.daily],[86400000,config.globalDaily,true]])))return;
     const controller=new AbortController();const disconnected=()=>{if(!res.writableEnded)controller.abort()};res.on('close',disconnected);
     inFlight++;try{const result=await generateWingman(input,{key:config.key,model:config.model,fetcher,signal:controller.signal});const memberAward=members.awardLive(req,result);return send(res,200,{...result,...(memberAward?{memberAward}:{})})}finally{inFlight--;res.off('close',disconnected)}
   }
   if(route==='/api/shares'&&req.method==='POST') {
     if(!checkRate(res,rate(req,'share',[[3600000,30],[86400000,1000,true]])))return;
     const body=await readJSON(req);
     if(!body||!['title','body','source'].every(k=>typeof body[k]==='string'&&body[k].trim().length>0&&body[k].length<=({title:180,body:3000,source:100}[k])))throw Object.assign(Error('Invalid result.'),{status:400});
     // Never persist optional free-text input/context in public share records.
     const result={title:body.title,body:body.body,source:body.source};const id=randomBytes(18).toString('base64url'),token=randomBytes(24).toString('base64url');
     const expires=Date.now()+config.shareDays*86400000;store.save(id,result,hash(token),expires);
     return send(res,201,{url:`${config.publicURL}/r/${id}`,id,deleteToken:token,expiresAt:new Date(expires).toISOString()});
   }
   const sharedAPI=route.match(/^\/api\/shares\/([A-Za-z0-9_-]{24})$/);
   if(sharedAPI&&req.method==='GET'){const result=store.get(sharedAPI[1]);return send(res,result?200:404,result||{error:'This result expired or was deleted.'})}
   if(sharedAPI&&req.method==='DELETE'){
     const body=await readJSON(req);if(typeof body?.token!=='string'||body.token.length>100)throw Object.assign(Error('Invalid deletion token.'),{status:400});
     const deleted=store.delete(sharedAPI[1],hash(body.token));return send(res,deleted?200:404,deleted?{deleted:true}:{error:'Result not found or deletion token invalid.'});
   }
   if(route.startsWith('/api/'))return send(res,404,{error:'Endpoint not found.'});
   if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed.'});
   if(route==='/goodbye'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:errorPage('You’ve left the playground.','This site is for adults aged 18 and over. You can close this tab.','Back to age check'))}
   if(route==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});return res.end('User-agent: *\nDisallow: /r/\nDisallow: /api/\n')}
   const sharedPage=route.match(/^\/r\/([A-Za-z0-9_-]{24})$/);
   let name=route==='/'||sharedPage?'index.html':route.slice(1);
   if(!files.has(name)){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:errorPage('Wrong turn. Good recovery.','That page does not exist. The playground is one click away.'))}
   let bytes=await readFile(path.join(publicRoot,name));
   if(name==='index.html'){
     let html=bytes.toString('utf8');const share=sharedPage?store.get(sharedPage[1]):null;
     if(sharedPage&&!share){res.setHeader('X-Robots-Tag','noindex');res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:errorPage('This plot twist expired.','This link expired or was deleted. Make a fresh result: your next good story is still waiting.'))}
     if(share){
       res.setHeader('X-Robots-Tag','noindex, nofollow');
       const meta=`<meta property="og:title" content="${escape(share.title)}"><meta property="og:description" content="${escape(share.body.slice(0,220))}"><meta property="og:image" content="${escape(config.publicURL)}/assets/hero.png"><meta property="og:url" content="${escape(config.publicURL+route)}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image">`;
       html=html.replace(/<title>.*?<\/title>/,()=>`<title>${escape(share.title)} · IMHORNY</title>`).replace('</head>',()=>meta+'</head>');
     }
     bytes=Buffer.from(html);
   }
   if(name.endsWith('.mp4')){
     const headers={'Content-Type':'video/mp4','Accept-Ranges':'bytes','Cache-Control':'public, max-age=3600'};
     if(req.headers.range){
       const match=String(req.headers.range).match(/^bytes=(\d*)-(\d*)$/);let start,end;
       if(match&&(match[1]||match[2])){
         if(!match[1]){const suffix=Number(match[2]);start=Math.max(0,bytes.length-suffix);end=bytes.length-1;if(!suffix)start=bytes.length}
         else{start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1}
       }
       if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=bytes.length||end<start){res.writeHead(416,{...headers,'Content-Range':`bytes */${bytes.length}`,'Content-Length':0});return res.end()}
       res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`,'Content-Length':end-start+1});return res.end(req.method==='HEAD'?undefined:bytes.subarray(start,end+1));
     }
     res.writeHead(200,{...headers,'Content-Length':bytes.length});return res.end(req.method==='HEAD'?undefined:bytes);
   }
   const cache=name==='index.html'?'no-store':['.js','.mjs','.css'].includes(path.extname(name))?'no-cache':'public, max-age=3600';
   res.writeHead(200,{'Content-Type':types[path.extname(name)],'Cache-Control':cache,'Content-Length':bytes.length});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){send(res,error.status||500,{error:error.status?error.message:'Something went wrong. Please try again.'})}
 }
 return {handler,close:()=>store.close()};
}
