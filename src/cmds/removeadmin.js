'use strict';

module.exports = {
  name: 'removeadmin',
  aliases: ['demote', 'rmad'],
  category: 'group',
  description: 'Remove group-admin access from a user ID or mention.',
  usage: '/removeadmin <userID or @mention>',
  role: 2,
  cooldown: 3,
  async execute(ctx) {
    const id = ctx.args[0] || Object.values(ctx.message.mentions || {})[0]?.id;
    if (!id) return ctx.reply(`Usage: ${ctx.prefix}removeadmin <userID>`);
    if (!ctx.groups?.removeAdmin) return ctx.reply('Group management is unavailable.');
    const group = ctx.groups.get(ctx.threadID);
    if (!group?.adminIDs?.some(item => String(item) === String(id))) {
      return ctx.reply(`User ${id} is not a group admin.`);
    }
    await ctx.groups.removeAdmin(ctx.threadID, id);
    return ctx.reply(`User ${id} is no longer a group admin.`);
  },
};
