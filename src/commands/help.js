module.exports = {
  name: 'help',
  description: 'Display available commands',
  category: 'utility',
  aliases: ['?', 'commands'],

  async execute(ctx) {
    const categories = ctx.registry.getAllByCategory();
    let helpText = '📚 **Available Commands:**\n\n';

    for (const [category, commands] of Object.entries(categories)) {
      helpText += `**${category.toUpperCase()}**\n`;
      for (const cmd of commands) {
        helpText += `  • **${cmd.name}** - ${cmd.description || 'No description'}\n`;
      }
      helpText += '\n';
    }

    ctx.reply(helpText);
  },
};