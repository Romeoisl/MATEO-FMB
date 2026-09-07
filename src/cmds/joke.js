'use strict';
const jokes=['Why do programmers prefer dark mode? Because light attracts bugs.','I told my computer I needed a break. Now it will not stop sending me vacation ads.','Why was the JavaScript developer sad? Because they did not know how to null their feelings.'];
module.exports={name:'joke',aliases:['jokes'],category:'fun',description:'Tell a clean random joke.',usage:'/joke',cooldown:2,role:0,async execute(ctx){return ctx.reply(ctx.format('Joke',[jokes[Math.floor(Math.random()*jokes.length)]]));}};
