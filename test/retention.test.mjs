import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyChallenge,completeDailyChallenge} from '../server/daily-challenge.mjs';
import {initialProfile,awardPoints,memberView} from '../server/firebase-members.mjs';
import {usageBucket,wingmanUsage} from '../server/wingman-usage.mjs';

test('daily challenge is server-selected, replay-safe, and shares the challenge reward cap',()=>{
 const p=initialProfile('a','qa@example.com','QA'),date=dailyChallenge(p).date;
 assert.equal(completeDailyChallenge(p,date,awardPoints),15);
 assert.equal(completeDailyChallenge(p,date,awardPoints),0);
 assert.equal(p.completed,1);
 assert.equal(awardPoints(p,'challenge'),0);
 assert.equal(memberView(p).dailyChallenge.completed,true);
 assert.throws(()=>completeDailyChallenge(p,'2000-01-01',awardPoints),e=>e.status===409);
 const q=initialProfile('b','qa@example.com','QA');awardPoints(q,'challenge');
 assert.equal(completeDailyChallenge(q,date,awardPoints),0);
 assert.equal(q.completed,1);
});
test('daily challenge changes at UTC midnight and yesterday completion does not carry over',()=>{
 const p={dailyChallenge:{date:'2026-10-18',status:'completed'}};
 assert.equal(dailyChallenge(p,Date.parse('2026-10-18T23:59:59Z')).completed,true);
 const tomorrow=dailyChallenge(p,Date.parse('2026-10-19T00:00:00Z'));
 assert.equal(tomorrow.completed,false);
 assert.equal(tomorrow.resetsAt,'2026-10-20T00:00:00.000Z');
 assert.notEqual(tomorrow.title,dailyChallenge(p,Date.parse('2026-10-18')).title);
});
test('next perk uses spendable balance and advances past already owned rewards',()=>{
 const p=initialProfile('a','qa@example.com','QA');
 assert.equal(memberView(p).rewardProgress.remaining,30);
 p.balance=80;p.ownedRewards=['lemon-cards'];
 assert.equal(memberView(p).rewardProgress.id,'peach-cards');
 assert.equal(memberView(p).rewardProgress.remaining,10);
 p.ownedRewards=['lemon-cards','peach-cards','menace-badge'];
 assert.equal(memberView(p).rewardProgress,null);
});
test('Wingman allowance uses an account and UTC-day bucket and preserves premium limits',async()=>{
 const now=Date.parse('2026-10-18T23:59:00Z');
 const db={collection:name=>{assert.equal(name,'ihw_limits');return {doc:id=>{assert.match(id,/^[a-f0-9]{64}$/);return {get:async()=>({data:()=>({count:5})})}}}}};
 const free=await wingmanUsage(db,{id:'a',premiumUntil:0},now);
 assert.equal(free.remaining,0);assert.equal(free.limit,5);
 assert.equal(free.resetsAt,'2026-10-19T00:00:00.000Z');
 assert.equal((await wingmanUsage(db,{id:'a',premiumUntil:now+1000},now)).remaining,45);
 assert.notEqual(usageBucket('a',now),usageBucket('b',now));
 assert.notEqual(usageBucket('a',now),usageBucket('a',now+60000));
});
