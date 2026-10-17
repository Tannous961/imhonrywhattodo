import {firebaseServices} from '../lib/firebase/admin.js';

// Firebase adapter boundary. It is intentionally isolated so the legacy SQLite API remains available locally.
export function createFirebaseAPI({send}){
 const cookie='ihw_firebase_session';
 const services=()=>firebaseServices();
 async function user(req){const token=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookie+'='))?.slice(cookie.length+1);if(!token)return null;try{return await services().auth.verifySessionCookie(token,true)}catch{return null}}
 return {async handle(req,res,route){if(!route.startsWith('/api/firebase/'))return false;try{if(route==='/api/firebase/auth/session'&&req.method==='GET'){const decoded=await user(req);return send(res,200,{member:decoded?{id:decoded.uid,email:decoded.email||null}:null})}if(route==='/api/firebase/health'&&req.method==='GET'){services();return send(res,200,{configured:true,projectId:'freelance-1234'})}return send(res,404,{error:'Firebase endpoint not found.'})}catch(error){return send(res,503,{error:'Firebase is not configured or unavailable.',detail:process.env.NODE_ENV==='production'?undefined:error.message})}}}
}
