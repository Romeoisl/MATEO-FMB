'use strict';
module.exports={name:'memory',aliases:['ram'],category:'system',description:'Show process memory usage.',usage:'/memory',role:0,cooldown:4,async execute(ctx){const m=process.memoryUsage();const mb=n=>`${(n/1024/1024).toFixed(1)} MB`;return ctx.reply(ctx.format('Memory',[`RSS: ${mb(m.rss)}`,`Heap: ${mb(m.heapUsed)} / ${mb(m.heapTotal)}`,`External: ${mb(m.external)}`]));}};
