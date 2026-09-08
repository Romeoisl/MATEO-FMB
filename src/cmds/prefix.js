'use strict';
module.exports={name:'prefix',aliases:['prefixinfo'],category:'system',description:'Show the active command prefix.',usage:'/prefix',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Prefix',[ctx.prefix]));}};
