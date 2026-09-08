'use strict';
module.exports={name:'repeat',aliases:['sayagain'],category:'fun',description:'Repeat text safely up to 500 characters.',usage:'/repeat <text>',role:0,cooldown:2,async execute(ctx){const text=ctx.args.join(' ').slice(0,500);if(!text)return ctx.reply(ctx.error('Provide text to repeat.'));return ctx.reply(text);}};
