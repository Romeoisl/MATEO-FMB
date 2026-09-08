'use strict';
module.exports={name:'lower',aliases:['lowercase'],category:'utility',description:'Convert text to lowercase.',usage:'/lower <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');return ctx.reply(t?t.toLowerCase():ctx.error('Provide text.'));}};
