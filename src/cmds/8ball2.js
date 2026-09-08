'use strict';
const a=['Yes.','No.','Probably.','Ask again later.','Definitely.','Unlikely.'];
module.exports={name:'8ball2',category:'fun',description:'Ask a simple yes/no question.',usage:'/8ball2 <question>',role:0,cooldown:3,async execute(ctx){if(!ctx.args.length)return ctx.reply(ctx.error('Ask a question.'));return ctx.reply(ctx.format('8 Ball',[a[Math.floor(Math.random()*a.length)]]));}};
