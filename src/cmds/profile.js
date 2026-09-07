'use strict';

module.exports = {
  name: 'profile', aliases: ['me', 'fmbprofile', 'rank'], category: 'users',
  description: 'View an FMB-styled member profile.', usage: '/profile [userID]', role: 0, cooldown: 3,
  async execute(ctx) {
    const id = ctx.args[0] || ctx.userID;
    const p = await ctx.fmb.profile(id);
    if (!p) return ctx.reply('FMB member profile not found.');
    const badges = (p.user.fmb.badges || []).map(b => ctx.fmb.badges()[b] || b).join(', ') || 'None';
    return ctx.reply([
      '╭─ FMB PROFILE ─╮', `│ Name: ${p.user.name}`, `│ ID: ${p.user.userID}`,
      `│ Rank: ${p.rank.label}`, `│ Status: ${p.user.fmb.status}`,
      `│ Verified: ${p.user.fmb.verified ? 'Yes' : 'No'}`, `│ XP: ${p.user.fmb.xp || 0}`,
      `│ Badges: ${badges}`, `╰─ ${ctx.fmb.identity.signature} ─╯`,
    ].join('\n'));
  },
};
