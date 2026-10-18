import {createConversation} from './wingman-chat.mjs';
import './hero-scroll.mjs';
import {memberHeaders,getCardStyle,acceptMemberAward,getMember} from './member.mjs';
import {lines} from './content.mjs';
import {createPicker,decide,rouletteChoices,rouletteResult,nextRotation,normalizeResult,isLocalOrigin,wrapText} from './core.mjs';

const $=selector=>document.querySelector(selector);
const pick=createPicker();
const conversation=createConversation();let chatPending=null;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
let current=null,savedShare=null,lastWingman=null,rotation=0,spinning=false,wingmanBusy=false,activeRequest=null;
let quota=null,quotaOwner=null,quotaSequence=0;
let modeChosen=false;
let backend={mode:'offline',shareDays:30,localOnly:isLocalOrigin(location.origin)};
const networkError='Cannot reach the service. Check your connection and try again.';
async function requestJSON(url,options={}){
 try{
  const response=await fetch(url,{...options,signal:options.signal||AbortSignal.timeout(30000)});
  let body;try{body=await response.json()}catch{throw new Error('The server returned an unreadable reply. Please retry.')}
  if(!response.ok)throw Object.assign(new Error(body.error||'Something went wrong. Please retry.'),{data:body,status:response.status});
  return body;
 }catch(error){if(error.name==='TypeError')throw new Error(networkError);throw error}
}
function renderQuota(){
 const currentId=getMember()?.id;
 const q=currentId===quotaOwner?quota:null;
 $('#wingman-quota').textContent=!currentId?'Sign in for 5 free live AI requests per UTC day. The template demo needs no account.':!q?'Checking your live AI allowance…':q.error?'Allowance unavailable. Retry the connection to refresh it.':q.plan+' · '+q.remaining+'/'+q.limit+' live AI requests left today · resets at 00:00 UTC. Attempts count, including provider errors.';
 $('#wingman-upgrade').hidden=!q||!!q.error||q.remaining!==0;
}
async function refreshQuota(){const sequence=++quotaSequence,owner=getMember()?.id;quotaOwner=owner;quota=null;renderQuota();if(!owner)return;try{const result=await requestJSON('/api/wingman/usage');if(sequence===quotaSequence&&getMember()?.id===owner)quota=result.usage}catch{if(sequence===quotaSequence&&getMember()?.id===owner)quota={error:true}}if(sequence===quotaSequence)renderQuota()}
window.addEventListener('member-changed',()=>{if(conversation.setOwner(getMember()?.id||null)){chatPending=null;activeRequest?.abort();renderConversation()}void refreshQuota();modeUI()});
window.addEventListener('focus',()=>void refreshQuota());
void refreshQuota();
function renderConversation(){
 const log=$('#wingman-conversation');log.replaceChildren();
 const turns=[...conversation.messages(),...(chatPending?[{role:'user',content:chatPending}]:[])];
 if(!turns.length){const hint=document.createElement('p');hint.className='micro';hint.textContent='Say hello or tell me what’s on your mind. Your chat stays in this tab until you reload or start again.';log.append(hint)}
 for(const turn of turns){const card=document.createElement('article');card.className='chat-turn '+turn.role;const label=document.createElement('strong');label.textContent=turn.role==='user'?'You':'Wingman';const body=document.createElement('p');body.textContent=turn.content;card.append(label,body);if(turn.role==='assistant'){const copy=document.createElement('button');copy.type='button';copy.className='back';copy.textContent='Copy reply';copy.addEventListener('click',()=>void copyText(turn.content,message=>$('#line-status').textContent=message));card.append(copy)}log.append(card)}
 log.scrollTop=log.scrollHeight;
}
function modeUI(){
 const demo=$('#use-demo').checked,chat=$('#situation').value==='chat';
 $('#wingman-conversation').hidden=!chat;$('#new-conversation').hidden=!chat;$('#new-conversation').disabled=wingmanBusy;
 $('#user-chat').hidden=chat;$('.assistant-intro').hidden=chat;$('.message-options').hidden=chat;
 if(chat)renderConversation();
 $('#wingman-form [type=submit]').setAttribute('aria-label',demo?'Generate a demo reply':chat?'Send message to Wingman':'Generate an AI reply');
 $('.wingman-settings>span').textContent=demo?'Ready-made phrases · not personalised':chat?'Direct replies · remembers this conversation':'AI uses your situation · review before sending';
 $('.demo-tag').textContent=demo?'TEMPLATE DEMO':'LIVE AI';
 $('#wingman-mode-help').textContent=demo?'Demo picks a ready-made phrase. It does not read your situation. Switch to AI for a personalised suggestion.':'Describe your situation below. AI will generate one suggestion; it does not send messages to anyone.';
 if(chat){$('#wingman-mode-help').textContent=demo?'Live conversation requires AI mode. For ready-made demo phrases, choose Draft a message.':'Talk naturally. Wingman remembers the last four exchanges in this tab. Each reply uses one AI request.';$('#wingman-form [type=submit]').disabled=wingmanBusy||demo;}
 $('#context').disabled=demo||wingmanBusy;
 $('label[for=context]').textContent=chat?'Your message to Wingman':'Your situation (AI mode)';$('#context').placeholder=demo?'Switch to AI to add your situation':chat?'Write your message to Wingman…':'Example: Invite someone I met yesterday for coffee';
 $('#switch-to-ai').hidden=!demo;$('#switch-to-ai').disabled=backend.mode!=='live';
 $('#wingman-signin').hidden=demo||!!getMember();
 $('#adult-label').hidden=demo;
 $('#wingman-status').textContent=backend.mode==='offline'?'AI service unavailable. The ready-made demo still works.':demo?'Demo selected · no AI request is used':getMember()?'AI selected · uses 1 live AI request per attempt':'AI selected · create a free account or sign in to continue';
 $('#use-demo').disabled=wingmanBusy||backend.mode!=='live';
}
async function checkService(){
 $('#retry-service').disabled=true;
 try{
  backend={...backend,...await requestJSON('/api/status')};
  // Selecting AI does not transmit anything: submit and adult confirmation are still required.
  if(backend.mode!=='live')$('#use-demo').checked=true;else if(!modeChosen)$('#use-demo').checked=false;

  $('.wingman-card strong').textContent=backend.mode==='live'?'Chat + writing tools.':'Ready-made demo available.';
  $('.benefits>div:last-child b').textContent=backend.mode==='live'?'AI Wingman':'Wingman Demo';
  $('.benefits>div:last-child small').textContent=backend.mode==='live'?'Chat or get help drafting a text.':'Ready-made messages to adapt.';
 }catch{backend={...backend,mode:'offline'};$('#use-demo').checked=true}
 finally{$('#retry-service').disabled=false;modeUI();shareNote()}
}
$('#use-demo').addEventListener('change',()=>{modeChosen=true;modeUI()});
$('#switch-to-ai').addEventListener('click',()=>{modeChosen=true;$('#use-demo').checked=false;modeUI();(getMember()?$('#context'):$('#wingman-signin')).focus()});
$('#wingman-signin').addEventListener('click',()=>$('#member-open').click());
window.addEventListener('wingman-mode-changed',modeUI);
$('#new-conversation').addEventListener('click',()=>{if(wingmanBusy)return;conversation.clear();chatPending=null;$('#context').value='';$('#line-status').textContent='New conversation. What’s on your mind?';$('#wingman-view').hidden=true;if(current?.source.includes('WINGMAN')){$('#result').hidden=true;current=null;lastWingman=null;resultButtons(false)}renderConversation();$('#context').focus()});
$('#retry-service').addEventListener('click',()=>{void checkService();void refreshQuota()});
modeUI();checkService();
function shareNote(){
 $('#share-note').textContent=backend.localOnly?'Local mode: saved links open only on this computer. To send a result to someone else, download the card or copy the text.':`Links expire after ${backend.shareDays} days. Anyone with the link can read the result.`;
}
function resultButtons(enabled){for(const id of ['share','copy','download','view-result'])$('#'+id).disabled=!enabled}
function viewResult(){if(!current)return;$('#result-title').focus({preventScroll:true});$('#result').scrollIntoView({behavior:reduced()?'instant':'smooth',block:'center'})}
function inlinePreview(origin,result){
 const preview=$('#'+origin+'-preview');if(!preview)return;
 preview.replaceChildren();preview.hidden=false;
 const eyebrow=document.createElement('p');eyebrow.className='preview-label';eyebrow.textContent='YOUR NEXT LITTLE MOVE';
 const heading=document.createElement('h3');heading.textContent=result.title;
 const body=document.createElement('p');body.textContent=result.body;
 const button=document.createElement('button');button.type='button';button.className='button secondary';button.textContent='View card & share ↓';button.addEventListener('click',()=>{show(result,{origin,remember:false});viewResult()});
 preview.append(eyebrow,heading,body,button);
}
function show(input,{origin=null,scroll=false,remember=true,shared=false}={}){
 const result=normalizeResult(input);current=result;savedShare=null;
 $('#delete-share').hidden=true;$('#link-panel').hidden=true;
 $('#share-link').value='';$('#share-status').textContent='';
 $('#result-source').textContent=(shared?'SHARED RESULT · ':'')+result.source;
 $('#result-title').textContent=result.title;$('#result-body').textContent=result.body;
 $('#result-context').textContent=result.context||'';$('#result-context').hidden=!result.context;
 $('#result').hidden=false;resultButtons(true);shareNote();
 $('#result').classList.remove('reveal');requestAnimationFrame(()=>$('#result').classList.add('reveal'));
 if(origin)inlinePreview(origin,result);
 window.dispatchEvent(new CustomEvent('result-changed',{detail:result}));
 if(remember)window.dispatchEvent(new CustomEvent('result-ready',{detail:result}));
 if(scroll)viewResult();
}
resultButtons(false);
$('#view-result').addEventListener('click',viewResult);
window.addEventListener('restore-result',event=>{try{show(event.detail,{remember:false,scroll:true})}catch{$('#history-status').textContent='That saved result could not be read.'}});

