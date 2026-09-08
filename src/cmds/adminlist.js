'use strict';
module.exports={name:'adminlist',aliases:['botadmins'],category:'system',description:'List configured bot admin IDs.',usage:'/adminlist',role:1,cooldown:3,async execute(ctx){const ids=ctx.config.get('adminIDs',[]);return ctx.reply(ctx.format('Bot admins',ids.length?ids.map(String):['No bot admins configured.']));}};
