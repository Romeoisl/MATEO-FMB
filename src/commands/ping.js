module.exports = {
  name: 'ping',
  description: 'Check bot latency and response time',
  category: 'utility',
  aliases: ['p', 'pong'],
  cooldown: 2,

  async execute(ctx) {
    const start = Date.now();
    const msg = await ctx.api.sendMessage(
      '🏓 Pong! Calculating...',
      ctx.message.threadID
    );
    const latency = Date.now() - start;

    await ctx.api.editMessage(
      `🏓 **Pong!**\n\nLatency: ${latency}ms`,
      msg.messageID
    );
  },
};