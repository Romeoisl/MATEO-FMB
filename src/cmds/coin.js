'use strict';
module.exports={name:'coin',aliases:['flip'],category:'fun',description:'Flip a coin.',usage:'/coin',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Coin flip',[Math.random()<0.5?'Heads':'Tails']));}};
