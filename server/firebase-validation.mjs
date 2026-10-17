import {plans,rouletteVariants,outcomes,lines} from '../public/content.mjs';
import {normalizeResult} from '../public/core.mjs';
const sig=r=>JSON.stringify([r.source,r.title,r.body]);
const canonical=new Set();
for(const options of Object.values(plans))for(const rows of Object.values(options))rows.forEach(([title,body],i)=>canonical.add(sig({title,body,source:'DECISION MACHINE · '+['SOFT LAUNCH','PLAYFUL','PLOT TWIST'][i%3]})));
rouletteVariants.forEach((rows,i)=>rows.forEach(([title,body])=>canonical.add(sig({title,body,source:'HORNY ROULETTE · '+outcomes[i][0].toUpperCase()}))));
const demos=new Set(Object.values(lines).flatMap(m=>Object.values(m).flat()));
export function canonicalKind(result){const r=normalizeResult(result);if(canonical.has(sig(r)))return r.source.startsWith('DECISION MACHINE')?'decision':'roulette';if(r.source==='AI WINGMAN · TEMPLATE DEMO'&&demos.has(r.body))return 'wingman';return null}
export function validateRoulette(result){const r=normalizeResult(result);if(!r.source.startsWith('HORNY ROULETTE · ')||!canonical.has(sig(r)))throw Object.assign(Error('Spin the Roulette to choose a recognised challenge.'),{status:400});return r}
