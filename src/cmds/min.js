'use strict';
module.exports={name:'min',category:'utility',description:'Find the smallest supplied number.',usage:'/min 4 9 2',role:0,cooldown:2,async execute(ctx){const a=ctx.args.map(Number).filter(Number.isFinite);if(!a.length)return ctx.reply(ctx.error('Provide numbers.'));return ctx.reply(String(Math.min(...a)));}};
