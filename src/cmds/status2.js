'use strict';
module.exports={name:'status2',aliases:['state'],category:'system',description:'Show concise bot state.',usage:'/status2',role:0,cooldown:3,async execute(ctx){const p=ctx.services.performance?.snapshot();return ctx.reply(ctx.format('State',[`Performance: ${p?.mode||'unknown'}`,`Pressure: ${p?.pressure?.level||'unknown'}`,`Commands: ${ctx.registry.list().length}`]));}};
