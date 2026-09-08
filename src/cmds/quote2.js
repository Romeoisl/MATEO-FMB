'use strict';
const q=['Progress is still progress.','Good systems make good work easier.','Curiosity is a superpower.','Ship, learn, iterate.','Simple is powerful.'];
module.exports={name:'quote2',aliases:['inspire'],category:'fun',description:'Show an extra motivational quote.',usage:'/quote2',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Inspiration',[q[Math.floor(Math.random()*q.length)]]));}};
