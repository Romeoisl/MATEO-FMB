'use strict';
const items=['What is one goal you really want to achieve?','What is a skill you wish you had?','What was your funniest recent mistake?','What is something you are proud of?','What would you learn instantly if you could?'];
module.exports={name:'truth',category:'fun',description:'Get a clean truth question.',usage:'/truth',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Truth',[items[Math.floor(Math.random()*items.length)]]));}};
