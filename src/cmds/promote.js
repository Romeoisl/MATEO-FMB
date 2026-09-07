'use strict';

module.exports = {
  name: 'promote',
  aliases: ['addadmin'],
  category: 'group',
  description: 'Grant group-admin access to a user ID or mention.',
  usage: '/addadmin <userID or @mention>',
  role: 2,
  cooldown: 3,
  async execute(ctx) {
    const id = ctx.args[0] || Object.values(ctx.message.mentions || {})[0]?.id;
    if (!id) return ctx.reply(`Usage: ${ctx.prefix}addadmin <userID>`);
    if (!ctx.groups?.addAdmin) return ctx.reply('Group management is unavailable.');
    await ctx.groups.addAdmin(ctx.threadID, id);
    return ctx.reply(`User ${id} is now a group admin.`);
  },
};
