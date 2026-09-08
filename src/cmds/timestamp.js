'use strict';
module.exports={name:'timestamp',aliases:['ts'],category:'utility',description:'Show the current Unix timestamp.',usage:'/timestamp',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Timestamp',[String(Math.floor(Date.now()/1000))]));}};
