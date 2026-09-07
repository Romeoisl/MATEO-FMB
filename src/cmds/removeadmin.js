'use strict';

module.exports = {
  name: 'removeadmin', aliases: ['deladmin'], category: 'group',
  description: 'Remove group-admin access from a user ID or mention.',
  usage: '/removeadmin <userID or @mention>', role: 2, cooldown: 3,
  async execute(ctx) {
    const id = ctx.args[0] || Object.values(ctx.message.mentions || {})[0]?.id;
    const group = ctx.db.getGroup(ctx.threadID);
    if (!id) return ctx.reply(`Usage: ${ctx.prefix}removeadmin <userID>`);
    if (!group) return ctx.reply('This group has no configuration yet.');
    group.adminIDs = (group.adminIDs || []).filter(item => String(item) !== String(id));
    await ctx.db.write();
    return ctx.reply(`User ${id} is no longer a group admin.`);
  },
};
