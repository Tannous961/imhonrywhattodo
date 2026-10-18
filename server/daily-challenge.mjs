const challenges = [
 {title:'Main character walk',body:'Take a ten-minute walk. Pick one song for your imaginary opening credits. Stay aware of your surroundings.'},
 {title:'Compliment, no agenda',body:'Give someone you know a sincere, respectful compliment. No reply required. Charm is not an invoice.'},
 {title:'A date with yourself',body:'Set aside fifteen minutes for something you enjoy, without scrolling. You are excellent company.'},
 {title:'The tiny invitation',body:'Invite a friend to a simple catch-up. Offer a time and make it easy to decline. Coffee counts as a plot.'},
 {title:'One-song reset',body:'Play a favourite song and move however feels comfortable. Seated dancing absolutely counts.'},
 {title:'Future-you says thanks',body:'Spend ten minutes on one small task you have been avoiding. Then enjoy the smug little victory.'},
 {title:'A little gratitude',body:'Write down three small things you appreciated today. No grand revelations required. Good toast qualifies.'}
];
export const utcDay=(now=Date.now())=>new Date(now).toISOString().slice(0,10);
export function dailyChallenge(profile,now=Date.now()){
 const date=utcDay(now),index=Math.floor(Date.parse(date)/86400000)%challenges.length;
 return {...challenges[index],date,id:'daily-'+date,completed:profile.dailyChallenge?.date===date&&profile.dailyChallenge.status==='completed',points:15,resetsAt:new Date(Date.parse(date)+86400000).toISOString()};
}
export function completeDailyChallenge(profile,date,award,now=Date.now()){
 const challenge=dailyChallenge(profile,now);
 if(date!==challenge.date)throw Object.assign(Error('A new daily challenge is ready. Refresh before completing it.'),{status:409});
 if(challenge.completed)return 0;
 profile.dailyChallenge={date,status:'completed'};
 profile.completed++;
 return award(profile,'challenge');
}