$('#boldness').addEventListener('input',event=>$('#bold-value').value=['Soft launch','Playful','Plot twist'][event.target.value]);
$('#decision-form').addEventListener('submit',event=>{
 event.preventDefault();const data=new FormData(event.target);
 const result=decide({company:data.get('company'),energy:data.get('energy'),boldness:data.get('boldness')},pick);
 show(result,{origin:'decision'});$('#decide').textContent='Another suggestion ↻';
});
$('#spin').addEventListener('click',()=>{
 if(spinning)return;spinning=true;$('#spin').disabled=true;$('#roulette-filter').disabled=true;$('#spin').textContent='…';
 $('#wheel-status').textContent='Round and round your next move goes…';
 const index=pick(rouletteChoices($('#roulette-filter').value));rotation=nextRotation(rotation,index);
 $('#wheel').style.transform=`rotate(${rotation}deg)`;
 setTimeout(()=>{
  const result=rouletteResult(index,pick);show(result,{origin:'roulette'});
  $('#wheel-status').textContent='You landed on '+result.source.split(' · ')[1].toLowerCase()+'. Your boundaries still get the final vote.';
  $('#spin').innerHTML='SPIN<small>😈</small>';$('#spin').disabled=false;$('#roulette-filter').disabled=false;spinning=false;
 },reduced()?30:4100);
});

