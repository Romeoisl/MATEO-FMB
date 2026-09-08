'use strict';
module.exports={name:'features',category:'system',description:'Show major enabled framework capabilities.',usage:'/features',role:0,cooldown:4,async execute(ctx){return ctx.reply(ctx.format('Features',['Commands','Permissions and cooldowns','Groups and users','Economy','Moderation','AI provider','Performance governor','Safety monitor','Recovery manager','Health dashboard']));}};
