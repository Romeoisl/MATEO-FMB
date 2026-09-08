'use strict';
const words=['orbit','signal','matrix','coffee','pixel','rocket','forest','thunder','neon','comet','river','falcon'];
module.exports={name:'randomword',category:'fun',description:'Generate a random word.',usage:'/randomword',role:0,cooldown:2,async execute(ctx){return ctx.reply(words[Math.floor(Math.random()*words.length)]);}};
