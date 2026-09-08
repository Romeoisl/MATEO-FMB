'use strict';
module.exports={name:'average',aliases:['avg'],category:'utility',description:'Calculate the average of numbers.',usage:'/average 10 20 30',role:0,cooldown:2,async execute(ctx){const a=ctx.args.map(Number).filter(Number.isFinite);if(!a.length)return ctx.reply(ctx.error('Provide numbers.'));return ctx.reply(ctx.format('Average',[String(a.reduce((x,y)=>x+y,0)/a.length)]));}};
