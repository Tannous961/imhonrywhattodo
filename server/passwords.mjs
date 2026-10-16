import {scrypt,randomBytes,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
const parameters={N:131072,r:8,p:1,maxmem:192*1024*1024};
export const hashToken=value=>createHash('sha256').update(value).digest('hex');
export function sameSecret(left,right){const a=Buffer.from(String(left)),b=Buffer.from(String(right));return a.length===b.length&&timingSafeEqual(a,b)}
export function validPassword(password){return typeof password==='string'&&password.length>=12&&password.length<=128}
export async function hashPassword(password){
 const salt=randomBytes(16).toString('hex');const value=await derive(password,salt,64,parameters);
 return `scrypt$131072$8$1$${salt}$${value.toString('hex')}`;
}
export async function verifyPassword(password,stored){
 // Missing users take the same expensive derivation path as existing users.
 const parts=stored?.split('$'),valid=parts?.length===6&&parts[0]==='scrypt'&&parts[1]==='131072'&&parts[2]==='8'&&parts[3]==='1'&&/^[a-f0-9]{32}$/.test(parts[4])&&/^[a-f0-9]{128}$/.test(parts[5]);
 const salt=valid?parts[4]:'00000000000000000000000000000000';
 const candidate=await derive(password,salt,64,parameters),expected=valid?Buffer.from(parts[5],'hex'):Buffer.alloc(64);
 return timingSafeEqual(candidate,expected)&&!!valid;
}
