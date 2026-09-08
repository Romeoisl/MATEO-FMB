'use strict';
module.exports={name:'activity',category:'users',description:'Show your stored activity counters.',usage:'/activity',role:0,cooldown:3,async execute(ctx){const u=ctx.user||{};return ctx.reply(ctx.format('Activity',[`Messages: ${u.messages||0}`,`Commands used: ${u.commandsUsed||0}`,`Warnings: ${u.warnings||0}`,`Last seen: ${u.lastSeen||'unknown'}`]));}};
