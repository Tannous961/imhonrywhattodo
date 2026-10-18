import {createHash} from 'node:crypto';
export function usageBucket(uid,now=Date.now()){return 'wingman:'+new Date(now).toISOString().slice(0,10)+':'+uid;}
export async function wingmanUsage(db,profile,now=Date.now()){
 const limit=profile.premiumUntil>now?50:5;
 const snap=await db.collection('ihw_limits').doc(createHash('sha256').update(usageBucket(profile.id,now)).digest('hex')).get();
 const used=Math.max(0,Number(snap.data()?.count||0));
 return {plan:limit===5?'Free':'Premium',limit,used,remaining:Math.max(0,limit-used),resetsAt:new Date((Math.floor(now/86400000)+1)*86400000).toISOString()};
}
