'use strict';
const items=['That comeback needs a software update.','Even the loading screen has more momentum.','I would roast you, but the logs say you already crashed.','Your Wi-Fi has stronger arguments than that.','That was brave. Not correct, but brave.'];
module.exports={name:'roast',category:'fun',description:'Get a playful, non-abusive roast.',usage:'/roast',role:0,cooldown:4,async execute(ctx){return ctx.reply(ctx.format('Roast',[items[Math.floor(Math.random()*items.length)]]));}};
