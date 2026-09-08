'use strict';
module.exports={name:'time',category:'utility',description:'Show the current server time.',usage:'/time',cooldown:2,role:0,async execute(ctx){return ctx.reply(ctx.format('Time',[new Date().toString()]));}};
