'use client';
import {useEffect} from 'react';
export default function RouteBridge({route}){
 useEffect(()=>{
  const open=()=>{
   if(document.body.classList.contains('age-pending'))return;
   if(!document.documentElement.dataset.memberReady)return;
   if(route==='account'||route==='challenges')document.querySelector('#member-open')?.click();
   else document.getElementById(route)?.scrollIntoView({block:'start'});
  };
  window.addEventListener('member-ready',open);
  window.addEventListener('adult-confirmed',open);
  open();
  return()=>{window.removeEventListener('member-ready',open);window.removeEventListener('adult-confirmed',open)};
 },[route]);
 return null;
}
