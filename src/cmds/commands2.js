'use strict';
module.exports={name:'commands2',aliases:['cmdcount'],category:'system',description:'Show the number of loaded commands.',usage:'/commands2',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Command registry',[`Loaded commands: ${ctx.registry.list().length}`]));}};
