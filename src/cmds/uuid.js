'use strict';
module.exports={name:'uuid',category:'utility',description:'Generate a UUID.',usage:'/uuid',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('UUID',[require('crypto').randomUUID()]));}};
