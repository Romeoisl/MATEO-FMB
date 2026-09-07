'use strict';
const settings = require('../../settings.json');
module.exports = { default: { eventType: ['log:subscribe','log:unsubscribe'], run: async (api,event) => {
  if (!api || !event?.threadID) return;
  const group = api.__mateoGroupConfig || null;
  const botID=api.getCurrentUserID?.() || '';
  if(event.logMessageType==='log:subscribe'){
    const participants=event.logMessageData?.addedParticipants || [];
    const botAdded=participants.some(p=>String(p.userFbId)===String(botID));
    if(botAdded){ api.sendMessage(settings.welcomeMessage || "Hello! I'm MATEO-FMB.",event.threadID); return; }
    if(group?.welcome===false)return;
    for(const participant of participants) api.sendMessage(`Welcome ${participant.fullName || 'Facebook User'} to the group!`,event.threadID);
  }
  if(event.logMessageType==='log:unsubscribe'){
    const leftID=event.logMessageData?.leftParticipantFbId;
    if(String(leftID)===String(botID)){ for(const adminID of settings.adminIDs||[]) if(adminID) api.sendMessage(`MATEO-FMB was removed from group ${event.threadName||event.threadID}.`,adminID); return; }
    if(group?.goodbye!==false) api.sendMessage(`${event.logMessageBody || 'A Facebook user'} left the group.`,event.threadID);
  }
} } };
