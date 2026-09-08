'use strict';
module.exports={name:'ping2',aliases:['pong'],category:'system',description:'Return a detailed runtime ping.',usage:'/ping2',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Ping',['Pong.','Process uptime: '+Math.floor(process.uptime())+'s']));}};
