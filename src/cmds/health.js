'use strict';

module.exports = {
  name: 'health',
  aliases: ['diagnostics'],
  category: 'system',
  description: 'Show runtime health and stability diagnostics.',
  usage: '/health',
  role: 0,
  cooldown: 5,

  async execute(ctx) {
    const performance = ctx.services.performance?.snapshot();
    const safety = ctx.services.safety?.status();
    const recovery = ctx.services.recovery?.snapshot();
    return ctx.reply(ctx.format('Health', [
      `Runtime: ${ctx.config.get('botName', 'MATEO-FMB')}`,
      `Performance: ${performance?.mode || 'unknown'} / ${performance?.pressure?.level || 'unknown'}`,
      `Event-loop lag: ${Number(performance?.pressure?.lagMs || 0).toFixed(1)} ms`,
      `Safety: ${safety?.status || 'unknown'}`,
      `Recovery failures: ${recovery?.failures || 0}`,
    ]));
  },
};
