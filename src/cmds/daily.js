'use strict';

const DAY = 24 * 60 * 60 * 1000;

module.exports = {
  name: 'daily', aliases: ['reward'], category: 'economy',
  description: 'Claim your daily coin reward.', usage: '/daily', role: 0, cooldown: 5,
  async execute(ctx) {
    const user = await ctx.db.ensureUser(ctx.userID);
    const now = Date.now();
    const last = user.lastDaily ? new Date(user.lastDaily).getTime() : 0;
    const remaining = DAY - (now - last);
    if (remaining > 0) return ctx.reply(`Your daily reward is ready in ${Math.ceil(remaining / 3600000)}h.`);
    const reward = 100 + Math.floor(Math.random() * 101);
    user.coins += reward;
    user.lastDaily = new Date(now).toISOString();
    await ctx.db.write();
    return ctx.reply(`Daily reward claimed: +${reward} coins. Balance: ${user.coins}.`);
  },
};
