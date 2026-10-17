import test from 'node:test';
import assert from 'node:assert/strict';
import {initialProfile,awardPoints,memberView} from '../server/firebase-members.mjs';
test('Firebase points are bounded, replay-safe and expose no private result arrays',()=>{
 const p=initialProfile('test','test@example.com','Test');
 assert.equal(awardPoints(p,'visit'),5);
 assert.equal(awardPoints(p,'visit'),0);
 for(const kind of ['decision','roulette','wingman','favorite','challenge'])awardPoints(p,kind);
 assert.equal(p.daily.earned,55);
 assert.equal(p.balance,75);
 const view=memberView(p);
 assert.equal(view.level.name,'Plot Starter');
 assert.equal(view.daily.cap,55);
 assert.equal(view.favorites,undefined);
 p.daily.date='2000-01-01';
 assert.equal(awardPoints(p,'visit'),5);
});
