import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createApplication,configuration} from '../server/app.mjs';
import {createStore} from '../server/store.mjs';
import {generateWingman} from '../server/wingman.mjs';
const input={situation:'opener',tone:'playful',context:'We both love books.',adult:true};
const result={title:'Read between the lines.',body:'Coffee and a bookshop date?',source:'DECISION MACHINE',context:'This field must never be saved.'};
async function fixture(overrides={},fetcher) {
 const config={...configuration({DATA_DIR:':memory:'}),...overrides};
 const app=createApplication({config,fetcher});const server=http.createServer(app.handler);
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});
 const base=`http://127.0.0.1:${server.address().port}`;
 const request=(route,options={})=>fetch(base+route,{...options,headers:{'Content-Type':'application/json',...options.headers}});
 const post=(route,body,options={})=>request(route,{method:'POST',body:JSON.stringify(body),...options});
 return {request,post,close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));app.close()}};
}

test('HTTP: static files, private files, shared links, previews, deletion and origin checks',async()=>{
 const f=await fixture();try{
  const home=await f.request('/');assert.equal(home.status,200);const html=await home.text();assert(html.includes('/assets/hero.png'));assert.match(home.headers.get('content-security-policy'),/object-src 'none'/);
  for(const file of ['/.env','/server/app.mjs','/../package.json','/data/app.sqlite'])assert.equal((await f.request(file)).status,404);
  for(const file of ['/app.js','/layout.js','/age-gate.js','/assets/wingman.png'])assert.equal((await f.request(file)).status,200);
  assert.match(html,/body class="age-pending"/);assert.match(html,/id="site-content" inert aria-hidden="true"/);assert.match(html,/id="age-gate"/);
  const exit=await f.request('/goodbye');assert.equal(exit.status,200);assert.match(await exit.text(),/Back to age check/);
  const status=await (await f.request('/api/status')).json();assert.equal(status.mode,'demo');assert.equal(status.localOnly,true);assert.equal(status.version,'7.0.0');
  assert.equal((await f.post('/api/wingman',input)).status,503);
  assert.equal((await f.post('/api/shares',result,{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await f.post('/api/shares',{title:'Missing fields'})).status,400);
  const created=await f.post('/api/shares',result);assert.equal(created.status,201);const share=await created.json();assert.equal(share.id.length,24);assert(share.deleteToken);
  const saved=await (await f.request('/api/shares/'+share.id)).json();assert.equal(saved.title,result.title);assert(!('context' in saved));
  const page=await f.request('/r/'+share.id);assert.equal(page.status,200);assert.match(await page.text(),/property="og:title"/);assert.match(page.headers.get('x-robots-tag'),/noindex/);
  const bad=await f.request('/api/shares/'+share.id,{method:'DELETE',body:JSON.stringify({token:'wrong'})});assert.equal(bad.status,404);
  const deleted=await f.request('/api/shares/'+share.id,{method:'DELETE',body:JSON.stringify({token:share.deleteToken})});assert.equal(deleted.status,200);assert.equal((await f.request('/r/'+share.id)).status,404);
 }finally{await f.close()}
});
test('HTTP: real provider request shape with mocked upstream and persistent request limits',async()=>{
 let calls=0;const f=await fixture({key:'test-key',hourly:1},async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-key');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.max_output_tokens,1100);assert(body.input.includes('books'));return {ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:'Shall we judge a bookshop by its coffee?'}]}]})}});
 try{assert.equal((await f.post('/api/wingman',{...input,adult:false})).status,400);const response=await f.post('/api/wingman',input);assert.equal(response.status,200);assert.match((await response.json()).source,/LIVE AI/);const blocked=await f.post('/api/wingman',input);assert.equal(blocked.status,429);assert(blocked.headers.get('retry-after'));assert.equal(calls,1)}finally{await f.close()}
});
test('HTTP: invalid inputs, body limits and upstream errors never silently switch to demo',async()=>{
 const f=await fixture({key:'test-key'},async()=>({ok:false,status:401}));try{
 assert.equal((await f.post('/api/wingman',{...input,situation:'admin'})).status,400);
 assert.equal((await f.post('/api/wingman',{...input,context:'x'.repeat(1001)})).status,400);
 assert.equal((await f.post('/api/wingman',{...input,context:'x'.repeat(9000)})).status,413);
 const response=await f.post('/api/wingman',input);assert.equal(response.status,502);const text=await response.text();assert(!text.includes('test-key'));assert(!text.includes('TEMPLATE'));
 const invalid=await f.request('/api/shares',{method:'POST',body:'bad json'});assert.equal(invalid.status,400);
 }finally{await f.close()}
});
test('HTML escapes share metadata and does not allow stored script injection',async()=>{
 const f=await fixture();try{const share=await(await f.post('/api/shares',{...result,title:'"><script>alert(1)</script>'})).json();const html=await(await f.request('/r/'+share.id)).text();assert(!html.includes('<script>alert(1)</script>'));assert(html.includes('&lt;script&gt;'))}finally{await f.close()}
});
test('SQLite survives restart, expiry and global budget reservations are atomic',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'imhorny-test-'));try{
 let store=createStore(dir);const end=Date.now()+60000;store.save('id',result,'hash',end);assert(store.consume([{key:'global',limit:1,expires:end}]).allowed);const secret=store.secret;store.close();
 store=createStore(dir);assert.equal(store.secret,secret);assert.equal(store.get('id').title,result.title);assert(!store.consume([{key:'global',limit:1,expires:end}]).allowed);
 const refused=store.consume([{key:'new',limit:1,expires:end},{key:'global',limit:1,expires:end}]);assert(!refused.allowed);assert(store.consume([{key:'new',limit:1,expires:end}]).allowed);
 store.save('expired',result,'h',Date.now()-1);assert.equal(store.get('expired'),null);store.cleanup();store.close();
 }finally{rmSync(dir,{recursive:true,force:true})}
});
test('incomplete or empty upstream replies are reported as an error',async()=>{
 await assert.rejects(generateWingman(input,{key:'test',model:'test',fetcher:async()=>({ok:true,json:async()=>({status:'incomplete',output:[]})})}),/could not finish/);
});
test('configuration validates origins and budgets; frontend hooks and assets are complete',()=>{
 assert.throws(()=>configuration({PUBLIC_URL:'https://user:pass@example.com'}));assert.throws(()=>configuration({AI_GLOBAL_DAILY_LIMIT:'0'}));
 assert.throws(()=>configuration({NODE_ENV:'production',DATA_DIR:'./data'}),/absolute path/);
 const root=new URL('../public/',import.meta.url);const html=readFileSync(new URL('index.html',root),'utf8');
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(ids.length,new Set(ids).size);
 for(const name of ['app.js','layout.js']){
  const source=readFileSync(new URL(name,root),'utf8');for(const match of source.matchAll(/\$\('#([a-z0-9-]+)'\)/g))assert(ids.includes(match[1]),`Missing #${match[1]}`);
  new Function(source.replace(/^import[^\n]+;\s*$/gm,''));
 }
 for(const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g))if(match[1]!=='/'){if(match[1]==='/premium')readFileSync(new URL('../app/premium/page.jsx',root));else readFileSync(new URL('.'+match[1],root));}
 assert(!html.includes('Get Premium'));assert(html.includes('Use local demo'));
});
test('HTTP: module assets, loopback aliases, invalid URLs and branded expired links',async()=>{
 const f=await fixture();try{
  for(const name of ['core.mjs','content.mjs']){const response=await f.request('/'+name);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/javascript/)}
  assert.equal((await f.post('/api/shares',result,{headers:{Origin:'http://127.0.0.1:4173'}})).status,201);
  assert.equal((await f.post('/api/shares',result,{headers:{Origin:'http://127.0.0.1:9999'}})).status,403);
  assert.equal((await f.request('/%ZZ')).status,400);
  const missing=await f.request('/r/'+'a'.repeat(24));assert.equal(missing.status,404);assert.match(await missing.text(),/error-card/);
  assert.equal((await f.request('/r/'+'a'.repeat(24),{method:'HEAD'})).status,404);
 }finally{await f.close()}
});
test('HTTP: provider concurrency is capped and cancelled calls release their slots',async()=>{
 let started=0,cancelled=0;const waiters=[];const f=await fixture({key:'test-key'},async(url,options)=>{
   started++;return await new Promise((resolve,reject)=>{const stop=()=>{cancelled++;reject(Object.assign(Error('Cancelled'),{name:'AbortError'}))};options.signal.addEventListener('abort',stop,{once:true});waiters.push(()=>resolve({ok:true,json:async()=>({status:'completed',output:[{content:[{type:'output_text',text:'Hello, small plot twist.'}]}]})}))});
 });
 try{
  const a=new AbortController(),b=new AbortController();
  const first=f.post('/api/wingman',input,{signal:a.signal}).catch(error=>error);
  const second=f.post('/api/wingman',input,{signal:b.signal}).catch(error=>error);
  for(let tries=0;started<2&&tries<100;tries++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(started,2);assert.equal((await f.post('/api/wingman',input)).status,503);
  a.abort();b.abort();await Promise.all([first,second]);
  for(let tries=0;cancelled<2&&tries<100;tries++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(cancelled,2);
  const third=f.post('/api/wingman',input);
  for(let tries=0;started<3&&tries<100;tries++)await new Promise(resolve=>setTimeout(resolve,5));
  assert.equal(started,3);waiters.at(-1)();assert.equal((await third).status,200);
 }finally{for(const resolve of waiters)resolve();await f.close()}
});


test('HTTP: silent hero media supports seeking ranges and rejects invalid ranges',async()=>{
 const f=await fixture();try{
 const full=await f.request('/assets/hero-scroll.mp4');assert.equal(full.status,200);assert.equal(full.headers.get('content-type'),'video/mp4');assert.equal(full.headers.get('accept-ranges'),'bytes');const bytes=new Uint8Array(await full.arrayBuffer());
 for(const [range,start,end] of [['bytes=0-31',0,31],['bytes=100-199',100,199],['bytes=-64',bytes.length-64,bytes.length-1],['bytes=100-',100,bytes.length-1]]){
  const part=await f.request('/assets/hero-scroll.mp4',{headers:{Range:range}});assert.equal(part.status,206);assert.equal(part.headers.get('content-range'),`bytes ${start}-${end}/${bytes.length}`);assert.deepEqual(new Uint8Array(await part.arrayBuffer()),bytes.slice(start,end+1));
 }
 for(const range of ['bytes=999999999-','bytes=10-1','bytes=-0','bytes=0-1,4-5','bytes=-','bad']){const part=await f.request('/assets/hero-scroll.mp4',{headers:{Range:range}});assert.equal(part.status,416);assert.equal(part.headers.get('content-range'),`bytes */${bytes.length}`)}
 const head=await f.request('/assets/hero-scroll.mp4',{method:'HEAD',headers:{Range:'bytes=0-15'}});assert.equal(head.status,206);assert.equal(head.headers.get('content-length'),'16');assert.equal((await head.arrayBuffer()).byteLength,0);
 for(const asset of ['/hero-scroll.mjs','/assets/hero-scroll-poster.jpg'])assert.equal((await f.request(asset)).status,200);
 }finally{await f.close()}
});
