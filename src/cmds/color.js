'use strict';
const a=['red','blue','green','purple','orange','teal','gold','silver'];
module.exports={name:'color',category:'fun',description:'Pick a random color.',usage:'/color',role:0,cooldown:2,async execute(ctx){return ctx.reply(ctx.format('Color',[a[Math.floor(Math.random()*a.length)]]));}};
