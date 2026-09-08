'use strict';
module.exports={name:'length',aliases:['strlen'],category:'utility',description:'Count characters and words in text.',usage:'/length <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');if(!t)return ctx.reply(ctx.error('Provide text.'));return ctx.reply(ctx.format('Text length',[`Characters: ${t.length}`,`Words: ${t.trim().split(/\s+/).length}`]));}};
