const Permissions = require('../core/Permissions');

module.exports = {
  name: 'eval',
  description: 'Execute JavaScript code (Owner only)',
  category: 'admin',
  permission: Permissions.LEVELS.OWNER,
  aliases: ['execute'],

  async execute(ctx) {
    if (ctx.userLevel < Permissions.LEVELS.OWNER) {
      ctx.reply('❌ This command is for owner only.');
      return;
    }

    try {
      const result = eval(ctx.text);
      ctx.reply(`✅ Result:\n\`\`\`${result}\`\`\``);
    } catch (err) {
      ctx.reply(`❌ Error:\n\`\`\`${err.message}\`\`\``);
    }
  },
};