'use strict';

const BOOLEAN_KEYS = new Set(['enabled', 'welcome', 'goodbye', 'antiSpam', 'antiLink']);
const ALLOWED = new Set(['enabled', 'prefix', 'welcome', 'goodbye', 'antiSpam', 'antiLink', 'antiSpamLimit', 'antiSpamWindowMs', 'language']);

module.exports = {
  name: 'group', aliases: ['settings', 'groupinfo'], category: 'group',
  description: 'View and manage this group configuration.', usage: '/group [settings|set <key> <value>]', role: 1, cooldown: 3,
  async execute(ctx) {
    const action = (ctx.args[0] || 'settings').toLowerCase();
    const group = ctx.groups?.get(ctx.threadID) || ctx.group;
    if (action === 'settings' || action === 'info') {
      if (!group) return ctx.reply('Group configuration is unavailable.');
      return ctx.reply(['MATEO-FMB GROUP SETTINGS', `Thread: ${ctx.threadID}`, `Enabled: ${group.enabled}`, `Prefix: ${group.prefix || ctx.config.get('prefix', '/')}`, `Welcome: ${group.welcome}`, `Goodbye: ${group.goodbye}`, `Anti-spam: ${group.antiSpam}`, `Anti-spam limit: ${group.antiSpamLimit}`, `Anti-spam window: ${Math.round(group.antiSpamWindowMs / 1000)}s`, `Anti-link: ${group.antiLink}`, `Language: ${group.language}`, `Admins: ${(group.adminIDs || []).length}`].join('\n'));
    }
    if (action !== 'set' || !ctx.args[1]) return ctx.reply(`Usage: ${ctx.prefix}group set <setting> <value>`);
    const key = ctx.args[1]; if (!ALLOWED.has(key)) return ctx.reply(`Unknown setting. Allowed: ${[...ALLOWED].join(', ')}`);
    let value = ctx.args.slice(2).join(' ');
    if (BOOLEAN_KEYS.has(key)) { if (!['true', 'false', 'on', 'off'].includes(value.toLowerCase())) return ctx.reply('Use true/false or on/off for this setting.'); value = ['true', 'on'].includes(value.toLowerCase()); }
    if (key === 'prefix' && (value.length < 1 || value.length > 3)) return ctx.reply('Prefix must be 1–3 characters.');
    if (key === 'language' && !/^[a-z]{2,8}$/i.test(value)) return ctx.reply('Use a valid language code.');
    if (['antiSpamLimit', 'antiSpamWindowMs'].includes(key)) { value = Number(value); if (!Number.isInteger(value) || value <= 0) return ctx.reply('Use a positive whole number.'); }
    await ctx.groups.set(ctx.threadID, key, value);
    return ctx.reply(`Group setting ${key} updated.`);
  },
};
