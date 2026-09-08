'use strict';
module.exports={name:'version',aliases:['ver'],category:'system',description:'Show the bot version.',usage:'/version',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Version',[ctx.config.get('botName','MATEO-FMB'),ctx.config.get('version','unknown')]));}};
