'use strict';
const quotes=['Keep moving forward.','Small steps become big results.','Build it, test it, improve it.','Consistency beats intensity.','Make the next move count.'];
module.exports={name:'quote',category:'fun',description:'Show a random quote.',usage:'/quote',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Quote',[quotes[Math.floor(Math.random()*quotes.length)]]));}};
