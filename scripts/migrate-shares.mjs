import {DatabaseSync} from 'node:sqlite';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {firebaseServices} from '../lib/firebase/admin.js';
import {normalizeResult} from '../public/core.mjs';
const file=path.join(process.env.DATA_DIR||'./data','app.sqlite');
if(!existsSync(file)){console.log('No legacy share database found.');process.exit(0);}
const source=new DatabaseSync(file,{readOnly:true});
const rows=source.prepare('SELECT id,payload,delete_hash,expires FROM shares WHERE expires>?').all(Date.now());
if(!process.argv.includes('--apply')){console.log('Unexpired legacy links available: '+rows.length+'. Use --apply to preserve them in Firestore.');source.close();process.exit(0);}
const {db}=firebaseServices();let migrated=0,skipped=0;
try{for(const row of rows){if(!/^[A-Za-z0-9_-]{24}$/.test(row.id)||!/^[a-f0-9]{64}$/.test(row.delete_hash)){skipped++;continue;}const r=normalizeResult(JSON.parse(row.payload));const ref=db.collection('ihw_shares').doc(row.id);const added=await db.runTransaction(async tx=>{if((await tx.get(ref)).exists)return false;tx.create(ref,{payload:{title:r.title,body:r.body,source:r.source},deleteHash:row.delete_hash,ownerUid:null,expires:row.expires,expiresAt:new Date(row.expires)});return true;});if(added)migrated++;else skipped++;}console.log(JSON.stringify({migrated,skipped,sourceUnchanged:true}));}finally{source.close();await db.terminate();}
