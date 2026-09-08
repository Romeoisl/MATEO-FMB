'use strict';
module.exports={name:'bioreset',category:'users',description:'Clear your local bio.',usage:'/bioreset',role:0,cooldown:4,async execute(ctx){delete ctx.user.bio;await ctx.db.write();return ctx.reply(ctx.format('Bio',['Bio cleared.']));}};
