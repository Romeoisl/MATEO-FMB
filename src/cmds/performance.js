'use strict';

function formatMemory(bytes) { return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function percent(value) { return `${(Number(value || 0) * 100).toFixed(1)}%`; }

module.exports = {
  name: 'performance', aliases: ['perf'], category: 'system',
  description: 'Adjust MATEO-FMB resource and responsiveness profile.',
  usage: '/performance [low|medium|normal|high|max]', role: 2, cooldown: 3,

  async execute(ctx) {
    const manager = ctx.services.performance;
    const requested = ctx.args[0];
    if (!requested) {
      const profile = manager.snapshot();
      return ctx.reply(ctx.format('Performance', [
        `Mode: ${profile.mode.toUpperCase()}`,
        `Host: ${profile.host.isDesktop ? 'desktop/terminal' : profile.host.isContainer ? 'container/server' : 'server'}`,
        `CPU: ${profile.host.cpuCount} logical core(s)`,
        `Memory budget: ${profile.host.memoryBudgetMb} MB`,
        `Pressure: ${profile.pressure.level.toUpperCase()} (CPU ${profile.pressure.cpuPercent.toFixed(1)}%, RSS ${percent(profile.pressure.rssRatio)})`,
        `Active/queued: ${profile.activeTasks}/${profile.queuedTasks}`,
        `Network: ${profile.network.active} active, ${formatMemory(profile.network.bytesIn)} in / ${formatMemory(profile.network.bytesOut)} out`,
        `Cache: ${profile.cacheEntries}`,
        '', 'Modes: low • medium • normal • high • max', 'Usage: /performance <mode>',
      ]));
    }
    const result = manager.setMode(requested);
    if (!result.ok) return ctx.reply(ctx.error(`Unknown mode. Choose: ${result.allowed.join(' • ')}`));
    return ctx.reply(ctx.format('Performance', [
      `Mode: ${result.mode.toUpperCase()}`, result.profile.description,
      `CPU budget: ${result.profile.cpuBudgetPercent}%`, `Concurrency: ${result.profile.maxConcurrent}`,
      `Network concurrency: ${result.profile.networkConcurrency}`,
      `Network budget: ${formatMemory(result.profile.networkBytesPerSecond)}/s`,
      `Cache target: ${result.profile.cacheTtlMs / 1000}s`, `Monitoring: ${result.profile.intervalMs / 1000}s`,
    ]));
  },
};
