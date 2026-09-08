'use strict';
const e=['😀','😎','🚀','🔥','✨','🎯','🤖','🧠','💫','🌟','🎉','🫡'];
module.exports={name:'emoji',category:'fun',description:'Send a random emoji.',usage:'/emoji',role:0,cooldown:2,async execute(ctx){return ctx.reply(e[Math.floor(Math.random()*e.length)]);}};
