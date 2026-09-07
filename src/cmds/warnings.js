'use strict';
module.exports={name:'warnings',aliases:['warns'],category:'admin',description:'View a user warning count.',usage:'/warnings [userID or @mention]',role:1,cooldown:2,async execute(ctx){const id=ctx.args[0]||Object.values(ctx.message.mentions||{})[0]?.id||ctx.userID;const count=ctx.services.moderation.warnings(id);return ctx.reply(`User ${id} has ${count} warning(s).`);}};