function renderWingmanReply(result){
 $('.message-options').classList.add('has-generated');
 $('.message-options p').textContent=result.body;
 $('.message-options .reply-origin').textContent=result.source.includes('LIVE AI')?'Your AI reply':'Your demo phrase';
 $('.assistant-intro p').textContent='Your suggestion is ready. Review it, adapt it, then copy it.';
 $('#wingman-view').hidden=false;
}
const demoTitles=['A little charm, on the house.','Consider the ice gently broken.','Your opening act is ready.'];
$('#wingman-form').addEventListener('submit',async event=>{
 event.preventDefault();if(wingmanBusy)return;
 const context=$('#context').value.trim(),situation=$('#situation').value,tone=$('#tone').value;
 const button=event.target.querySelector('[type=submit]'),chat=situation==='chat',owner=getMember()?.id;
 if(chat&&!context){$('#line-status').textContent='Write a message first.';$('#context').focus();return}
 if($('#use-demo').checked){
  if(chat){$('#line-status').textContent='Choose AI for a real conversation, or Draft a message for the ready-made demo.';return}
  const body=pick(lines[situation][tone]);const result={source:'AI WINGMAN · TEMPLATE DEMO',title:pick(demoTitles),body};
  lastWingman=result;show(result);renderWingmanReply(result);
  $('#line-status').textContent='Template ready. No AI request was used.';return;
 }
 if(backend.mode!=='live'){$('#line-status').textContent='Live AI is unavailable. Choose the local demo or retry the service.';return}
 if(!getMember()){$('#line-status').textContent='Create a free account or sign in, then generate your AI suggestion.';$('#member-open').click();return}
 if(!$('#adult-confirm').checked){$('#line-status').textContent='Please confirm you are 18+ before using live AI.';$('#adult-confirm').focus();return}
 wingmanBusy=true;button.disabled=true;button.textContent='…';$('#wingman-form').setAttribute('aria-busy','true');$('#cancel-ai').hidden=false;activeRequest=new AbortController();modeUI();
 if(chat){chatPending=context;renderConversation()}
 $('#line-status').textContent='Your Wingman is thinking…';$('#user-chat').textContent=context||'Help me with '+situation+'.';
 document.querySelectorAll('[data-mode]').forEach(el=>el.disabled=true);
 try{
  const result=await requestJSON('/api/wingman',{method:'POST',headers:{'Content-Type':'application/json',...memberHeaders()},body:JSON.stringify({situation,tone,context,adult:true,...(chat?{history:conversation.history()}:{})}),signal:AbortSignal.any([activeRequest.signal,AbortSignal.timeout(30000)])});
  if(owner!==getMember()?.id)throw Error('Your account changed. This reply was discarded.');
  if(result.memberAward)acceptMemberAward(result.memberAward);lastWingman=result;
  if(chat){conversation.append(context,result.body);chatPending=null;renderConversation();$('#context').value='';$('#wingman-view').hidden=false}else{show(result);renderWingmanReply(result)}
  $('#line-status').textContent=chat?'Wingman replied. Keep the conversation going.':'Reply generated by AI. Review it before sending.';
 }catch(error){$('#line-status').textContent=error.name==='AbortError'?'Request cancelled.':error.name==='TimeoutError'?'The request timed out. Try again or choose the local demo.':error.message}
 finally{chatPending=null;if(chat)renderConversation();wingmanBusy=false;button.disabled=false;button.textContent='➤';$('#wingman-form').setAttribute('aria-busy','false');activeRequest=null;$('#cancel-ai').hidden=true;document.querySelectorAll('[data-mode]').forEach(el=>el.disabled=false);modeUI();void refreshQuota()}
});
$('#cancel-ai').addEventListener('click',()=>activeRequest?.abort());
$('#wingman-view').addEventListener('click',()=>{if(lastWingman){show(lastWingman,{remember:false});viewResult()}});

