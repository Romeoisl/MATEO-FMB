'use strict';

const BOOLEAN_KEYS = new Set(['enabled', 'welcome', 'goodbye', 'antiSpam', 'antiLink']);
const ALLOWED = new Set(['enabled', 'prefix', 'welcome', 'goodbye', 'antiSpam', 'antiLink', 'language']);

module.exports = {
  name: 'group', aliases: ['settings', 'groupinfo'], category: 'group',
  description: 'View and manage this group configuration.', usage: '/group [settings|set <key> <value>]', role: 1, cooldown: 3,
  async execute(ctx) {
    const action = (ctx.args[0] || 'settings').toLowerCase();
    if (action === 'settings' || action === 'info') {
      const group = ctx.groups?.get(ctx.threadID) || ctx.group;
      if (!group) return ctx.reply('Group configuration is unavailable.');
      return ctx.reply(['MATEO-FMB GROUP SETTINGS', `Thread: ${ctx.threadID}`, `Enabled: ${group.enabled}`, `Prefix: ${group.prefix || ctx.config.get('prefix', '/')}`, `Welcome: ${group.welcome}`, `Goodbye: ${group.goodbye}`, `Anti-spam: ${group.antiSpam}`, `Anti-link: ${group.antiLink}`, `Language: ${group.language}`, `Admins: ${(group.adminIDs || []).length}`].join('\n'));
    }
    if (action !== 'set' || !ctx.args[1]) return ctx.reply(`Usage: ${ctx.prefix}group set <setting> <value>`);
    const key = ctx.args[1];
    if (!ALLOWED.has(key)) return ctx.reply(`Unknown setting. Allowed: ${[...ALLOWED].join(', ')}`);
    let value = ctx.args.slice(2).join(' ');
    if (BOOLEAN_KEYS.has(key)) {
      if (!['true', 'false', 'on', 'off'].includes(value.toLowerCase())) return ctx.reply('Use true/false or on/off for this setting.');
      value = ['true', 'on'].includes(value.toLowerCase());
    }
    if (key === 'prefix' && value.length > 3) return ctx.reply('Prefix must be 1–3 characters.');
    if (key === 'language' && !/^[a-z]{2,8}$/i.test(value)) return ctx.reply('Use a valid language code.');
    if (ctx.groups?.set) await ctx.groups.set(ctx.threadID, key, value);
    else { const group = ctx.db.getGroup(ctx.threadID) || { threadID: String(ctx.threadID), enabled: false, prefix: null, welcome: true, goodbye: true, antiSpam: false, antiLink: false, language: 'en', adminIDs: [] }; if (!ctx.db.getGroup(ctx.threadID)) ctx.db.data.groups.push(group); group[key] = value; await ctx.db.write(); }
    return ctx.reply(`Group setting ${key} updated.`);
  },
};
