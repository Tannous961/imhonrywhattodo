import {createApplication, configuration} from '../../server/app.mjs';
import {handleFirebase} from '../../server/firebase-auth-api.mjs';

let application;
export const config = {api: {bodyParser: false, responseLimit: false}};

export default async function handler(req, res) {
  try {
    if(await handleFirebase(req,res))return;
    application ||= createApplication({config: configuration()});
    await application.handler(req, res);
  } catch (error) {
    console.error('API startup failed:', error.message);
    if (!res.headersSent) {
      res.status(503).json({error: 'The account service is unavailable. Server storage must be configured by the site administrator.', code: 'SERVICE_UNAVAILABLE'});
    } else if (!res.writableEnded) res.end();
  }
}
