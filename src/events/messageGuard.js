'use strict';

const LINK_RE=/https?:\/\/\S+/i;
const buckets=new Map();
module.exports={default:{eventType:'message',run:async(api,event,services)=>{
  if(!api||!event?.threadID||!event.senderID)return;
  const group=services?.db?.getGroup?.(event.threadID); if(!group?.enabled)return;
  const now=Date.now(),key=`${event.threadID}:${event.senderID}`; const bucket=buckets.get(key)||[]; const recent=bucket.filter(t=>now-t<10000); recent.push(now); buckets.set(key,recent);
  if(group.antiLink&&LINK_RE.test(String(event.body||''))){api.sendMessage('Links are restricted in this group.',event.threadID);return;}
  if(group.antiSpam&&recent.length>=6){api.sendMessage('Please slow down. MATEO-FMB anti-spam protection is active.',event.threadID);}
  if(buckets.size>5000){for(const[k,v]of buckets)if(v.every(t=>now-t>60000))buckets.delete(k);}
}}};
