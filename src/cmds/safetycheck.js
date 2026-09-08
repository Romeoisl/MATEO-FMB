'use strict';
module.exports={name:'safetycheck',category:'system',description:'Show a concise connection safety state.',usage:'/safetycheck',role:0,cooldown:4,async execute(ctx){const s=ctx.services.safety?.status();return ctx.reply(ctx.format('Safety check',[`Status: ${s?.status||'unknown'}`,`Incidents: ${s?.incidents?.length||0}`]));}};
