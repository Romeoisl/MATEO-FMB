'use strict';
module.exports={name:'titlecase',aliases:['title'],category:'utility',description:'Convert text to title case.',usage:'/titlecase <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');return ctx.reply(t?t.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()):ctx.error('Provide text.'));}};
