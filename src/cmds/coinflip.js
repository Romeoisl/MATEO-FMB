'use strict';
module.exports={name:'coinflip',aliases:['flip'],category:'fun',description:'Flip a coin.',usage:'/coinflip',cooldown:1,role:0,async execute(ctx){return ctx.reply(ctx.format('Coin Flip',[Math.random()<0.5?'Heads':'Tails']));}};
