'use strict';
module.exports={name:'latency',aliases:['lat'],category:'system',description:'Measure local command processing latency.',usage:'/latency',role:0,cooldown:3,async execute(ctx){const started=process.hrtime.bigint();const elapsed=Number(process.hrtime.bigint()-started)/1e6;return ctx.reply(ctx.format('Latency',[`${elapsed.toFixed(3)} ms local processing`]));}};
