'use strict';
module.exports={name:'enable',category:'group',description:'Enable MATEO-FMB in this group.',usage:'/enable',role:1,cooldown:3,async execute(ctx){await ctx.groups.set(ctx.threadID,'enabled',true);return ctx.reply(ctx.format('Group',['MATEO-FMB is enabled here.']));}};
