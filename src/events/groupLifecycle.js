'use strict';

/**
 * Handles Messenger thread lifecycle events.
 * Bot-added approval flow lives in approval.js so a newly discovered group
 * receives exactly one approval notice before command execution is unlocked.
 */

const getGroup = (services, threadID) =>
  services?.groups?.get?.(threadID) || services?.db?.getGroup?.(threadID) || null;

const send = async (api, text, threadID) => {
  if (!api?.sendMessage || !threadID || !text) return;
  await api.sendMessage(text, threadID);
};

const memberName = participant =>
  participant?.fullName || participant?.name || participant?.userFbId || 'A Facebook user';

module.exports = {
  eventType: ['log:subscribe', 'log:unsubscribe'],

  async run(api, event, services = {}) {
    if (!api || !event?.threadID) return;

    const group = getGroup(services, event.threadID);
    const botID = String(api.getCurrentUserID?.() || '');
    const type = event.logMessageType;

    if (type === 'log:subscribe') {
      const participants = Array.isArray(event.logMessageData?.addedParticipants)
        ? event.logMessageData.addedParticipants
        : [];

      // approval.js owns the bot-added path, including the approval message.
      const botJoined = botID && participants.some(
        participant => String(participant?.userFbId || '') === botID,
      );
      if (botJoined) return;

      if (group?.approved !== true || group?.enabled === false || group?.welcome === false) return;

      for (const participant of participants) {
        await send(
          api,
          `Welcome ${memberName(participant)}. ${services.config?.get?.('botName', 'MATEO-FMB') || 'MATEO-FMB'} is ready to help.`,
          event.threadID,
        );
      }
      return;
    }

    if (type !== 'log:unsubscribe') return;

    const leftID = String(event.logMessageData?.leftParticipantFbId || '');

    if (botID && leftID === botID) {
      const threadName = event.threadName || event.threadID;
      const ids = services.config?.get?.('adminIDs', []) || [];
      for (const adminID of Array.isArray(ids) ? ids.filter(Boolean).map(String) : []) {
        await send(api, [
          'MATEO-FMB GROUP ALERT',
          `Removed from: ${threadName}`,
          `Thread ID: ${event.threadID}`,
          'Status: Offline',
        ].join('\n'), adminID);
      }
      return;
    }

    if (group?.approved !== true || group?.enabled === false || group?.goodbye === false) return;

    await send(
      api,
      `${event.logMessageBody || 'A Facebook user'} left the group.`,
      event.threadID,
    );
  },
};
