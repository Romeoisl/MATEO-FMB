'use strict';

/**
 * Approval gate for newly discovered Messenger groups.
 * The bot stays in the group but remains disabled until a configured bot
 * admin approves the thread.
 */

const send = async (api, text, threadID) => {
  if (!api?.sendMessage || !threadID) return;
  await api.sendMessage(text, threadID);
};

const adminIDs = services => {
  const ids = services?.config?.get?.('adminIDs', []) || [];
  return Array.isArray(ids) ? ids.filter(Boolean).map(String) : [];
};

const isConfiguredGroup = (services, threadID) => {
  const allowed = services?.config?.get?.('allowedGroups', []) || [];
  return Array.isArray(allowed) && allowed.map(String).includes(String(threadID));
};

module.exports = {
  eventType: 'log:subscribe',

  async run(api, event, services = {}) {
    if (!api || !event?.threadID) return;

    const participants = Array.isArray(event.logMessageData?.addedParticipants)
      ? event.logMessageData.addedParticipants
      : [];
    const botID = String(api.getCurrentUserID?.() || '');
    const botJoined = botID && participants.some(
      participant => String(participant?.userFbId || '') === botID,
    );
    if (!botJoined) return;

    const groups = services.groups;
    const group = groups?.get?.(event.threadID) || services.db?.getGroup?.(event.threadID);
    const explicitlyAllowed = isConfiguredGroup(services, event.threadID);

    if (group?.approved === true || explicitlyAllowed) {
      if (explicitlyAllowed && group?.approved !== true) {
        await groups?.approve?.(event.threadID, 'config');
      }
      return;
    }

    await groups?.ensure?.(event.threadID, {
      approved: false,
      enabled: false,
    });

    const botName = String(services.config?.get?.('botName', 'MATEO-FMB') || 'MATEO-FMB');
    const prefix = String(services.config?.get?.('prefix', '/') || '/');
    const threadName = event.threadName || event.threadID;

    await send(api, [
      `╭─ ${botName}`,
      '│ GROUP APPROVAL REQUIRED',
      '│',
      `│ Group    : ${threadName}`,
      `│ Thread ID: ${event.threadID}`,
      '│',
      `│ ${botName} is currently in approval mode.`,
      '│ Commands are locked until a bot admin',
      '│ approves this group.',
      '│',
      '│ Admin approval:',
      `│ ${prefix}approve ${event.threadID}`,
      '│',
      '╰─ Awaiting approval ─╯',
    ].join('\n'), event.threadID);

    for (const adminID of adminIDs(services)) {
      await send(api, [
        `╭─ ${botName}`,
        '│ APPROVAL REQUEST',
        '│',
        `│ Group    : ${threadName}`,
        `│ Thread ID: ${event.threadID}`,
        '│ Status   : Pending approval',
        '│',
        `│ Approve: ${prefix}approve ${event.threadID}`,
        '╰─ Action required ─╯',
      ].join('\n'), adminID);
    }
  },
};
