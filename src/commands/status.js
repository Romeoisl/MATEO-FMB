module.exports = {
  name: 'status',
  description: 'Show bot status and statistics',
  category: 'utility',
  aliases: ['info', 'stats'],

  async execute(ctx) {
    const status = ctx.bot.getStatus();
    const uptime = Math.floor(status.uptime / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    const statusText = `
📊 **Bot Status**

🟢 Status: ${status.status}
⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s
💬 Messages Handled: ${status.stats.messagesHandled}
⚙️ Commands Executed: ${status.stats.commandsExecuted}
❌ Errors: ${status.stats.errorsEncountered}
    `.trim();

    ctx.reply(statusText);
  },
};