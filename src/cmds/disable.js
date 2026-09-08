'use strict';
module.exports={name:'disable',category:'group',description:'Disable MATEO-FMB commands in this group.',usage:'/disable',role:1,cooldown:3,async execute(ctx){await ctx.groups.set(ctx.threadID,'enabled',false);return ctx.reply(ctx.format('Group',['MATEO-FMB is disabled here.']));}};
