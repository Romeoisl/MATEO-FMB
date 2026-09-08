'use strict';
module.exports={name:'hash',category:'utility',description:'Create a SHA-256 hash of text.',usage:'/hash <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');if(!t)return ctx.reply(ctx.error('Provide text.'));return ctx.reply(require('crypto').createHash('sha256').update(t).digest('hex'));}};
