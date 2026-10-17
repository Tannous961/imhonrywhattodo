import {handleRuntime} from '../../server/firebase-runtime.mjs';
export const config = {api: {bodyParser: false, responseLimit: false}};
export const maxDuration=60;
export default async function handler(req,res){await handleRuntime(req,res);}
