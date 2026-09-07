'use strict';

module.exports = {
  name: 'userinfo',
  aliases: ['ui', 'whois'],
  category: 'users',
  description: 'Display information about a user.',
  usage: '/userinfo [userID or mention]',
  cooldown: 3,
  role: 0,

  async execute(ctx) {
    let userID = ctx.args[0];
    if (userID && !/^\d+$/.test(userID)) userID = ctx.message.mentions?.[userID]?.id;
    userID = userID || ctx.userID;

    const user = await ctx.db.ensureUser(userID);
    if (!user) return ctx.reply('User not found.');

    const name = await new Promise(resolve => {
      if (typeof ctx.api.getUserInfo !== 'function') return resolve(user.name || userID);
      ctx.api.getUserInfo(userID, (error, info) => resolve(!error && info?.[userID]?.name ? info[userID].name : (user.name || userID)));
    });

    user.name = name;
    await ctx.db.write();
    return ctx.reply([
      'MATEO-FMB USER PROFILE',
      `Name: ${name}`,
      `User ID: ${userID}`,
      `Level: ${user.level}`,
      `XP: ${user.xp}`,
      `Coins: ${user.coins}`,
      `Messages: ${user.messages}`,
    ].join('\n'));
  },
};
