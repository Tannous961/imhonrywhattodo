import test from 'node:test';import assert from 'node:assert/strict';
import {canonicalKind,validateRoulette} from '../server/firebase-validation.mjs';import {rouletteResult,decide} from '../public/core.mjs';
test('canonical validation classifies curated results',()=>{assert.equal(canonicalKind(decide({company:'solo',energy:'low',boldness:1},x=>x[0])),'decision');const r=rouletteResult(0,x=>x[0]);assert.equal(canonicalKind(r),'roulette');assert.deepEqual(validateRoulette(r),r)});
test('roulette validation rejects forged payloads',()=>{assert.throws(()=>validateRoulette({title:'x',body:'y',source:'HORNY ROULETTE · RESET'}),/recognised challenge/)});
