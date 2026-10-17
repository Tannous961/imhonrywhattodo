export const ANALYTICS_EVENTS=Object.freeze(['account_created','first_activity','premium_view','limit_reached']);
export function createFirebaseAnalytics(db){return {
 async record(event){if(!ANALYTICS_EVENTS.includes(event))throw new Error('Unknown analytics event.');const ref=db.collection('ihw_metrics').doc(new Date().toISOString().slice(0,10));await db.runTransaction(async tx=>{const s=await tx.get(ref);tx.set(ref,{[event]:Number(s.data()?.[event]||0)+1},{merge:true});});},
 async daily(day=new Date().toISOString().slice(0,10)){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Invalid date.');const s=await db.collection('ihw_metrics').doc(day).get();return Object.fromEntries(ANALYTICS_EVENTS.map(k=>[k,Number(s.data()?.[k]||0)]));}
};}
