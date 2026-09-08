'use strict';
module.exports={name:'urldecode',category:'utility',description:'Decode URL-encoded text.',usage:'/urldecode <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');if(!t)return ctx.reply(ctx.error('Provide encoded text.'));try{return ctx.reply(decodeURIComponent(t));}catch(e){return ctx.reply(ctx.error('Invalid encoded text.'));}}};
