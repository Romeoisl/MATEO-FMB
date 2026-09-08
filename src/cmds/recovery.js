'use strict';
module.exports={name:'recovery',category:'system',description:'Show runtime recovery telemetry.',usage:'/recovery',role:2,cooldown:4,async execute(ctx){const r=ctx.services.recovery?.snapshot();return ctx.reply(ctx.format('Recovery',[`Failures: ${r?.failures||0}`,`Last failure: ${r?.lastFailureAt||'none'}`,`Last recovery: ${r?.lastRecoveryAt||'none'}`]));}};
