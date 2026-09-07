'use strict';

module.exports = {
  eventType: 'message',
  run: async (api, event, services) => {
    const result = await services?.moderation?.inspect(event);
    if (!result || result.action !== 'warn') return;
    await api.sendMessage(`⚠️ ${result.reason}\nWarnings: ${result.warnings}`, event.threadID);
  },
};
