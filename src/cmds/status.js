'use strict';

module.exports = {
  name: 'status', aliases: ['stats', 'uptime'], category: 'system',
  description: 'Show live MATEO-FMB runtime statistics.', usage: '/status', role: 0, cooldown: 10,
  async execute(ctx) {
    const users=ctx.db.data.users.length, groups=ctx.db.data.groups.length;
    const stats=ctx.registry.state?.getStatus?.() || {uptime:0,stats:{}};
    const uptime=Math.floor(stats.uptime/1000); const h=Math.floor(uptime/3600), m=Math.floor((uptime%3600)/60), s=uptime%60;
    return ctx.reply(['MATEO-FMB STATUS',`Connection: ${ctx.api ? 'ACTIVE' : 'OFFLINE'}`,`Uptime: ${h}h ${m}m ${s}s`,`Users: ${users}`,`Groups: ${groups}`,`Commands: ${ctx.registry.commands.size}`,`Messages: ${stats.stats.messagesHandled||0}`,`Commands used: ${stats.stats.commandsExecuted||0}`,`Errors: ${stats.stats.errorsEncountered||0}`].join('\n'));
  },
};
