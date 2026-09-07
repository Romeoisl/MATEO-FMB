'use strict';

const PerformanceManager = require('../core/PerformanceManager');

function formatMemory(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

module.exports = {
  name: 'performance',
  aliases: ['perf'],
  category: 'system',
  description: 'Adjust MATEO-FMB resource and responsiveness profile.',
  usage: '/performance [low|medium|normal|high|max]',
  role: 2,
  cooldown: 3,

  async execute(ctx) {
    const requested = ctx.args[0];
    if (!requested) {
      const profile = ctx.services.performance.snapshot();
      return ctx.reply(ctx.format('Performance', [
        `Mode: ${profile.mode.toUpperCase()}`,
        `Profile: ${profile.description}`,
        `Memory: ${formatMemory(profile.memory.rss)}`,
        `Concurrency target: ${profile.maxConcurrent}`,
        '',
        'Modes: low • medium • normal • high • max',
        'Usage: /performance <mode>',
      ]));
    }

    const result = ctx.services.performance.setMode(requested);
    if (!result.ok) return ctx.reply(ctx.error(`Unknown mode. Choose: ${result.allowed.join(' • ')}`));

    return ctx.reply(ctx.format('Performance', [
      `Mode: ${result.mode.toUpperCase()}`,
      result.profile.description,
      `Concurrency target: ${result.profile.maxConcurrent}`,
      `Cache target: ${result.profile.cacheTtlMs / 1000}s`,
      `Monitoring interval: ${result.profile.intervalMs / 1000}s`,
    ]));
  },
};
