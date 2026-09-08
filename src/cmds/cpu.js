'use strict';
module.exports={name:'cpu',category:'system',description:'Show host CPU information.',usage:'/cpu',role:0,cooldown:4,async execute(ctx){const os=require('os');return ctx.reply(ctx.format('CPU',[`Cores: ${os.cpus().length}`,`Load: ${os.loadavg().map(v=>v.toFixed(2)).join(' / ')}`]));}};
