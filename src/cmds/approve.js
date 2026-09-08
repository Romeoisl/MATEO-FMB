'use strict';

const changeNickname = (api, nickname, threadID, userID) => {
  if (typeof api?.changeNickname !== 'function' || !userID) return Promise.resolve(false);
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

const send = async (api, text, threadID) => {
  if (!api?.sendMessage || !threadID || !text) return false;
  try {
    await api.sendMessage(text, threadID);
    return true;
  } catch (_) {
    return false;
  }
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
        'This group is already approved and active.',
        `Thread ID: ${targetID}`,
      ], { includeTagline: true }));
    }

    await ctx.groups.approve(targetID, ctx.userID);

    const botName = String(ctx.config.get('botName', 'MATEO-FMB') || 'MATEO-FMB');
    const defaultPrefix = String(ctx.config.get('prefix', '/') || '/');
    const targetGroup = ctx.groups.get(targetID);
    const prefix = targetGroup?.prefix || defaultPrefix;
    const api = ctx.api;
    const botID = String(api.getCurrentUserID?.() || '');
    const nicknameUpdated = await changeNickname(api, botName, targetID, botID);

    const introduction = [
      `╭─ ${botName}`,
      '│ GROUP ACTIVATED',
      '│',
      '│ Approval confirmed. Thank you for having me here.',
      '│',
      `│ Name      : ${botName}`,
      `│ Prefix    : ${prefix}`,
      '│ Status    : Online & ready',
      '│',
      `│ Use ${prefix}help to explore my commands.`,
      '│ Use the group settings command to customize me.',
      '│',
      '╰─ MATEO-FMB • READY ─╯',
    ].join('\n');

    const introductionSent = await send(api, introduction, targetID);

    const result = [
      `Thread ID: ${targetID}`,
      'Status: Approved & active',
      `Bot name: ${botName}`,
      `Nickname: ${nicknameUpdated ? 'Updated successfully' : 'Unavailable'}`,
      `Introduction: ${introductionSent ? 'Sent' : 'Could not send'}`,
      '',
      'This group is now unlocked for MATEO-FMB commands.',
    ];

    return ctx.reply(ctx.format('Group Approved', result, { includeTagline: true }));
  },
};
