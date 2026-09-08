'use strict';
module.exports={name:'hostname',category:'system',description:'Show the runtime host name.',usage:'/hostname',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Host',[require('os').hostname()]));}};
