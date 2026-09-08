'use strict';
module.exports={name:'mode',category:'system',description:'Show the active performance mode.',usage:'/mode',role:0,cooldown:3,async execute(ctx){const p=ctx.services.performance?.snapshot();return ctx.reply(ctx.format('Mode',[String(p?.mode||'unknown').toUpperCase()]));}};
