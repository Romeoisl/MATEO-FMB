'use strict';
module.exports={name:'number',category:'fun',description:'Generate a random number from 1 to 100.',usage:'/number',role:0,cooldown:2,async execute(ctx){return ctx.reply(String(1+Math.floor(Math.random()*100)));}};
