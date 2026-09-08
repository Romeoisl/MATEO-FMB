'use strict';
const lines=['When it works first try: suspicious.','Me: one small change. Also me: refactors everything.','Production said: not today.','Debugging is just detective work with logs.'];
module.exports={name:'meme',category:'fun',description:'Generate a clean programming meme line.',usage:'/meme',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Meme',[lines[Math.floor(Math.random()*lines.length)]]));}};
