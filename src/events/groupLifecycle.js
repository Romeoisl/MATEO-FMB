'use strict';

/**
 * Handles Messenger thread lifecycle events in one place.
 *
 * Responsibilities:
 * - announce members joining/leaving when enabled
 * - announce when the bot itself joins a thread
 * - notify configured bot admins if the bot is removed
 * - keep event failures isolated from the MQTT listener
 */

const getGroup = (services, threadID) =>
  services?.groups?.get?.(threadID) || services?.db?.getGroup?.(threadID) || null;

const send = async (api, text, threadID) => {
  if (!api?.sendMessage || !threadID || !text) return;
  await api.sendMessage(text, threadID);
};

const adminIDs = services => {
  const ids = services?.config?.get?.('adminIDs', []) || [];
  return Array.isArray(ids) ? ids.filter(Boolean).map(String) : [];
};

const memberName = participant =>
  participant?.fullName || participant?.name || participant?.userFbId || 'A Facebook user';

module.exports = {
  eventType: ['log:subscribe', 'log:unsubscribe'],

  async run(api, event, services = {}) {
    if (!api || !event?.threadID) return;

    const group = getGroup(services, event.threadID);
    if (group?.enabled === false) return;

    const botID = String(api.getCurrentUserID?.() || '');
    const type = event.logMessageType;

    if (type === 'log:subscribe') {
      const participants = Array.isArray(event.logMessageData?.addedParticipants)
        ? event.logMessageData.addedParticipants
        : [];

      const botJoined = botID && participants.some(
        participant => String(participant?.userFbId || '') === botID,
      );

      if (botJoined) {
        const message = group?.welcomeMessage
          || services.config?.get?.('welcomeMessage', 'MATEO-FMB is now active in this group.')
          || 'MATEO-FMB is now active in this group.';
        await send(api, message, event.threadID);
        return;
      }

      if (group?.welcome === false) return;

      for (const participant of participants) {
        await send(
          api,
          `Welcome ${memberName(participant)}. MATEO-FMB is ready to help.`,
          event.threadID,
        );
      }
      return;
    }

    if (type !== 'log:unsubscribe') return;

    const leftID = String(event.logMessageData?.leftParticipantFbId || '');

    if (botID && leftID === botID) {
      const threadName = event.threadName || event.threadID;
      const message = `MATEO-FMB was removed from "${threadName}".`;

      for (const adminID of adminIDs(services)) {
        await send(api, message, adminID);
      }
      return;
    }

    if (group?.goodbye === false) return;

    await send(
      api,
      `${event.logMessageBody || 'A Facebook user'} left the group.`,
      event.threadID,
    );
  },
};
