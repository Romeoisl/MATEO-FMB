'use strict';
module.exports={name:'profile2',aliases:['card'],category:'users',description:'Show a compact profile card.',usage:'/profile2',role:0,cooldown:3,async execute(ctx){const u=ctx.user||{};return ctx.reply(ctx.format('Profile',[`User: ${u.name||ctx.userID}`,`Level: ${u.level||1}`,`XP: ${u.xp||0}`,`Coins: ${u.coins||0}`,`Messages: ${u.messages||0}`]));}};
