'use client';
import {useEffect,useState} from 'react';
export default function PremiumCTA(){const [configured,setConfigured]=useState(false);useEffect(()=>{fetch('/api/billing/status').then(r=>r.ok?r.json():null).then(x=>setConfigured(Boolean(x?.configured))).catch(()=>{});},[]);return <><button className="button primary" disabled={!configured}>{configured?'Start Premium checkout':'Stripe checkout coming soon'}</button><small>{configured?'Secure checkout is ready.':'Stripe integration is not configured yet — this button is intentionally inactive.'}</small></>}
