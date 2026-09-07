'use strict';

const ALLOWED = new Set(['enabled', 'prefix', 'welcome', 'goodbye', 'antiSpam', 'antiLink', 'language']);
module.exports = {
  name: 'group', aliases: ['settings', 'groupinfo'], category: 'group',
  description: 'View and manage this group configuration.', usage: '/group [settings|set <key> <value>]', role: 1, cooldown: 3,
  async execute(ctx) {
    const action = (ctx.args[0] || 'settings').toLowerCase();
    const current = ctx.db.getGroup(ctx.threadID);
    if (action === 'settings' || action === 'info') {
      if (!current) return ctx.reply('Group configuration is unavailable.');
      return ctx.reply(['MATEO-FMB GROUP SETTINGS', `Thread: ${ctx.threadID}`, `Enabled: ${current.enabled}`, `Prefix: ${current.prefix || ctx.prefix}`, `Welcome: ${current.welcome}`, `Goodbye: ${current.goodbye}`, `Anti-spam: ${current.antiSpam}`, `Anti-link: ${current.antiLink}`, `Language: ${current.language}`, `Admins: ${(current.adminIDs || []).length}`].join('\n'));
    }
    if (action !== 'set' || !ctx.args[1]) return ctx.reply(`Usage: ${ctx.prefix}group set <setting> <value>`);
    const key = ctx.args[1]; if (!ALLOWED.has(key)) return ctx.reply(`Unknown setting. Allowed: ${[...ALLOWED].join(', ')}`);
    let value = ctx.args.slice(2).join(' ');
    if (['enabled', 'welcome', 'goodbye', 'antiSpam', 'antiLink'].includes(key)) {
      if (!['true', 'false', 'on', 'off'].includes(value.toLowerCase())) return ctx.reply('Use true/false or on/off for this setting.');
      value = ['true', 'on'].includes(value.toLowerCase());
    }
    const target = current || { threadID: String(ctx.threadID), enabled: false, prefix: null, welcome: true, goodbye: true, antiSpam: false, antiLink: false, language: 'en', adminIDs: [] };
    if (!current) ctx.db.data.groups.push(target);
    target[key] = value; await ctx.db.write(); return ctx.reply(`Group setting ${key} updated.`);
  },
};
