'use strict';
module.exports={name:'groupid',aliases:['threadid'],category:'group',description:'Show the current thread ID.',usage:'/groupid',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Group ID',[String(ctx.threadID)]));}};
