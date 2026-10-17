import {createHash} from 'node:crypto';
export const ANALYTICS_EVENTS=Object.freeze(['account_created','first_activity','premium_view','limit_reached']);
const valid=new Set(ANALYTICS_EVENTS);
const dayOf=now=>new Date(now).toISOString().slice(0,10);
const digest=value=>createHash('sha256').update(String(value)).digest('hex');
export function createFirebaseAnalytics(db){
 db.exec(`CREATE TABLE IF NOT EXISTS analytics_daily(event TEXT NOT NULL,day TEXT NOT NULL,count INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(event,day)); CREATE TABLE IF NOT EXISTS analytics_dedupe(event TEXT NOT NULL,day TEXT NOT NULL,key_hash TEXT NOT NULL,PRIMARY KEY(event,day,key_hash));`);
 return {
  record(event,{now=Date.now(),dedupeKey=null}={}){if(!valid.has(event))throw new Error('Unknown analytics event.');const day=dayOf(now);db.exec('BEGIN IMMEDIATE');try{if(dedupeKey!==null){const hash=digest(dedupeKey);if(db.prepare('SELECT 1 FROM analytics_dedupe WHERE event=? AND day=? AND key_hash=?').get(event,day,hash)){db.exec('COMMIT');return false}db.prepare('INSERT INTO analytics_dedupe VALUES (?,?,?)').run(event,day,hash)}db.prepare('INSERT INTO analytics_daily(event,day,count) VALUES (?,?,1) ON CONFLICT(event,day) DO UPDATE SET count=count+1').run(event,day);db.exec('COMMIT');return true}catch(error){db.exec('ROLLBACK');throw error}},
  daily(day=dayOf(Date.now())){return Object.fromEntries(ANALYTICS_EVENTS.map(event=>[event,Number(db.prepare('SELECT count FROM analytics_daily WHERE event=? AND day=?').get(event,day)?.count||0)]))},
  cleanup(beforeDay=dayOf(Date.now())){db.prepare('DELETE FROM analytics_daily WHERE day<?').run(beforeDay);db.prepare('DELETE FROM analytics_dedupe WHERE day<?').run(beforeDay)}
 };
}
