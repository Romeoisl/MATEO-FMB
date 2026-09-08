'use strict';
module.exports={name:'changelog',category:'system',description:'Show the current framework release direction.',usage:'/changelog',role:0,cooldown:4,async execute(ctx){return ctx.reply(ctx.format('MATEO-FMB',[`Version: ${ctx.config.get('version','unknown')}`,'Modular runtime','Resource governor','Safety and recovery','Command registry']));}};
