// Run after: vercel login --global-config .vercel-auth
import {spawnSync} from 'node:child_process';
import path from 'node:path';
process.loadEnvFile('.env');
const cli=path.join(process.env.APPDATA,'npm/node_modules/vercel/dist/index.js');
const common=['--global-config','.vercel-auth','--scope','tannous961s-projects'];
const run=(args,input)=>{const r=spawnSync(process.execPath,[cli,...args,...common],{input,encoding:'utf8'});if(r.status!==0)throw new Error('Vercel command failed: '+args.slice(0,3).join(' ')+'. Check login/project access in Vercel CLI.');};
run(['link','--yes','--project','imhonrywhattodo']);
const values={FIREBASE_CLIENT_EMAIL:process.env.FIREBASE_CLIENT_EMAIL,FIREBASE_PRIVATE_KEY:process.env.FIREBASE_PRIVATE_KEY,OPENROUTER_API_KEY:process.env.OPENROUTER_API_KEY,OPENROUTER_MODEL:process.env.OPENROUTER_MODEL||'openai/gpt-4o-mini',AI_GLOBAL_DAILY_LIMIT:'100'};
for(const [name,value] of Object.entries(values)){if(!value)throw new Error('Missing '+name);for(const env of ['preview','production']){run(['env','add',name,env,'--force',...(name.includes('KEY')||name.includes('EMAIL')?['--sensitive']:[])],value);console.log('Configured '+name+' ('+env+')');}}
console.log('Vercel environment configured. No secrets printed.');
