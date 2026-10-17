import test from 'node:test';
import assert from 'node:assert/strict';
import {generateOpenRouter} from '../server/firebase-runtime.mjs';
test('OpenRouter uses server authorization and privacy routing; result excludes input context',async()=>{
 const result=await generateOpenRouter({situation:'opener',tone:'sweet',context:'private input'},{key:'test-key',fetcher:async(url,options)=>{
  assert.equal(url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(options.headers.Authorization,'Bearer test-key');const body=JSON.parse(options.body);assert.equal(body.provider.data_collection,'deny');assert.ok(body.max_tokens<=240);
  return Response.json({choices:[{message:{content:'Fancy a coffee?'},finish_reason:'stop'}]});
 }});
 assert.equal(result.source,'AI WINGMAN · LIVE AI');assert.equal(result.context,undefined);assert.equal(result.body,'Fancy a coffee?');
});
test('Provider errors, empty and truncated replies are explicit failures, never demo',async()=>{
 for(const reply of [Response.json({error:'provider secret'},{status:429}),Response.json({choices:[]}),Response.json({choices:[{message:{content:'Unfinished'},finish_reason:'length'}]})]){
  await assert.rejects(()=>generateOpenRouter({},{key:'test-key',fetcher:async()=>reply}),e=>e.status===502&&!e.message.includes('secret'));
 }
});
