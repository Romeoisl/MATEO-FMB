'use strict';
const answers=['Yes.','No.','Probably.','Ask again later.','Absolutely.','Not a chance.','It looks promising.','The answer is unclear.'];
module.exports={name:'8ball',aliases:['eightball'],category:'fun',description:'Ask a yes-or-no question.',usage:'/8ball <question>',cooldown:2,role:0,async execute(ctx){if(!ctx.args.length)return ctx.reply(ctx.error(`Usage: ${ctx.prefix}8ball <question>`));return ctx.reply(ctx.format('8-Ball',[`Question: ${ctx.args.join(' ')}`,`Answer: ${answers[Math.floor(Math.random()*answers.length)]}`]));}};
