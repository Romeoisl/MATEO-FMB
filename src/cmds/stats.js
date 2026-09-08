'use strict';
module.exports={name:'stats',aliases:['statistics'],category:'system',description:'Show runtime counters.',usage:'/stats',role:0,cooldown:4,async execute(ctx){const s=ctx.db.data?.statistics||{};return ctx.reply(ctx.format('Statistics',[`Messages: ${s.messages||0}`,`Commands: ${s.commands||0}`,`Errors: ${s.errors||0}`,`Moderation actions: ${s.moderationActions||0}`]));}};
