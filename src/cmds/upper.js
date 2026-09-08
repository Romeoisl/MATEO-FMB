'use strict';
module.exports={name:'upper',aliases:['uppercase'],category:'utility',description:'Convert text to uppercase.',usage:'/upper <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');return ctx.reply(t? t.toUpperCase():ctx.error('Provide text.'));}};
