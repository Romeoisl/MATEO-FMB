'use strict';

module.exports = {
  name: 'help',
  aliases: ['commands'],
  category: 'system',
  description: 'Display available commands or details for one command.',
  usage: '/help [command]',
  role: 0,
  async execute(ctx) {
    const requested = ctx.args[0]?.toLowerCase();
    if (requested) {
      const command = ctx.registry.get(requested);
      if (!command) return ctx.reply(ctx.formatter?.error(`Unknown command: ${requested}`) || `Unknown command: ${requested}`);
      return ctx.reply(ctx.formatter?.command(command) || `${command.name}\n\n${command.description || 'No description provided.'}`);
    }

    const visible = ctx.registry.list()
      .filter(command => ctx.permissions.hasLevel(ctx.userID, ctx.threadID, Number(command.role || 0)))
      .sort((a, b) => (a.category || 'general').localeCompare(b.category || 'general') || a.name.localeCompare(b.name));

    const categories = new Map();
    for (const command of visible) {
      const category = command.category || 'general';
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category).push(command.name);
    }

    const lines = ['Command Center', `${visible.length} commands available`];
    for (const [category, names] of categories) {
      lines.push('', `[ ${category.toUpperCase()} ]`, names.map(name => `${ctx.prefix}${name}`).join('  '));
    }
    lines.push('', `Use ${ctx.prefix}help <command> for details.`);
    return ctx.reply(ctx.formatter?.box('Help', lines) || lines.join('\n'));
  },
};
