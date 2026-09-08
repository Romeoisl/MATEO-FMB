'use strict';
module.exports={name:'connected',aliases:['online'],category:'system',description:'Show Messenger connection state.',usage:'/connected',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Connection',[ctx.services.safety?'Safety monitor active':'Safety monitor unavailable']));}};
