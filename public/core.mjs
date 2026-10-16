import {plans,outcomes,rouletteVariants} from './content.mjs';

export function createPicker(random=Math.random) {
 const previous=new WeakMap();
 return list=>{
  if(!Array.isArray(list)||!list.length)throw new Error('No suggestions available.');
  const options=list.length>1?list.filter(item=>item!==previous.get(list)):list;
  const value=options[Math.min(options.length-1,Math.max(0,Math.floor(random()*options.length)))];
  previous.set(list,value);return value;
 };
}
const pools={};
for(const company of Object.keys(plans)){
 pools[company]={};
 for(const energy of Object.keys(plans[company]))pools[company][energy]=[0,1,2].map(bold=>plans[company][energy].filter((_,i)=>i%3===bold));
}
export function decide({company,energy,boldness},pick) {
 const bold=Number(boldness),pool=pools[company]?.[energy]?.[bold];
 if(!pool)throw new Error('Choose your situation, energy and boldness.');
 const [title,body]=pick(pool);
 return {source:'DECISION MACHINE · '+['SOFT LAUNCH','PLAYFUL','PLOT TWIST'][bold],title,body};
}
const filters={any:[0,1,2,3,4,5],stay:[0,3],out:[1],connect:[2,4]};
export function rouletteChoices(filter){return filters[filter]||filters.any}
export function rouletteResult(index,pick){
 if(!outcomes[index])throw new Error('Unknown wheel outcome.');
 const category=outcomes[index][0],[title,body]=pick?pick(rouletteVariants[index]):outcomes[index].slice(1);return {source:'HORNY ROULETTE · '+category.toUpperCase(),title,body};
}
export function nextRotation(current,index){
 if(!Number.isFinite(current)||!Number.isInteger(index)||index<0||index>5)throw new Error('Invalid wheel position.');
 const target=(360-(index*60+30))%360;
 return current+1800+(target-current%360+360)%360;
}
export function normalizeResult(input){
 if(!input||!['title','body','source'].every(k=>typeof input[k]==='string'&&input[k].trim().length&&input[k].length<=({title:180,body:3000,source:100}[k])))throw new Error('This result cannot be read.');
 if(input.context!==undefined&&(typeof input.context!=='string'||input.context.length>1600))throw new Error('This result cannot be read.');
 return {title:input.title,body:input.body,source:input.source,...(input.context?{context:input.context}:{})};
}
export function historyEntry(input){const {title,body,source}=normalizeResult(input);return {title,body,source}}
export function isLocalOrigin(origin){try{return ['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname)}catch{return true}}

// Width-bounded text for export cards, including long words and Unicode.
export function wrapText(text,measure,width,maxLines=Infinity){
 const all=[];
 for(const paragraph of String(text).split('\n')){
  if(!paragraph.trim()){all.push('');continue}
  let line='';
  for(const word of paragraph.trim().split(/\s+/)){
   if(line&&measure(line+' '+word)<=width){line+=' '+word;continue}
   if(line){all.push(line);line=''}
   if(measure(word)<=width){line=word;continue}
   for(const char of word){if(line&&measure(line+char)>width){all.push(line);line=''}line+=char}
  }
  if(line)all.push(line);
 }
 const truncated=all.length>maxLines,visible=all.slice(0,maxLines);
 if(truncated&&visible.length){let chars=Array.from(visible.at(-1));while(chars.length&&measure(chars.join('')+'…')>width)chars.pop();visible[visible.length-1]=chars.join('')+'…'}
 return {lines:visible,truncated};
}
