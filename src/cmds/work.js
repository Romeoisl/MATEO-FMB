'use strict';
const jobs=['developer','designer','consultant','photographer','writer','teacher','mechanic'];
module.exports={name:'work',aliases:['job'],category:'economy',description:'Work once to earn coins.',usage:'/work',cooldown:3600,role:0,async execute(ctx){const user=ctx.user||await ctx.db.ensureUser(ctx.userID);const amount=50+Math.floor(Math.random()*151);const job=jobs[Math.floor(Math.random()*jobs.length)];user.coins=(user.coins||0)+amount;await ctx.db.write();return ctx.reply(ctx.format('Work',[`Job: ${job}`,`Earned: ${amount} coins`,`Balance: ${user.coins} coins`]));}};
