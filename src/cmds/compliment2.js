'use strict';
module.exports={name:'compliment2',category:'fun',description:'Generate another positive message.',usage:'/compliment2',role:0,cooldown:3,async execute(ctx){const a=['You are making progress.','Your effort matters.','Your ideas have value.','You handled that better than you think.'];return ctx.reply(a[Math.floor(Math.random()*a.length)]);}};
