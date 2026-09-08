'use strict';
module.exports={name:'id',aliases:['userid'],category:'users',description:'Show a user ID.',usage:'/id [userID]',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('User ID',[String(ctx.args[0]||ctx.userID)]));}};
