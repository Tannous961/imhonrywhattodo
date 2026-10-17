export function createBillingService({store,config}){
 const unavailable=()=>Object.assign(Error('Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_MONTHLY.'),{status:503});
 const current=req=>{const s=store.members.session?.(req);return s?store.members.byId(s.user_id):null};
 return {
  status(id){const member=store.members.byId(id);return {premiumUntil:Number(member?.premium_until||0)||null,active:Number(member?.premium_until||0)>Date.now(),subscription:store.members.subscription(id)}},
  async checkout(){if(!config.stripeKey||!config.stripePrice)return unavailable();throw Object.assign(Error('Stripe Checkout adapter is not enabled yet.'),{status:501})},
  async portal(){if(!config.stripeKey)return unavailable();throw Object.assign(Error('Stripe Customer Portal adapter is not enabled yet.'),{status:501})},
  webhook(){throw Object.assign(Error('Stripe webhook verification requires the Stripe adapter.'),{status:501})}
 };
}
