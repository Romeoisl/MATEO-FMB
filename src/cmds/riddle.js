'use strict';
const a=['What has keys but cannot open locks? — A keyboard.','What has a face and two hands but no arms? — A clock.','What gets wetter as it dries? — A towel.'];
module.exports={name:'riddle',category:'fun',description:'Get a simple riddle.',usage:'/riddle',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Riddle',[a[Math.floor(Math.random()*a.length)]]));}};
