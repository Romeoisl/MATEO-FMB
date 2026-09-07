'use strict';

module.exports = {
  name: 'balance', aliases: ['bal', 'coins'], category: 'economy',
  description: 'Check your coin balance.', usage: '/balance', role: 0, cooldown: 3,
  async execute(ctx) {
    const user = await ctx.db.ensureUser(ctx.userID);
    await ctx.db.write();
    return ctx.reply(`You have ${user.coins} coins.`);
  },
};
