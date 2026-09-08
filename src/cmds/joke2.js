'use strict';
const a=['Why did the developer go broke? Too many cache misses.','Why was the server calm? It had good cache control.','What does a bot drink? JavaScript.'];
module.exports={name:'joke2',category:'fun',description:'Tell a clean tech joke.',usage:'/joke2',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Joke',[a[Math.floor(Math.random()*a.length)]]));}};
