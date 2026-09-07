'use strict';
module.exports={name:'echo',aliases:['say'],category:'utility',description:'Echo text back through MATEO-FMB.',usage:'/echo <text>',role:0,async execute(ctx){if(!ctx.args.length)return ctx.reply(ctx.error(`Usage: ${ctx.prefix}echo <text>`));return ctx.reply(ctx.format('Echo',[ctx.args.join(' ')]));}};
