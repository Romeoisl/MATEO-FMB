'use strict';
const facts=['Octopuses have three hearts.','Bananas are berries botanically.','A day on Venus is longer than its year.','Honey can remain edible for a very long time when stored properly.'];
module.exports={name:'fact',aliases:['facts'],category:'fun',description:'Show a random general-interest fact.',usage:'/fact',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Fact',[facts[Math.floor(Math.random()*facts.length)]]));}};
