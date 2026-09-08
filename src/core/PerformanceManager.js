'use strict';

const v8 = require('v8');

const PROFILES = Object.freeze({
  low: Object.freeze({ intervalMs: 15000, maxConcurrent: 1, cacheTtlMs: 30000, historyLimit: 100, description: 'Minimum resource usage for low-end hosting.' }),
  medium: Object.freeze({ intervalMs: 10000, maxConcurrent: 2, cacheTtlMs: 20000, historyLimit: 250, description: 'Balanced resource usage for small servers.' }),
  normal: Object.freeze({ intervalMs: 5000, maxConcurrent: 4, cacheTtlMs: 10000, historyLimit: 500, description: 'Standard MATEO-FMB operation.' }),
  high: Object.freeze({ intervalMs: 3000, maxConcurrent: 8, cacheTtlMs: 5000, historyLimit: 1000, description: 'Higher responsiveness with more resource headroom.' }),
  max: Object.freeze({ intervalMs: 1000, maxConcurrent: 16, cacheTtlMs: 2000, historyLimit: 2000, description: 'Maximum responsiveness with a bounded workload.' }),
});

class PerformanceManager {
  constructor({ config, state, logger } = {}) {
    this.config = config;
    this.state = state;
    this.logger = logger;
    this.mode = String(config?.get('performance.mode', 'normal') || 'normal').toLowerCase();
    if (!PROFILES[this.mode]) this.mode = 'normal';
    this.appliedAt = Date.now();
    this.activeTasks = 0;
    this.queue = [];
    this.cache = new Map();
    this.monitorTimer = null;
    this.monitoring = false;
    this.pressure = { rssRatio: 0, heapRatio: 0, lagMs: 0, level: 'normal' };
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
    this._trimQueue();
    this._trimCache();
    if (this.monitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
    return { ok: true, mode: next, profile: this.profile };
  }

  async run(task) {
    if (typeof task !== 'function') throw new TypeError('Performance task must be a function.');
    if (this.activeTasks < this.profile.maxConcurrent) return this._runTask(task);
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this._trimQueue();
    });
  }

  async _runTask(task) {
    this.activeTasks += 1;
    try { return await task(); }
    finally {
      this.activeTasks = Math.max(0, this.activeTasks - 1);
      this._drain();
    }
  }

  _drain() {
    while (this.activeTasks < this.profile.maxConcurrent && this.queue.length) {
      const item = this.queue.shift();
      this._runTask(item.task).then(item.resolve, item.reject);
    }
  }

  _trimQueue() {
    const maxQueue = Math.max(10, this.profile.maxConcurrent * 8);
    if (this.queue.length <= maxQueue) return;
    const dropped = this.queue.splice(maxQueue);
    for (const item of dropped) item.reject(new Error('Performance queue is full; try again shortly.'));
  }

  async cached(key, task, ttlMs = this.profile.cacheTtlMs) {
    const cacheKey = String(key);
    const now = Date.now();
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > now) return hit.value;
    if (hit) this.cache.delete(cacheKey);
    const value = await this.run(task);
    this.cache.set(cacheKey, { value, expiresAt: Date.now() + Math.max(0, Number(ttlMs) || 0) });
    this._trimCache();
    return value;
  }

  _trimCache() {
    const limit = Math.max(50, this.profile.historyLimit);
    while (this.cache.size > limit) this.cache.delete(this.cache.keys().next().value);
  }

  startMonitoring() {
    if (this.monitorTimer) return;
    this.monitoring = true;
    this._samplePressure();
    this.monitorTimer = setInterval(() => this._samplePressure(), this.profile.intervalMs);
    this.monitorTimer.unref?.();
  }

  stopMonitoring() {
    if (this.monitorTimer) clearInterval(this.monitorTimer);
    this.monitorTimer = null;
    this.monitoring = false;
  }

  _samplePressure() {
    const memory = process.memoryUsage();
    const heapLimit = Number(v8.getHeapStatistics().heap_size_limit || 0);
    const rssLimit = Number(this.config?.get('performance.rssLimitMb', 0) || 0) * 1024 * 1024;
    const heapRatio = heapLimit > 0 ? memory.heapUsed / heapLimit : 0;
    const rssRatio = rssLimit > 0 ? memory.rss / rssLimit : 0;
    const level = heapRatio >= 0.9 || rssRatio >= 0.9 ? 'critical'
      : heapRatio >= 0.75 || rssRatio >= 0.75 ? 'high' : 'normal';
    this.pressure = { rssRatio, heapRatio, lagMs: this.pressure.lagMs, level };
    this.state?.setState('performance.pressure', this.pressure);
  }

  snapshot() {
    return {
      mode: this.mode,
      ...this.profile,
      appliedAt: new Date(this.appliedAt).toISOString(),
      activeTasks: this.activeTasks,
      queuedTasks: this.queue.length,
      cacheEntries: this.cache.size,
      monitoring: this.monitoring,
      pressure: this.pressure,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }
}

module.exports = PerformanceManager;
