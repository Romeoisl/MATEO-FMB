'use strict';
const items=['Send a funny sticker.','Describe your day using three words.','Compliment the last person who messaged you.','Type a sentence without using the letter e.','Share a harmless fun fact about yourself.'];
module.exports={name:'dare',category:'fun',description:'Get a clean dare.',usage:'/dare',role:0,cooldown:3,async execute(ctx){return ctx.reply(ctx.format('Dare',[items[Math.floor(Math.random()*items.length)]]));}};
