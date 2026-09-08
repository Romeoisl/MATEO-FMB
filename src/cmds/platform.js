'use strict';
module.exports={name:'platform',aliases:['os'],category:'system',description:'Show runtime platform information.',usage:'/platform',role:0,cooldown:3,async execute(ctx){const os=require('os');return ctx.reply(ctx.format('Platform',[`OS: ${os.platform()}`,`Arch: ${os.arch()}`,`Node: ${process.version}`]));}};
