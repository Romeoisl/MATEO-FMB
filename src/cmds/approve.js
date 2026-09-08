'use strict';

const changeNickname = (api, nickname, threadID, userID) => {
  if (typeof api?.changeNickname !== 'function') return Promise.resolve(false);
  return new Promise(resolve => {
    let settled = false;
    const done = error => {
      if (settled) return;
      settled = true;
      resolve(!error);
    };

    try {
      api.changeNickname(nickname, threadID, userID, done);
    } catch (_) {
      done(new Error('Nickname update failed.'));
    }
  });
};

module.exports = {
  name: 'approve',
  aliases: ['approvegroup'],
  category: 'admin',
  description: 'Approve a group and activate MATEO-FMB there.',
  usage: '/approve <threadID> or /approve inside the pending group',
  role: 2,
  cooldown: 3,

  async execute(ctx) {
    const targetID = String(ctx.args[0] || ctx.threadID || '').trim();
    if (!targetID) return ctx.reply(ctx.error(`Usage: ${ctx.prefix}approve <threadID>`));

    const group = await ctx.groups.ensure(targetID);
    if (group.approved === true) {
      return ctx.reply(ctx.format('Approval', [
        'This group is already approved.',
        `Thread ID: ${targetID}`,
      ]));
    }

    await ctx.groups.approve(targetID, ctx.userID);

    const botName = ctx.config.get('botName', 'MATEO-FMB');
    const api = ctx.api;
    const botID = String(api.getCurrentUserID?.() || '');
    const nicknameUpdated = await changeNickname(api, botName, targetID, botID);

    const introduction = [
      `╭─ ${botName}`,
      '│ CONNECTION ESTABLISHED',
      '│',
      '│ Thank you for approving me.',
      '│ I am now active in this group.',
      '│',
      `│ Prefix: ${ctx.groups.get(targetID)?.prefix || ctx.config.get('prefix', '/')}`,
      `│ Name: ${botName}`,
      `│ Nickname: ${nicknameUpdated ? 'Updated' : 'Unavailable'}`,
      '│',
      `│ Use ${ctx.config.get('prefix', '/')}help to explore my commands.`,
      '╰─ MATEO-FMB ─╯',
    ].join('\n');

    await api.sendMessage(introduction, targetID);

    return ctx.reply(ctx.format('Group Approved', [
      `Thread ID: ${targetID}`,
      'Status: Approved and active',
      `Bot name: ${botName}`,
      `Nickname: ${nicknameUpdated ? 'Updated successfully' : 'Could not update'}`,
      '',
      'The group can now use MATEO-FMB commands.',
    ], { includeTagline: true }));
  },
};
