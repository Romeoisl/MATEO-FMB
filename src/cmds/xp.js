'use strict';
module.exports={name:'xp',aliases:['level'],category:'users',description:'Show your level and XP.',usage:'/xp',role:0,cooldown:2,async execute(ctx){const u=ctx.user||{};return ctx.reply(ctx.format('Experience',[`Level: ${u.level||1}`,`XP: ${u.xp||0}`]));}};
