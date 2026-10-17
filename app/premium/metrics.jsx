'use client';
import {useEffect} from 'react';
export default function PremiumMetrics(){useEffect(()=>{void fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event:'premium_view'})}).catch(()=>{});},[]);return null;}
