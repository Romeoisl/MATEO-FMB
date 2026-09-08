'use strict';
module.exports={name:'slug',category:'utility',description:'Create a simple URL-friendly slug.',usage:'/slug <text>',role:0,cooldown:2,async execute(ctx){const t=ctx.args.join(' ');if(!t)return ctx.reply(ctx.error('Provide text.'));return ctx.reply(t.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));}};
