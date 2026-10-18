import {historyEntry} from './core.mjs';
'use strict';
(() => {
 const $=s=>document.querySelector(s);let step=0;
 const update=(focus=true)=>{
   const form=document.querySelector('#decision-form'),values=new FormData(form);
   const labels={solo:'Single',partner:'In a relationship',bored:'Just bored',crush:'Crush mode',low:'Couch creature',high:'Main character'};
   const summary=document.querySelector('#decision-summary');summary.replaceChildren();
   for(const [name,value] of [['Situation',labels[values.get('company')]],['Energy',labels[values.get('energy')]],['Boldness',['Soft launch','Playful','Plot twist'][values.get('boldness')]]]){const term=document.createElement('dt'),description=document.createElement('dd');term.textContent=name;description.textContent=value;summary.append(term,description)}

   document.querySelectorAll('.wizard-step').forEach((el,i)=>el.hidden=i!==step);
   $('#step-label').textContent=`STEP ${step+1} OF 4`;
   $('#progress-fill').style.width=`${(step+1)*25}%`;
   document.querySelector('[role=progressbar]').setAttribute('aria-valuenow',step+1);
   $('#back').hidden=step===0;$('#next').hidden=step===3;$('#decide').hidden=step!==3;
   if(focus){const heading=document.querySelectorAll('.wizard-step')[step].querySelector('h3');heading.tabIndex=-1;heading.focus({preventScroll:true})}

 };
 $('#decision-form').addEventListener('submit',event=>{if(step<3){event.preventDefault();event.stopImmediatePropagation();step++;update()}},true);
 $('#reset-decision').addEventListener('click',()=>{step=0;$('#decision-form').reset();$('#bold-value').value='Playful';$('#decision-preview').hidden=true;$('#decide').textContent='Find my move →';update()});
 $('#next').addEventListener('click',()=>{step=Math.min(3,step+1);update()});
 $('#back').addEventListener('click',()=>{step=Math.max(0,step-1);update()});
 document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
   document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))});
   $('#situation').value=button.dataset.mode;
   $('.message-options').classList.remove('has-generated');
   $('.assistant-intro p').textContent='Examples to copy. Generate your own suggestion below:';
   $('#wingman-view').hidden=true;
   document.querySelectorAll('.reply-origin').forEach(el=>el.textContent='Template example');
   $('#user-chat').textContent={opener:'I want to text my crush but I’m nervous…',date:'Help me ask them out. With a little charm.',followup:'A second date? I’d like a sequel.'}[button.dataset.mode];
   const examples={opener:['Important research: what’s your most defensible terrible movie opinion?','What’s one small thing that made your day better?','I was going to play it cool, but curiosity won. Want to chat?'],date:['Want to grab coffee and judge the pastries like we’re qualified?','I’ve enjoyed talking with you. Would you like to go for coffee?','I like our vibe. Want to go on a date this weekend?'],followup:['I had a lovely time. Fancy a sequel?','I enjoyed seeing you. I’d be happy to do it again if you feel the same.','I’d like to see you again. Want to make a plan?']};
   document.querySelectorAll('.message-options p').forEach((p,i)=>p.textContent=examples[button.dataset.mode][i]);
 }));
 document.querySelectorAll('.copy-line').forEach(button=>button.addEventListener('click',async()=>{
   const text=button.previousElementSibling.textContent;
   window.dispatchEvent(new CustomEvent('copy-template',{detail:text}));
 }));
 const info=(title,body)=>{$('#info-title').textContent=title;$('#info-body').textContent=body;$('#info-dialog').showModal()};
 $('#community').addEventListener('click',()=>info('Be a menace. Have manners.','For adults 18+. Ask, listen, and respect the answer. Every suggestion is optional. Never share someone else’s private information. AI replies can be wrong: review a suggestion before using it.'));
 $('#close-info').addEventListener('click',()=>$('#info-dialog').close());
 $('#challenge-nav').addEventListener('click',()=>{$('#roulette').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});$('#spin').focus({preventScroll:true})});
 update(false);
 $('#banner-share').addEventListener('click',()=>{if(!$('#result').hidden)$('#result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});else info('Make a little chaos first.','Complete the Decision Machine, spin the wheel, or try the demo Wingman. Your result will include sharing and download buttons. The cards here are examples.');});
})();


// Saving history is an explicit, reversible local preference.
(() => {
 const preference='imhorny-history-enabled',key='imhorny-history-v1';
 const box=document.querySelector('#keep-history'),list=document.querySelector('#history-list'),status=document.querySelector('#history-status');
 let entries=[];
 try{
  box.checked=localStorage.getItem(preference)==='yes';
  if(box.checked){const saved=JSON.parse(localStorage.getItem(key)||'[]');if(Array.isArray(saved))for(const item of saved.slice(0,20)){try{entries.push(historyEntry(item))}catch{}}}
 }catch{box.checked=false;status.textContent='History is unavailable in this browser session.'}
 function render(){
  list.replaceChildren();
  if(!box.checked){if(!status.textContent)status.textContent='History is off. Your next plot twist stays in this tab.';return}
  status.textContent=entries.length?`${entries.length} of 20 results saved on this device.`:'Nothing saved yet. Try an experience above.';
  for(const entry of entries){const button=document.createElement('button');button.type='button';button.className='history-entry';button.textContent=entry.title;button.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('restore-result',{detail:entry})));list.append(button)}
 }
 function persist(){
  try{localStorage.setItem(preference,box.checked?'yes':'no');if(box.checked)localStorage.setItem(key,JSON.stringify(entries));else localStorage.removeItem(key);return true}
  catch{box.checked=false;status.textContent='Could not save history. Browser storage may be blocked or full.';list.replaceChildren();return false}
 }
 box.addEventListener('change',()=>{if(!box.checked)entries=[];status.textContent='';if(persist())render()});
 document.querySelector('#clear-history').addEventListener('click',()=>{entries=[];if(persist()){status.textContent='';render()}});
 window.addEventListener('result-ready',event=>{if(!box.checked)return;try{const entry=historyEntry(event.detail);entries=[entry,...entries.filter(item=>item.title!==entry.title||item.body!==entry.body)].slice(0,20);if(persist())render()}catch{}});
 render();
})();