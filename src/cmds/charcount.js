'use strict';
module.exports={name:'charcount',aliases:['chars'],category:'utility',description:'Count characters in text.',usage:'/charcount <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');return ctx.reply(ctx.format('Character count',[String(t.length)]));}};
