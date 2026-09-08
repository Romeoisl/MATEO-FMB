'use strict';
module.exports={name:'envinfo',category:'system',description:'Show safe runtime environment fields.',usage:'/envinfo',role:2,cooldown:5,async execute(ctx){return ctx.reply(ctx.format('Environment',[`Node: ${process.version}`,`PID: ${process.pid}`,`Platform: ${process.platform}`,`Arch: ${process.arch}`]));}};
