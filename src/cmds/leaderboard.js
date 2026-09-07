'use strict';

module.exports = {
  name: 'leaderboard', aliases: ['lb', 'top'], category: 'users',
  description: 'Show the FMB activity leaderboard.', usage: '/leaderboard', role: 0, cooldown: 5,
  async execute(ctx) {
    const rows = ctx.fmb.leaderboard(10);
    if (!rows.length) return ctx.reply('FMB leaderboard is empty. Start chatting to earn activity XP.');
    const lines = rows.map((user, i) => `${i + 1}. ${user.name} — ${user.fmb?.xp || 0} XP — ${ctx.fmb.rankFor(user.fmb?.xp || 0, user.fmb?.rank).label}`);
    return ctx.reply(['╭─ FMB LEADERBOARD ─╮', ...lines, `╰─ ${ctx.fmb.identity.signature} ─╯`].join('\n'));
  },
};
