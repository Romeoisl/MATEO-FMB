'use strict';

const os = require('os');

const MAIN = ['alive', 'ping', 'runtime', 'speed', 'owner', 'script', 'infobot'];
const GROUP = ['kick', 'add', 'promote', 'demote', 'group', 'tagall', 'hidetag', 'link', 'revoke', 'setppgc', 'ephemeral'];
const DOWNLOAD = ['play', 'ytmp3', 'ytmp4', 'tiktok', 'ig', 'fb', 'mediafire', 'git', 'gdrive', 'twitter', 'spotify'];
const AI_TOOLS = ['gpt4', 'dalle', 'gemini', 'ocr', 'translate', 'calculator', 'weather'];

function commandsFor(ctx, names) {
  return names.filter(name => {
    const command = ctx.registry.get(name);
    return command && ctx.permissions.hasLevel(ctx.userID, ctx.threadID, Number(command.role || 0));
  });
}

function chain(names) {
  if (!names.length) return ' └─ `none`';
  if (names.length <= 4) return ` ├─ ${names.map(name => `\`${name}\``).join(' • ')}`;
  const split = Math.ceil(names.length / 2);
  return ` ├─ ${names.slice(0, split).map(name => `\`${name}\``).join(' • ')}\n └─ ${names.slice(split).map(name => `\`${name}\``).join(' • ')}`;
}

function memoryLabel() {
  const used = process.memoryUsage().rss / 1024 / 1024;
  return `${used.toFixed(1)} MB`;
}

module.exports = {
  name: 'help',
  aliases: ['commands', 'menu'],
  category: 'system',
  description: 'Display the MATEO-FMB command menu.',
  usage: '/help [command]',
  role: 0,
  async execute(ctx) {
    const requested = ctx.args[0]?.toLowerCase();

    if (requested) {
      const command = ctx.registry.get(requested);
      if (!command) return ctx.reply(`Unknown command: ${requested}`);
      return ctx.reply(ctx.formatter.command(command));
    }

    const prefix = ctx.prefix;
    const mode = ctx.group ? (ctx.group.enabled === false ? 'Disabled' : 'Group') : 'Private';
    const name = ctx.user?.name || ctx.message?.senderName || 'User';

    const main = commandsFor(ctx, MAIN);
    const group = commandsFor(ctx, GROUP);
    const download = commandsFor(ctx, DOWNLOAD);
    const aiTools = commandsFor(ctx, AI_TOOLS);

    const output = [
      '⌬ ─────────────── ⌬',
      `  🔮 *${ctx.config.get('botName', 'Mateo-ChatBOT')} v${ctx.config.get('version', '1.0')}*`,
      '⌬ ─────────────── ⌬',
      `  • User: ${name}`,
      `  • Prefix: [ ${prefix} ]`,
      `  • Mode: ${mode}`,
      `  • Memory: ${memoryLabel()}`,
      '⌬ ─────────────── ⌬',
      '',
      '📂 *MAIN*',
      chain(main),
      '',
      '⚙️ *GROUP*',
      chain(group),
      '',
      '📥 *DOWNLOAD*',
      chain(download),
      '',
      '🤖 *AI & TOOLS*',
      chain(aiTools),
      '',
      '🌐 **bold > 👑 Powered by Mateo-FMB**',
    ].join('\n');

    return ctx.reply(output);
  },
};
