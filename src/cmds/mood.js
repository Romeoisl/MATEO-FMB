'use strict';
const moods=['calm','focused','happy','curious','energetic','sleepy','motivated'];
module.exports={name:'mood',category:'fun',description:'Get a random mood prompt.',usage:'/mood',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Mood',[moods[Math.floor(Math.random()*moods.length)]]));}};
