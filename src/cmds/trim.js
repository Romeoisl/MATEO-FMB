'use strict';
module.exports={name:'trim',category:'utility',description:'Remove extra whitespace from text.',usage:'/trim <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');return ctx.reply(t?t.replace(/\s+/g,' ').trim():ctx.error('Provide text.'));}};
