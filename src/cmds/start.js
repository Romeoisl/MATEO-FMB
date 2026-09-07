'use strict';

module.exports = {
  name: 'start',
  aliases: ['enable'],
  category: 'group',
  description: 'Enable MATEO-FMB in this group.',
  usage: '/start',
  role: 2,
  cooldown: 5,
  async execute(ctx) {
    const existing = ctx.db.getGroup(ctx.threadID);
    if (existing?.enabled) return ctx.reply('MATEO-FMB is already enabled in this group.');
    const target = existing || {
      threadID: String(ctx.threadID), enabled: true, prefix: null,
      welcome: true, goodbye: true, antiSpam: false, antiLink: false,
      language: 'en', adminIDs: [],
    };
    target.enabled = true;
    if (!existing) ctx.db.data.groups.push(target);
    await ctx.db.write();
    return ctx.reply('MATEO-FMB is now enabled in this group.');
  },
};
