'use strict';
module.exports={name:'date',category:'utility',description:'Show the current date.',usage:'/date',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Date',[new Date().toLocaleDateString()]));}};
