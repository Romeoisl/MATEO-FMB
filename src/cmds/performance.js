'use strict';

function formatMemory(bytes) {
  return `${(Number(bytes || 0) / 1024 / 1024).toFixed(1)} MB`;
}

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
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
    const manager = ctx.services.performance;
    const requested = ctx.args[0];

    if (!requested) {
      const profile = manager.snapshot();
      return ctx.reply(ctx.format('Performance', [
        `Mode: ${profile.mode.toUpperCase()}`,
        `Host: ${profile.host.hostClass}`,
        `CPU: ${profile.host.cpuCount} effective core(s)`,
        `Memory budget: ${profile.host.memoryBudgetMb} MB`,
        `Pressure: ${profile.pressure.level.toUpperCase()}`,
        `CPU load: ${profile.pressure.cpuPercent.toFixed(1)}%`,
        `RSS pressure: ${percent(profile.pressure.rssRatio)}`,
        `Heap pressure: ${percent(profile.pressure.heapRatio)}`,
        `Event-loop lag: ${profile.pressure.lagMs.toFixed(1)} ms`,
        `Disk usage: ${percent(profile.pressure.diskRatio)}`,
        `Tasks: ${profile.activeTasks} active / ${profile.queuedTasks} queued`,
        `Network: ${profile.network.active} active / ${profile.network.queued} queued`,
        `Inbound: ${formatMemory(profile.network.inbound.bytes)}`,
        `Outbound: ${formatMemory(profile.network.outbound.bytes)}`,
        `Cache: ${profile.cacheEntries}`,
        '',
        'Modes: low • medium • normal • high • max',
        'Usage: /performance <mode>',
      ]));
    }

    const result = manager.setMode(requested);
    if (!result.ok) return ctx.reply(ctx.error(`Unknown mode. Choose: ${result.allowed.join(' • ')}`));

    return ctx.reply(ctx.format('Performance', [
      `Mode: ${result.mode.toUpperCase()}`,
      result.profile.description,
      `CPU budget: ${result.profile.cpuBudgetPercent}%`,
      `Concurrency: ${result.profile.maxConcurrent}`,
      `Network concurrency: ${result.profile.networkConcurrency}`,
      `Network budget: ${formatMemory(result.profile.networkBytesPerSecond)}/s`,
      `Cache target: ${result.profile.cacheTtlMs / 1000}s`,
      `Pressure sampling: ${result.profile.intervalMs / 1000}s`,
    ]));
  },
};
