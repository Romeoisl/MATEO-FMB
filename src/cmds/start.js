'use strict';

module.exports = {
  name: 'start',
  aliases: ['enable'],
  category: 'group',
  description: 'Enable MATEO-FMB in this group.',
  usage: '/start',
  role: 1,
  cooldown: 5,
  async execute(ctx) {
    const existing = ctx.groups?.get(ctx.threadID);
    if (existing?.enabled) return ctx.reply('MATEO-FMB is already enabled in this group.');
    await ctx.groups.ensure(ctx.threadID, { enabled: true });
    return ctx.reply('MATEO-FMB is now enabled in this group.');
  },
};
