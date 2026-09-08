'use strict';
const chars='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
module.exports={name:'password',aliases:['passgen'],category:'utility',description:'Generate a random password locally.',usage:'/password [length]',role:0,cooldown:5,async execute(ctx){const n=Math.max(6,Math.min(64,Number(ctx.args[0])||16));let out='';for(let i=0;i<n;i++)out+=chars[Math.floor(Math.random()*chars.length)];return ctx.reply(ctx.format('Password',[out]));}};
