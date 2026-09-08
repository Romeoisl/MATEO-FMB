'use strict';
module.exports={name:'binary',category:'utility',description:'Convert text to UTF-8 binary.',usage:'/binary <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');if(!t)return ctx.reply(ctx.error('Provide text.'));return ctx.reply(t.split('').map(c=>c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '));}};
