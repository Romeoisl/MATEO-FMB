'use strict';
module.exports={name:'healthz',category:'system',description:'Return a simple health result.',usage:'/healthz',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Healthz',['OK','Runtime responding normally.']));}};
