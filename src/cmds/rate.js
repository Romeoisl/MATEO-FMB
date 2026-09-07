'use strict';
module.exports={name:'rate',aliases:['rating'],category:'fun',description:'Rate something from 0 to 100.',usage:'/rate <thing>',cooldown:1,role:0,async execute(ctx){if(!ctx.args.length)return ctx.reply(ctx.error(`Usage: ${ctx.prefix}rate <thing>`));const score=Math.floor(Math.random()*101);return ctx.reply(ctx.format('Rating',[`${ctx.args.join(' ')}: ${score}/100`]));}};
