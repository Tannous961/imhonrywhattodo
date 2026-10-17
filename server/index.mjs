import http from 'node:http';
import next from 'next';
import {handleRuntime} from './firebase-runtime.mjs';
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const web=next({dev:process.env.NODE_ENV!=='production',hostname:host,port});
await web.prepare();
const render=web.getRequestHandler();
const server=http.createServer(async(req,res)=>{
 if(await handleRuntime(req,res))return;
 return render(req,res);
});
server.requestTimeout=30000;server.headersTimeout=10000;server.maxRequestsPerSocket=100;
server.once('error',error=>{
 console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use.`:'The local server could not start.');
 process.exitCode=1;
});
server.listen(port,host,()=>console.log(`Application ready at http://localhost:${port} · Wingman: ${process.env.OPENROUTER_API_KEY?'LIVE via OpenRouter':'DEMO'}`));
const stop=()=>server.close(()=>process.exit(0));
process.on('SIGINT',stop);process.on('SIGTERM',stop);
