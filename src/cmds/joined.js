'use strict';
module.exports={name:'joined',category:'users',description:'Show when your profile was first seen.',usage:'/joined',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Member since',[ctx.user?.firstSeen||'Not recorded']));}};
