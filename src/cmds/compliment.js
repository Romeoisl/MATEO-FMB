'use strict';
const items=['You bring good energy.','Your creativity stands out.','You make progress by showing up.','You have a great sense of humor.','You deserve credit for how far you have come.'];
module.exports={name:'compliment',aliases:['complimentme'],category:'fun',description:'Receive a positive compliment.',usage:'/compliment',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Compliment',[items[Math.floor(Math.random()*items.length)]]));}};
