'use strict';

module.exports = {
  name: 'help', aliases: ['commands'], category: 'system',
  description: 'Display available MATEO-FMB commands or details for one command.', usage: '/help [command]', role: 0,
  async execute(ctx) {
    const requested = ctx.args[0]?.toLowerCase();
    const brand = ctx.fmb?.identity;
    if (requested) {
      const command = ctx.registry.get(requested);
      if (!command) return ctx.reply(`Unknown command: ${requested}`);
      const aliases = command.aliases?.length ? `\nAliases: ${command.aliases.join(', ')}` : '';
      const usage = command.usage ? `\nUsage: ${command.usage}` : '';
      return ctx.reply(`${command.name}\n\n${command.description || 'No description provided.'}${usage}${aliases}\n\n${brand?.signature || 'MATEO-FMB'}`);
    }
    const visible = ctx.registry.list().filter(c => ctx.permissions.hasLevel(ctx.userID, ctx.threadID, Number(c.role || 0))).sort((a,b) => (a.category||'general').localeCompare(b.category||'general') || a.name.localeCompare(b.name));
    const categories = new Map();
    for (const command of visible) { const category=command.category||'general'; if(!categories.has(category))categories.set(category,[]); categories.get(category).push(command.name); }
    const lines=[`╭─ ${brand?.name || 'FMB'} ─╮`, `│ ${brand?.tagline || 'MATEO-FMB'}`, `│ ${ctx.config.get('botName','MATEO-FMB')} • ${visible.length} commands`, '├────────────'];
    for (const [category,names] of categories) { lines.push(`${category.toUpperCase()}`); lines.push(names.map(name=>`${ctx.prefix}${name}`).join(' • ')); lines.push(''); }
    lines.push(`Use ${ctx.prefix}help <command> for details.`, `╰─ ${brand?.footer || 'MATEO-FMB'} ─╯`);
    return ctx.reply(lines.join('\n'));
  },
};
