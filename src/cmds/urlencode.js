'use strict';
module.exports={name:'urlencode',category:'utility',description:'URL-encode text.',usage:'/urlencode <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');if(!t)return ctx.reply(ctx.error('Provide text.'));return ctx.reply(encodeURIComponent(t));}};