const resultText=result=>`${result.title}\n\n${result.body}\n\n${result.source}\nBad ideas. Good times. Zero judgment.\nimhornywhattodo.com`;
async function copyText(text,status){
 try{
  if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
  else{const field=document.createElement('textarea');field.value=text;field.style.cssText='position:fixed;left:-9999px';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw Error('Copy unavailable')}
  status('Copied. Use your new power responsibly-ish.');return true;
 }catch{status('Automatic copy is unavailable. Select the text or link to copy it manually.');return false}
}
window.addEventListener('copy-template',event=>copyText(event.detail,message=>$('#line-status').textContent=message));
$('#copy').addEventListener('click',()=>{if(current){const snapshot=current;copyText(resultText(snapshot),message=>{if(current===snapshot)$('#share-status').textContent=message})}});
function ownerToken(id){try{return sessionStorage.getItem('share-owner:'+id)}catch{return null}}
function renderLink(data){
 savedShare=data;$('#link-panel').hidden=false;$('#share-link').value=data.url;$('#open-link').href=data.url;
 $('#delete-share').hidden=!data.deleteToken;
 const expiry=data.expiresAt?new Date(data.expiresAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):null;
 $('#link-status').textContent=(isLocalOrigin(data.url)?'Local link · opens on this computer only.':'Saved link · anyone with this link can read the result.')+(expiry?' Expires '+expiry+'.':'');
 $('#native-share').hidden=!navigator.share||isLocalOrigin(data.url);
}
$('#share').addEventListener('click',async()=>{
 if(!current)return;if(savedShare){$('#link-panel').hidden=false;$('#share-link').focus();$('#share-link').select();return}
 const snapshot=current;$('#share').disabled=true;$('#share-status').textContent='Saving your link…';
 try{
  const data=await requestJSON('/api/shares',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:snapshot.title,body:snapshot.body,source:snapshot.source})});
  try{sessionStorage.setItem('share-owner:'+data.id,data.deleteToken)}catch{}
  if(current!==snapshot)return;
  renderLink(data);$('#share-status').textContent='Link ready. Use Copy link or Open link below.';$('#share-link').focus();$('#share-link').select();
 }catch(error){if(current===snapshot)$('#share-status').textContent=error.name==='TimeoutError'?'The local server took too long. Try again.':error.message}
 finally{$('#share').disabled=!current}
});
$('#copy-link').addEventListener('click',()=>{if(savedShare)copyText(savedShare.url,message=>$('#share-status').textContent=message)});
$('#native-share').addEventListener('click',async()=>{if(!savedShare||!current)return;try{await navigator.share({title:current.title,url:savedShare.url})}catch(error){if(error.name!=='AbortError')$('#share-status').textContent='Sharing is unavailable. Use Copy link instead.'}});
$('#delete-share').addEventListener('click',async()=>{
 if(!savedShare?.deleteToken)return;const snapshot=savedShare;$('#delete-share').disabled=true;
 try{
  await requestJSON('/api/shares/'+snapshot.id,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:snapshot.deleteToken})});
  try{sessionStorage.removeItem('share-owner:'+snapshot.id)}catch{}
  if(savedShare===snapshot){savedShare=null;$('#delete-share').hidden=true;$('#link-panel').hidden=true;$('#share-status').textContent='Link deleted. Previously copied text and downloaded cards cannot be recalled.'}
 }catch(error){if(savedShare===snapshot)$('#share-status').textContent=error.message}
 finally{$('#delete-share').disabled=false}
});
$('#download').addEventListener('click',async()=>{
 if(!current)return;const snapshot=current;$('#download').disabled=true;
 try{
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1350;const ctx=canvas.getContext('2d');
  const palette={classic:['#28102d','#ff2385'],lemon:['#183024','#c6ff48'],peach:['#371e28','#ffb58c']}[getCardStyle()];
  const background=ctx.createLinearGradient(0,0,1080,1350);background.addColorStop(0,palette[0]);background.addColorStop(1,'#0c0914');ctx.fillStyle=background;ctx.fillRect(0,0,1080,1350);
  ctx.strokeStyle=palette[1];ctx.lineWidth=4;ctx.strokeRect(35,35,1010,1280);
  ctx.fillStyle=palette[1];ctx.fillRect(70,75,100,9);ctx.fillStyle='#ffb58c';ctx.font='bold 24px Arial';ctx.fillText('YOUR NEXT LITTLE PLOT TWIST',70,128);
  const draw=(text,y,font,lineHeight,maxLines,color)=>{ctx.font=font;ctx.fillStyle=color;const block=wrapText(text,value=>ctx.measureText(value).width,940,maxLines);block.lines.forEach(line=>{ctx.fillText(line,70,y);y+=lineHeight});return {y,truncated:block.truncated}};
  draw(snapshot.source,183,'bold 21px Arial',28,2,'#c6ff48');
  const title=draw(snapshot.title,285,'bold 62px Arial',72,3,'#f9f4ff');
  const body=draw(snapshot.body,title.y+40,'32px Arial',45,Math.floor((1130-title.y-40)/45),'#f9f4ff');
  const space=Math.min(510,1160-body.y-45);
  if(space>120){
   const art=new Image();art.src='/assets/'+(snapshot.source.includes('WINGMAN')?'wingman':snapshot.source.includes('ROULETTE')?'roulette':'decision')+'.png';
   const loaded=await Promise.race([art.decode().then(()=>true).catch(()=>false),new Promise(resolve=>setTimeout(()=>resolve(false),2000))]);
   if(loaded){const width=Math.min(650,space*art.naturalWidth/art.naturalHeight),height=width*art.naturalHeight/art.naturalWidth;ctx.drawImage(art,1000-width,1170-height,width,height)}
  }
  if(body.truncated){ctx.font='20px Arial';ctx.fillStyle='#ffb58c';ctx.fillText('Long result: use Copy result for the full text.',70,1150)}
  ctx.font='bold 27px Arial';ctx.fillStyle='#ffb58c';ctx.fillText('Bad ideas. Good times. Zero judgment.',70,1220);ctx.font='24px Arial';ctx.fillStyle='#fff';ctx.fillText('imhornywhattodo.com',70,1270);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('The card could not be exported.');
  const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='my-little-plot-twist.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  if(current===snapshot)$('#share-status').textContent='Card downloaded. Optional input context is excluded.';
 }catch(error){$('#share-status').textContent=error.message||'The card could not be exported. Copy the result instead.'}
 finally{$('#download').disabled=!current}
});

