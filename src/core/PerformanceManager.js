'use strict';

const PROFILES = Object.freeze({
  low: Object.freeze({ intervalMs: 15000, maxConcurrent: 1, cacheTtlMs: 30000, historyLimit: 100, description: 'Minimum resource usage for low-end hosting.' }),
  medium: Object.freeze({ intervalMs: 10000, maxConcurrent: 2, cacheTtlMs: 20000, historyLimit: 250, description: 'Balanced resource usage for small servers.' }),
  normal: Object.freeze({ intervalMs: 5000, maxConcurrent: 4, cacheTtlMs: 10000, historyLimit: 500, description: 'Standard MATEO-FMB operation.' }),
  high: Object.freeze({ intervalMs: 3000, maxConcurrent: 8, cacheTtlMs: 5000, historyLimit: 1000, description: 'Higher responsiveness with more resource headroom.' }),
  max: Object.freeze({ intervalMs: 1000, maxConcurrent: 16, cacheTtlMs: 2000, historyLimit: 2000, description: 'Maximum responsiveness; use on capable hosting.' }),
});

class PerformanceManager {
  constructor({ config, state, logger } = {}) {
    this.config = config;
    this.state = state;
    this.logger = logger;
    this.mode = String(config?.get('performance.mode', 'normal') || 'normal').toLowerCase();
    if (!PROFILES[this.mode]) this.mode = 'normal';
    this.appliedAt = Date.now();
  }

  static get PROFILES() { return PROFILES; }

  get profile() { return PROFILES[this.mode]; }

  setMode(mode) {
    const next = String(mode || '').trim().toLowerCase();
    if (!PROFILES[next]) return { ok: false, allowed: Object.keys(PROFILES) };
    this.mode = next;
    this.appliedAt = Date.now();
    this.state?.setState('performance.mode', next);
    this.state?.setState('performance.appliedAt', new Date(this.appliedAt).toISOString());
    this.logger?.info(`Performance mode changed to ${next}.`);
    return { ok: true, mode: next, profile: this.profile };
  }

  snapshot() {
    return {
      mode: this.mode,
      ...this.profile,
      appliedAt: new Date(this.appliedAt).toISOString(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }
}

module.exports = PerformanceManager;
