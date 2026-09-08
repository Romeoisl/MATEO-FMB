'use strict';

module.exports = {
  name: 'start', aliases: ['enable'], category: 'group',
  description: 'Enable MATEO-FMB in an approved group.', usage: '/start', role: 2, cooldown: 5,
  async execute(ctx) {
    const existing = ctx.groups?.get(ctx.threadID);
    if (existing?.approved !== true) {
      return ctx.reply(ctx.error('This group must be approved before MATEO-FMB can be enabled.'));
    }
    if (existing?.enabled) return ctx.reply('MATEO-FMB is already enabled in this group.');
    await ctx.groups.ensure(ctx.threadID, { enabled: true });
    return ctx.reply(ctx.format('Group Enabled', [
      `Thread ID: ${ctx.threadID}`,
      'Status: Active',
    ]));
  },
};
