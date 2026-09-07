'use strict';

module.exports = {
  name: 'profile', aliases: ['me', 'rank'], category: 'users',
  description: 'View your MATEO-FMB profile.', usage: '/profile', role: 0, cooldown: 3,
  async execute(ctx) {
    const user = await ctx.db.ensureUser(ctx.userID);
    await ctx.db.write();
    return ctx.reply([
      'MATEO-FMB PROFILE', `Name: ${user.name}`, `Level: ${user.level}`,
      `XP: ${user.xp}/${user.level * 100}`, `Coins: ${user.coins}`,
      `Messages: ${user.messages}`, `Commands: ${user.commandsUsed}`,
    ].join('\n'));
  },
};
