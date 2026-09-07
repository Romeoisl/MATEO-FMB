'use strict';

module.exports = {
  name: 'ping', aliases: ['p'], category: 'system', description: 'Check the bot response time.', usage: '/ping', cooldown: 2, role: 0,
  async execute(ctx) { const started = Date.now(); const message = await ctx.reply(ctx.format('Pong', ['Checking connection...'])); const latency = Date.now() - started; if (message?.messageID && ctx.api?.editMessage) { try { await ctx.api.editMessage(ctx.format('Pong', [`Latency: ${latency}ms`]), message.messageID); } catch (_) {} } }
};
