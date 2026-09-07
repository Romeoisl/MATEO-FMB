'use strict';
module.exports={name:'reverse',aliases:['rev'],category:'utility',description:'Reverse text.',usage:'/reverse <text>',role:0,async execute(ctx){if(!ctx.args.length)return ctx.reply(ctx.error(`Usage: ${ctx.prefix}reverse <text>`));return ctx.reply(ctx.format('Reverse',[ctx.args.join(' ').split('').reverse().join('')]));}};
