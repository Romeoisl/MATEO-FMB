'use strict';

module.exports = {
  name: 'commands',
  aliases: ['cmds'],
  category: 'system',
  description: 'List commands by category.',
  usage: '/commands [category]',
  role: 0,

  async execute(ctx) {
    const wanted = ctx.args[0]?.toLowerCase();
    const list = ctx.registry.list()
      .filter(command => !wanted || command.category === wanted)
      .sort((a, b) => a.name.localeCompare(b.name));

    if (!list.length) return ctx.reply(ctx.error(`No commands found for category: ${wanted}`));

    const grouped = new Map();
    for (const command of list) {
      if (!grouped.has(command.category)) grouped.set(command.category, []);
      grouped.get(command.category).push(command);
    }

    const lines = [];
    for (const [category, items] of grouped) {
      lines.push(`[ ${category.toUpperCase()} ]`);
      for (const command of items) lines.push(`${ctx.prefix}${command.name}`);
    }

    return ctx.reply(ctx.format('Commands', lines, { includeTagline: true }));
  },
};
