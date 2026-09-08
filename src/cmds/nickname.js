'use strict';
module.exports={name:'nickname',aliases:['nick'],category:'users',description:'Set your local profile nickname.',usage:'/nickname <name>',role:0,cooldown:5,async execute(ctx){const n=ctx.args.join(' ').trim().slice(0,50);if(!n)return ctx.reply(ctx.error('Provide a nickname.'));ctx.user.name=n;await ctx.db.write();return ctx.reply(ctx.format('Nickname',[`Saved as ${n}.`]));}};
