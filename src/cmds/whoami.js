'use strict';
module.exports={name:'whoami',aliases:['me'],category:'users',description:'Show your Messenger ID and local profile.',usage:'/whoami',role:0,cooldown:2,async execute(ctx){const u=ctx.user||{};return ctx.reply(ctx.format('Who am I?',[`Name: ${u.name||ctx.userID}`,`User ID: ${ctx.userID}`,`Level: ${u.level||1}`,`XP: ${u.xp||0}`,`Coins: ${u.coins||0}`]));}};
