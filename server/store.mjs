import {DatabaseSync} from 'node:sqlite';
import {randomBytes} from 'node:crypto';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {createMemberStore} from './member-store.mjs';

export function createStore(directory) {
  if(directory!==':memory:') mkdirSync(directory,{recursive:true});
  const db=new DatabaseSync(directory===':memory:'?':memory:':path.join(directory,'app.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS shares(id TEXT PRIMARY KEY, payload TEXT NOT NULL, delete_hash TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS quotas(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('hash_secret',randomBytes(32).toString('hex'));
  const secret=db.prepare('SELECT value FROM settings WHERE key=?').get('hash_secret').value;
  const members=createMemberStore(db);
  const cleanup=()=>{const now=Date.now();db.prepare('DELETE FROM shares WHERE expires<=?').run(now);db.prepare('DELETE FROM quotas WHERE expires<=?').run(now);members.cleanup()};
  cleanup();
  return {
    secret,members,close:()=>db.close(),cleanup,
    // All buckets are reserved together, before any paid API call.
    consume(buckets) {
      db.exec('BEGIN IMMEDIATE');
      try {
        for(const {key,limit,expires} of buckets) {
          const old=db.prepare('SELECT count,expires FROM quotas WHERE key=?').get(key);
          const count=old&&old.expires>Date.now()?old.count:0;
          if(count>=limit){db.exec('ROLLBACK');return {allowed:false,retry:Math.max(1,Math.ceil((expires-Date.now())/1000))}}
        }
        for(const {key,expires} of buckets) db.prepare('INSERT INTO quotas VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN quotas.expires<=? THEN 1 ELSE quotas.count+1 END, expires=excluded.expires').run(key,expires,Date.now());
        db.exec('COMMIT');return {allowed:true};
      }catch(e){db.exec('ROLLBACK');throw e}
    },
    save(id,payload,deleteHash,expires){db.prepare('INSERT INTO shares VALUES (?,?,?,?)').run(id,JSON.stringify(payload),deleteHash,expires)},
    get(id){const row=db.prepare('SELECT payload,expires FROM shares WHERE id=? AND expires>?').get(id,Date.now());return row?{...JSON.parse(row.payload),expiresAt:new Date(row.expires).toISOString()}:null},
    delete(id,hash){return db.prepare('DELETE FROM shares WHERE id=? AND delete_hash=?').run(id,hash).changes>0}
  };
}
