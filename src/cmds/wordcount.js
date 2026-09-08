'use strict';
module.exports={name:'wordcount',aliases:['words'],category:'utility',description:'Count words in text.',usage:'/wordcount <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ').trim();return ctx.reply(ctx.format('Word count',[String(t?t.split(/\s+/).length:0)]));}};
