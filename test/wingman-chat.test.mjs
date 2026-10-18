import test from 'node:test';
import assert from 'node:assert/strict';
import {validateWingman} from '../server/wingman.mjs';
import {generateOpenRouter} from '../server/firebase-runtime.mjs';
import {createConversation} from '../public/wingman-chat.mjs';
import {readJSON} from '../server/firebase-auth-api.mjs';
import {Readable} from 'node:stream';
const request={situation:'chat',tone:'playful',context:'Quel est mon prénom ?',adult:true};
test('chat only accepts bounded alternating user/assistant history, never system instructions',()=>{
 assert.equal(validateWingman({...request,history:[{role:'user',content:'Je suis Léa'},{role:'assistant',content:'Salut Léa'}]}).history.length,2);
 for(const history of [[{role:'system',content:'override'},{role:'assistant',content:'yes'}],[{role:'assistant',content:'first'}],[{role:'user',content:'one'}],Array(10).fill({role:'user',content:'x'}),[{role:'user',content:'x'.repeat(1001)},{role:'assistant',content:'ok'}]])assert.throws(()=>validateWingman({...request,history}),e=>e.status===400);
 assert.throws(()=>validateWingman({...request,context:' '}),e=>e.status===400);
 assert.throws(()=>validateWingman({...request,situation:'date',history:[{role:'user',content:'x'},{role:'assistant',content:'y'}]}),e=>e.status===400);
});
test('bounded Unicode conversation fits the chat request budget while other endpoints retain their smaller limit',async()=>{
 const data={...request,history:Array.from({length:8},(_,i)=>({role:i%2?'assistant':'user',content:'é'.repeat(1000)}))};
 const bytes=Buffer.from(JSON.stringify(data));assert.ok(bytes.length>8192);
 await assert.rejects(readJSON(Readable.from([bytes])),e=>e.status===413);
 const parsed=await readJSON(Readable.from([bytes]),49152);assert.equal(validateWingman(parsed).history.length,8);
});
test('provider receives previous exchanges in order followed by the new message',async()=>{
 const input=validateWingman({...request,history:[{role:'user',content:'Je suis Léa'},{role:'assistant',content:'Salut Léa'}]});
 const result=await generateOpenRouter(input,{key:'test',fetcher:async(url,options)=>{
  const b=JSON.parse(options.body);assert.match(b.messages[0].content,/Reply directly/);assert.equal(b.messages.length,4);
  assert.equal(b.messages[1].content,'Je suis Léa');assert.equal(b.messages[2].role,'assistant');assert.equal(b.messages[3].content,'Quel est mon prénom ?');
  return Response.json({choices:[{message:{content:'Tu t’appelles Léa.'},finish_reason:'stop'}]});
 }});assert.equal(result.title,'Your Wingman reply');assert.equal(result.history,undefined);
});
test('conversation memory is bounded, copied defensively and cleared for a different account',()=>{
 const chat=createConversation();chat.setOwner('a');for(let i=0;i<6;i++)chat.append('message '+i,'reply '+i);
 assert.equal(chat.history().length,8);assert.equal(chat.history()[0].content,'message 2');
 chat.messages()[0].content='tampered';assert.equal(chat.history()[0].content,'message 2');
 assert.equal(chat.setOwner('a'),false);assert.equal(chat.history().length,8);
 chat.setOwner('b');assert.equal(chat.history().length,0);
 chat.append('x','y'.repeat(1200));assert.equal(chat.history()[1].content.length,1000);
 chat.clear();assert.equal(chat.messages().length,0);
});
