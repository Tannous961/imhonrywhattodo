'use strict';
(() => {
 const gate=document.querySelector('#age-gate');
 const content=document.querySelector('#site-content');
 const key='imhorny-adult-confirmed-v1';
 function enter(remember){
  if(remember){try{sessionStorage.setItem(key,'yes')}catch{}}
  content.inert=false;content.removeAttribute('aria-hidden');
  document.body.classList.remove('age-pending');
  document.querySelector('#adult-confirm').checked=true;
  if(gate.open)gate.close();
  window.dispatchEvent(new Event('adult-confirmed'));
  if(remember){const heading=document.querySelector('.hero h1');heading.tabIndex=-1;heading.focus({preventScroll:true})}
 }
 let confirmed=false;try{confirmed=sessionStorage.getItem(key)==='yes'}catch{}
 if(confirmed){enter(false);return}
 content.inert=true;content.setAttribute('aria-hidden','true');
 // The initial open attribute also provides a visible notice without JavaScript.
 if(gate.open)gate.close();gate.showModal();
 gate.addEventListener('cancel',event=>event.preventDefault());
 document.querySelector('#age-enter').addEventListener('click',()=>enter(true));
 document.querySelector('#age-leave').addEventListener('click',()=>location.replace('/goodbye'));
})();
