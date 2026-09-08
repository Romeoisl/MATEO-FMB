'use strict';
const a=['A useful opportunity is closer than it looks.','A small decision today will simplify tomorrow.','Your next good idea may come from a simple question.','Patience and consistency will pay off.'];
module.exports={name:'fortune',category:'fun',description:'Get a light fortune message.',usage:'/fortune',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Fortune',[a[Math.floor(Math.random()*a.length)]]));}};
