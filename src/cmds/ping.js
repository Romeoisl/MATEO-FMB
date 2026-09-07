'use strict';

module.exports = {
  name: 'ping',
  aliases: ['p'],
  category: 'system',
  description: 'Check the bot response time.',
  usage: '/ping',
  cooldown: 2,
  role: 0,
  async execute(ctx) {
    const started = Date.now();
    if (typeof ctx.api.sendMessage !== 'function') return ctx.reply(ctx.format('Pong', ['Messenger API unavailable.']));
    await new Promise((resolve, reject) => {
      ctx.api.sendMessage(ctx.format('Pong', ['Checking connection...']), ctx.threadID, (error) => error ? reject(error) : resolve());
    });
    const latency = Date.now() - started;
    return ctx.reply(ctx.format('Pong', [`Latency: ${latency}ms`]));
  },
};
