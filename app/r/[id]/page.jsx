import LegacyShell from '../../legacy-shell';
import {firebaseServices} from '../../../lib/firebase/admin';
import {createFirebaseShares} from '../../../server/firebase-shares.mjs';
export const dynamic='force-dynamic';
export async function generateMetadata({params}){
 const {id}=await params;
 if(!/^[A-Za-z0-9_-]{24}$/.test(id))return {title:'Result unavailable',robots:{index:false}};
 try{const result=await createFirebaseShares({db:firebaseServices().db}).get(id);if(!result)return {title:'Result unavailable',robots:{index:false}};return {title:result.title+' · IMHORNY',description:result.body.slice(0,160),openGraph:{title:result.title,description:result.body.slice(0,160)},robots:{index:false}};}catch{return {title:'Shared result · IMHORNY',robots:{index:false}};}
}
export default function SharedResult(){return <LegacyShell route="shared"/>}
