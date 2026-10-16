import {randomBytes,createHash} from 'node:crypto';

export const rewards=[
 {id:'lemon-cards',name:'Lemon Pop cards',cost:50,description:'Unlock a lime frame and a fresh neon palette for your PNG cards.'},
 {id:'peach-cards',name:'Peach Glow cards',cost:90,description:'Unlock a peach frame and warm highlights for your PNG cards.'},
 {id:'menace-badge',name:'Little Menace badge',cost:100,description:'Add a little devil badge to your private club profile.'}
];
export const dailyRules={visit:5,decision:10,roulette:10,wingman:10,favorite:5,challenge:15};
export const dailyCap=55;
export const levels=[{name:'Curious Rookie',at:0},{name:'Plot Starter',at:50},{name:'Plot Twister',at:150},{name:'Chaos Curator',at:350},{name:'Certified Little Menace',at:700}];
const digest=value=>createHash('sha256').update(value).digest('hex');
const cleanResult=result=>({title:result.title,body:result.body,source:result.source});
export function createMemberStore(db){
 db.exec(`PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,display_name TEXT NOT NULL,password_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,created INTEGER NOT NULL,adult_confirmed INTEGER NOT NULL,history_enabled INTEGER NOT NULL DEFAULT 0,card_style TEXT NOT NULL DEFAULT 'classic');
 CREATE TABLE IF NOT EXISTS member_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS point_ledger(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,reason TEXT NOT NULL,bucket TEXT NOT NULL,delta INTEGER NOT NULL,created INTEGER NOT NULL,UNIQUE(user_id,reason,bucket));
 CREATE TABLE IF NOT EXISTS member_rewards(user_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,reward_id TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(user_id,reward_id));
 CREATE TABLE IF NOT EXISTS member_results(user_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,result_id TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN ('favorite','history')),payload TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(user_id,result_id,kind));
 CREATE TABLE IF NOT EXISTS member_challenges(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,payload TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('active','completed','skipped')),created INTEGER NOT NULL,updated INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS member_result_order ON member_results(user_id,kind,created DESC);
 CREATE INDEX IF NOT EXISTS member_challenge_order ON member_challenges(user_id,updated DESC);
 CREATE UNIQUE INDEX IF NOT EXISTS member_one_active_challenge ON member_challenges(user_id) WHERE status='active';`);
 const transaction=fn=>{db.exec('BEGIN IMMEDIATE');try{const result=fn();db.exec('COMMIT');return result}catch(error){db.exec('ROLLBACK');throw error}};
 const user=id=>db.prepare('SELECT * FROM members WHERE id=?').get(id);
 function balance(id){return Number(db.prepare('SELECT COALESCE(SUM(delta),0) AS n FROM point_ledger WHERE user_id=?').get(id).n)}
 function award(id,reason,now=Date.now()){
  const points=dailyRules[reason];if(!points)throw Error('Unknown activity.');
  const day=new Date(now).toISOString().slice(0,10);
  if(db.prepare('SELECT 1 FROM point_ledger WHERE user_id=? AND reason=? AND bucket=?').get(id,reason,day))return 0;
  const earned=Number(db.prepare('SELECT COALESCE(SUM(delta),0) AS n FROM point_ledger WHERE user_id=? AND bucket=? AND delta>0').get(id,day).n);
  const granted=Math.min(points,Math.max(0,dailyCap-earned));if(!granted)return 0;
  db.prepare('INSERT INTO point_ledger(user_id,reason,bucket,delta,created) VALUES (?,?,?,?,?)').run(id,reason,day,granted,now);return granted;
 }
 function saveResult(id,result,kind){
  const payload=JSON.stringify(cleanResult(result)),resultId=digest(payload),now=Date.now();
  const existing=db.prepare('SELECT 1 FROM member_results WHERE user_id=? AND result_id=? AND kind=?').get(id,resultId,kind);
  if(kind==='favorite'&&!existing&&Number(db.prepare("SELECT COUNT(*) AS n FROM member_results WHERE user_id=? AND kind='favorite'").get(id).n)>=30)throw Object.assign(Error('You can keep up to 30 favourites. Remove one to save another.'),{status:400});
  db.prepare('INSERT INTO member_results VALUES (?,?,?,?,?) ON CONFLICT(user_id,result_id,kind) DO UPDATE SET created=excluded.created').run(id,resultId,kind,payload,now);
  if(kind==='history')db.prepare("DELETE FROM member_results WHERE user_id=? AND kind='history' AND result_id NOT IN (SELECT result_id FROM member_results WHERE user_id=? AND kind='history' ORDER BY created DESC LIMIT 50)").run(id,id);
  return resultId;
 }
 return {
  cleanup(){db.prepare('DELETE FROM member_sessions WHERE expires<=?').run(Date.now())},
  byName:name=>db.prepare('SELECT * FROM members WHERE username=?').get(name),
  byId:user,
  create({username,displayName,passwordHash,recoveryHash,now=Date.now()}){return transaction(()=>{
   const id=randomBytes(18).toString('base64url');
   db.prepare('INSERT INTO members(id,username,display_name,password_hash,recovery_hash,created,adult_confirmed) VALUES (?,?,?,?,?,?,?)').run(id,username,displayName,passwordHash,recoveryHash,now,now);
   db.prepare('INSERT INTO point_ledger(user_id,reason,bucket,delta,created) VALUES (?,?,?,?,?)').run(id,'welcome','once',20,now);return id;
  })},
  session(tokenHash){const row=db.prepare('SELECT s.user_id,s.csrf,s.expires FROM member_sessions s JOIN members m ON m.id=s.user_id WHERE s.token_hash=? AND s.expires>?').get(tokenHash,Date.now());return row||null},
  addSession(tokenHash,id,csrf,expires){db.prepare('INSERT INTO member_sessions VALUES (?,?,?,?)').run(tokenHash,id,csrf,expires)},
  revoke:tokenHash=>db.prepare('DELETE FROM member_sessions WHERE token_hash=?').run(tokenHash),
  snapshot(id,now=Date.now()){
   const member=user(id);if(!member)return null;
   const rows=db.prepare('SELECT reason,delta,created FROM point_ledger WHERE user_id=? ORDER BY id DESC LIMIT 15').all(id);
   const lifetime=Number(db.prepare('SELECT COALESCE(SUM(delta),0) AS n FROM point_ledger WHERE user_id=? AND delta>0').get(id).n);
   const owned=db.prepare('SELECT reward_id FROM member_rewards WHERE user_id=?').all(id).map(row=>row.reward_id);
   const day=new Date(now).toISOString().slice(0,10),earnedRows=db.prepare('SELECT reason,delta FROM point_ledger WHERE user_id=? AND bucket=? AND delta>0').all(id,day);
   const level=levels.filter(level=>lifetime>=level.at).at(-1),next=levels.find(level=>lifetime<level.at)||null;
   const completed=Number(db.prepare("SELECT COUNT(*) AS n FROM member_challenges WHERE user_id=? AND status='completed'").get(id).n);
   const wingmanDays=Number(db.prepare("SELECT COUNT(DISTINCT bucket) AS n FROM point_ledger WHERE user_id=? AND reason='wingman' AND delta>0").get(id).n);
   const badges=[
    {id:'first-move',name:'First Move',description:'Complete your first challenge.',owned:completed>=1},
    {id:'roulette-regular',name:'Roulette Regular',description:'Complete five challenges.',owned:completed>=5},
    {id:'wingman-apprentice',name:'Wingman Apprentice',description:'Earn Wingman points on five different days.',owned:wingmanDays>=5}
   ];
   return {id:member.id,username:member.username,displayName:member.display_name,balance:balance(id),lifetime,level,nextLevel:next,ownedRewards:owned,rewards:rewards.map(reward=>({...reward,owned:owned.includes(reward.id)})),badges,preferences:{historyEnabled:!!member.history_enabled,cardStyle:member.card_style},daily:{date:day,cap:dailyCap,earned:earnedRows.reduce((sum,row)=>sum+row.delta,0),rules:Object.entries(dailyRules).map(([id,points])=>({id,points,done:earnedRows.some(row=>row.reason===id)}))},ledger:rows.map(row=>({reason:row.reason,points:row.delta,createdAt:new Date(row.created).toISOString()}))};
  },
  checkIn(id,now){return transaction(()=>award(id,'visit',now))},
  activity(id,kind,result,now=Date.now()){return transaction(()=>{
   const member=user(id);if(!member)throw Object.assign(Error('Sign in again.'),{status:401});
   if(member.history_enabled)saveResult(id,result,'history');
   return award(id,kind,now);
  })},
  favorite(id,result,now=Date.now()){return transaction(()=>{const resultId=saveResult(id,result,'favorite');return {id:resultId,points:award(id,'favorite',now)}})},
  challenges(id){return db.prepare("SELECT id,payload,status,created,updated FROM member_challenges WHERE user_id=? ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END,updated DESC LIMIT 31").all(id).map(row=>({id:row.id,...JSON.parse(row.payload),status:row.status,createdAt:new Date(row.created).toISOString(),updatedAt:new Date(row.updated).toISOString()}))},
  acceptChallenge(id,result,now=Date.now()){return transaction(()=>{
   const active=db.prepare("SELECT id FROM member_challenges WHERE user_id=? AND status='active'").get(id);
   if(active)throw Object.assign(Error('Finish or skip your active challenge first.'),{status:409});
   const challengeId=randomBytes(18).toString('base64url');
   db.prepare('INSERT INTO member_challenges VALUES (?,?,?,?,?,?)').run(challengeId,id,JSON.stringify(cleanResult(result)),'active',now,now);
   return challengeId;
  })},
  closeChallenge(id,challengeId,status,now=Date.now()){return transaction(()=>{
   const row=db.prepare('SELECT status FROM member_challenges WHERE id=? AND user_id=?').get(challengeId,id);
   if(!row)throw Object.assign(Error('Challenge not found.'),{status:404});
   if(row.status!=='active'){
    if(row.status===status)return {status,points:0,alreadyClosed:true};
    throw Object.assign(Error('That challenge is already closed.'),{status:409});
   }
   db.prepare('UPDATE member_challenges SET status=?,updated=? WHERE id=? AND user_id=?').run(status,now,challengeId,id);
   return {status,points:status==='completed'?award(id,'challenge',now):0,alreadyClosed:false};
  })},
  list(id,kind){return db.prepare('SELECT result_id,payload,created FROM member_results WHERE user_id=? AND kind=? ORDER BY created DESC').all(id,kind).map(row=>({id:row.result_id,...JSON.parse(row.payload),createdAt:new Date(row.created).toISOString()}))},
  removeResult(id,resultId,kind){return db.prepare('DELETE FROM member_results WHERE user_id=? AND result_id=? AND kind=?').run(id,resultId,kind).changes>0},
  clearHistory(id){db.prepare("DELETE FROM member_results WHERE user_id=? AND kind='history'").run(id)},
  preferences(id,{displayName,historyEnabled,cardStyle}){
   const required={'lemon':'lemon-cards','peach':'peach-cards'}[cardStyle];
   if(!['classic','lemon','peach'].includes(cardStyle)||(required&&!db.prepare('SELECT 1 FROM member_rewards WHERE user_id=? AND reward_id=?').get(id,required)))throw Object.assign(Error('Unlock that card style first.'),{status:400});
   db.prepare('UPDATE members SET display_name=?,history_enabled=?,card_style=? WHERE id=?').run(displayName,historyEnabled?1:0,cardStyle,id);
  },
  redeem(id,rewardId){return transaction(()=>{
   const reward=rewards.find(reward=>reward.id===rewardId);if(!reward)throw Object.assign(Error('Unknown reward.'),{status:400});
   if(db.prepare('SELECT 1 FROM member_rewards WHERE user_id=? AND reward_id=?').get(id,rewardId))return {spent:0,alreadyOwned:true};
   if(balance(id)<reward.cost)throw Object.assign(Error('Not enough points yet. Your next useful activity will get you closer.'),{status:400});
   const now=Date.now();db.prepare('INSERT INTO member_rewards VALUES (?,?,?)').run(id,rewardId,now);
   db.prepare('INSERT INTO point_ledger(user_id,reason,bucket,delta,created) VALUES (?,?,?,?,?)').run(id,'redeem:'+rewardId,'once',-reward.cost,now);return {spent:reward.cost,alreadyOwned:false};
  })},
  resetPassword(id,oldRecoveryHash,newPasswordHash,newRecoveryHash){return transaction(()=>{
   const change=db.prepare('UPDATE members SET password_hash=?,recovery_hash=? WHERE id=? AND recovery_hash=?').run(newPasswordHash,newRecoveryHash,id,oldRecoveryHash);
   if(!change.changes)return false;db.prepare('DELETE FROM member_sessions WHERE user_id=?').run(id);return true;
  })},
  changePassword(id,oldHash,newHash){return transaction(()=>{const changed=db.prepare('UPDATE members SET password_hash=? WHERE id=? AND password_hash=?').run(newHash,id,oldHash);if(!changed.changes)return false;db.prepare('DELETE FROM member_sessions WHERE user_id=?').run(id);return true})},
  deleteAccount(id,passwordHash){return db.prepare('DELETE FROM members WHERE id=? AND password_hash=?').run(id,passwordHash).changes>0}
 };
}
