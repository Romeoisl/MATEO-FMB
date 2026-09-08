'use strict';

module.exports = {
  name: 'safety',
  aliases: ['safe'],
  category: 'system',
  description: 'Inspect or reset the runtime safety monitor.',
  usage: '/safety [status|incidents|clear]',
  role: 2,
  cooldown: 3,

  async execute(ctx) {
    const action = String(ctx.args[0] || 'status').toLowerCase();
    const safety = ctx.services.safety;
    if (!safety) return ctx.reply(ctx.error('Safety service is unavailable.'));

    if (action === 'clear') {
      safety.clear();
      return ctx.reply(ctx.format('Safety', ['Safety state cleared.', 'Automatic recovery remains subject to connection health.']));
    }

    const snapshot = safety.status();
    if (action === 'incidents') {
      const incidents = snapshot.incidents || [];
      return ctx.reply(ctx.format('Safety incidents', incidents.length
        ? incidents.map(item => `${item.at} • ${item.category} • ${item.source}: ${item.message}`)
        : ['No recent safety incidents.']));
    }

    if (action !== 'status') return ctx.reply(ctx.error('Usage: /safety [status|incidents|clear]'));
    const last = snapshot.lastIncident;
    return ctx.reply(ctx.format('Safety', [
      `Status: ${snapshot.status}`,
      `Incidents retained: ${snapshot.incidents?.length || 0}`,
      last ? `Last: ${last.category} during ${last.source} at ${last.at}` : 'Last incident: none',
    ]));
  },
};
