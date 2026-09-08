'use strict';
module.exports={name:'now',category:'utility',description:'Show the current ISO time.',usage:'/now',role:0,cooldown:2,async execute(ctx){return ctx.reply(new Date().toISOString());}};
