import http from 'node:http';
import {createApplication,configuration} from './app.mjs';
const config=configuration();
const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';
const app=createApplication({config});
const server=http.createServer(app.handler);
server.requestTimeout=30000;server.headersTimeout=10000;server.maxRequestsPerSocket=100;
server.once('error',error=>{
 app.close();
 console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use. Open ${config.publicURL} if another copy is running, or stop that copy before restarting.`:'The local server could not start. Check the port, storage folder and configuration.');
 process.exitCode=1;
});
server.listen(port,host,()=>console.log(`Application ready at ${config.publicURL} · Wingman: ${config.key?'LIVE (provider access not yet verified)':'DEMO (no API key)'}`));
const stop=()=>server.close(()=>{app.close();process.exit(0)});
process.on('SIGINT',stop);process.on('SIGTERM',stop);
