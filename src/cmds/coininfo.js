'use strict';
module.exports={name:'coininfo',category:'economy',description:'Show your economy balance and level.',usage:'/coininfo',role:0,cooldown:3,async execute(ctx){const u=ctx.user||{};return ctx.reply(ctx.format('Economy',[`Balance: ${u.coins||0} coins`,`Level: ${u.level||1}`,`XP: ${u.xp||0}`]));}};
