'use strict';

module.exports = {
  name: 'addadmin', aliases: ['groupadmin'], category: 'group',
  description: 'Grant group-admin access to a user ID or mention.',
  usage: '/addadmin <userID or @mention>', role: 2, cooldown: 3,
  async execute(ctx) {
    const id = ctx.args[0] || Object.values(ctx.message.mentions || {})[0]?.id;
    if (!id) return ctx.reply(`Usage: ${ctx.prefix}addadmin <userID>`);
    let group = ctx.db.getGroup(ctx.threadID);
    if (!group) { group = { threadID: String(ctx.threadID), enabled: false, prefix: null, welcome: true, goodbye: true, antiSpam: false, antiLink: false, language: 'en', adminIDs: [] }; ctx.db.data.groups.push(group); }
    if (!group.adminIDs.map(String).includes(String(id))) group.adminIDs.push(String(id));
    await ctx.db.write();
    return ctx.reply(`User ${id} is now a group admin.`);
  },
};