$('#privacy').addEventListener('click',()=>$('#privacy-dialog').showModal());
$('#close-privacy').addEventListener('click',()=>$('#privacy-dialog').close());
$('#privacy-dialog').addEventListener('click',event=>{if(event.target!==$('#privacy-dialog'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close()});
function invalidLink(message){current=null;savedShare=null;resultButtons(false);$('#result').hidden=false;$('#delete-share').hidden=true;$('#link-panel').hidden=true;$('#result-source').textContent='SHARED RESULT';$('#result-title').textContent='This plot twist got lost.';$('#result-body').textContent=message;$('#result-context').hidden=true;$('#share-status').textContent='Choose an experience to make a fresh result.'}
function loadLegacy(){if(!location.hash.startsWith('#r='))return;try{if(location.hash.length>9000)throw Error('Link too long');const result=normalizeResult(JSON.parse(decodeURIComponent(location.hash.slice(3))));show(result,{shared:true,scroll:true,remember:false})}catch{invalidLink('That shared link could not be read. Your next move is still waiting below.')}}
loadLegacy();window.addEventListener('hashchange',loadLegacy);
const shared=location.pathname.match(/^\/r\/([A-Za-z0-9_-]{24})$/);
if(shared)requestJSON('/api/shares/'+shared[1]).then(data=>{show(data,{shared:true,scroll:true,remember:false});renderLink({id:shared[1],url:location.origin+location.pathname,deleteToken:ownerToken(shared[1]),expiresAt:data.expiresAt})}).catch(error=>invalidLink(error.message));
