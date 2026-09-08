'use strict';
module.exports={name:'bio',category:'users',description:'Set or view your local bio.',usage:'/bio [text]',role:0,cooldown:4,async execute(ctx){if(ctx.args.length){ctx.user.bio=ctx.args.join(' ').slice(0,160);await ctx.db.write();}return ctx.reply(ctx.format('Bio',[ctx.user.bio||'No bio set.']));}};
