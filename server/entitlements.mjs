export const FREE_WINGMAN_DAILY_LIMIT=5;
export const PREMIUM_WINGMAN_DAILY_LIMIT=50;
export function isPremium(member,now=Date.now()){return Number(member?.premium_until||0)>now}
export function limitsFor(member,now=Date.now()){const premium=isPremium(member,now);return {premium,wingmanDaily:premium?PREMIUM_WINGMAN_DAILY_LIMIT:FREE_WINGMAN_DAILY_LIMIT}}
export function consumeWingman(store,member,now=Date.now()){const limits=limitsFor(member,now),day=new Date(now).toISOString().slice(0,10);return {...limits,...store.members.consumeMemberUsage(member.id,'wingman',day,limits.wingmanDaily)}}
