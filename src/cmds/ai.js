'use strict';

module.exports = {
  name: 'ai', aliases: ['ask', 'chat'], category: 'ai',
  description: 'Chat with the configured AI provider.', usage: '/ai <message>', role: 0, cooldown: 5,
  async execute(ctx) {
    const prompt=ctx.args.join(' ').trim(); if(!prompt)return ctx.reply(`Usage: ${ctx.prefix}ai <message>`);
    const history=ctx.db.data.history.filter(item=>String(item.threadID)===String(ctx.threadID)).slice(-8);
    const context=history.map(item=>`${item.role}: ${item.content}`).join('\n');
    if(!ctx.ai)return ctx.reply('AI service is unavailable.');
    try {
      const reply=await ctx.ai.generate({prompt,context});
      const now=new Date().toISOString(); ctx.db.data.history.push({threadID:String(ctx.threadID),userID:String(ctx.userID),role:'user',content:prompt,timestamp:now}); ctx.db.data.history.push({threadID:String(ctx.threadID),userID:'bot',role:'assistant',content:reply,timestamp:new Date().toISOString()});
      if(ctx.db.data.history.length>2000)ctx.db.data.history=ctx.db.data.history.slice(-2000); await ctx.db.write(); return ctx.reply(reply);
    } catch(error){ctx.logger.warn('AI request failed:',error.message);return ctx.reply('The AI service is currently unavailable.');}
  },
};
