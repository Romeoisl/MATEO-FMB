'use strict';
module.exports={name:'cwd',category:'system',description:'Show the bot working directory.',usage:'/cwd',role:2,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Runtime directory',[process.cwd()]));}};
