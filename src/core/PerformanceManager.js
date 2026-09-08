'use strict';

const os = require('os');
const fs = require('fs');
const v8 = require('v8');

const PROFILES = Object.freeze({
  low: Object.freeze({ intervalMs: 15000, maxConcurrent: 1, cacheTtlMs: 30000, historyLimit: 100, cpuBudgetPercent: 20, networkConcurrency: 1, networkBytesPerSecond: 256 * 1024, description: 'Conservative mode for low-end hosting and shared machines.' }),
  medium: Object.freeze({ intervalMs: 10000, maxConcurrent: 2, cacheTtlMs: 20000, historyLimit: 250, cpuBudgetPercent: 35, networkConcurrency: 2, networkBytesPerSecond: 512 * 1024, description: 'Balanced mode for small servers and laptops.' }),
  normal: Object.freeze({ intervalMs: 5000, maxConcurrent: 4, cacheTtlMs: 10000, historyLimit: 500, cpuBudgetPercent: 55, networkConcurrency: 4, networkBytesPerSecond: 1024 * 1024, description: 'Standard MATEO-FMB operation with host headroom.' }),
  high: Object.freeze({ intervalMs: 3000, maxConcurrent: 8, cacheTtlMs: 5000, historyLimit: 1000, cpuBudgetPercent: 75, networkConcurrency: 8, networkBytesPerSecond: 2 * 1024 * 1024, description: 'High responsiveness for dedicated or capable hosting.' }),
  max: Object.freeze({ intervalMs: 1000, maxConcurrent: 16, cacheTtlMs: 2000, historyLimit: 2000, cpuBudgetPercent: 85, networkConcurrency: 16, networkBytesPerSecond: 4 * 1024 * 1024, description: 'Maximum bounded bot performance without treating the host as dedicated.' }),
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class PerformanceManager {
  constructor({ config, state, logger } = {}) {
    this.config = config;
    this.state = state;
    this.logger = logger;
    this.host = this._detectHost();
    this.mode = this._normalizeMode(config?.get('performance.mode', 'normal'));
    this.appliedAt = Date.now();
    this.activeTasks = 0;
    this.queue = [];
    this.cache = new Map();
    this.monitorTimer = null;
    this.monitoring = false;
    this.pressure = { rssRatio: 0, heapRatio: 0, cpuPercent: 0, lagMs: 0, diskRatio: 0, level: 'normal' };
    this.cpuSample = { usage: process.cpuUsage(), time: process.hrtime.bigint() };
    this.network = { active: 0, queued: 0, windowStartedAt: Date.now(), bytesIn: 0, bytesOut: 0 };
  }

  static get PROFILES() { return PROFILES; }
  get profile() { return PROFILES[this.mode]; }
  _normalizeMode(mode) { const value = String(mode || '').trim().toLowerCase(); return PROFILES[value] ? value : 'normal'; }

  _detectHost() {
    const cpuCount = Math.max(1, os.cpus()?.length || 1);
    const totalMemory = os.totalmem();
    const containerLimit = Number(this.config?.get('performance.rssLimitMb', 0) || 0);
    const isContainer = Boolean(process.env.CONTAINER || process.env.DOCKER || process.env.PODMAN || fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv'));
    const isDesktop = process.stdin.isTTY || process.stdout.isTTY;
    const platform = process.platform;
    const memoryBudgetMb = containerLimit > 0 ? containerLimit : Math.max(256, Math.min(2048, Math.floor(totalMemory / 1024 / 1024 * (isDesktop ? 0.08 : 0.15))));
    return { platform, cpuCount, totalMemoryMb: Math.round(totalMemory / 1024 / 1024), isContainer, isDesktop, memoryBudgetMb };
  }

  effectiveProfile() {
    const base = this.profile;
    const pressure = this.pressure.level;
    if (pressure === 'critical') return { ...base, maxConcurrent: Math.max(1, Math.ceil(base.maxConcurrent / 2)), networkConcurrency: Math.max(1, Math.ceil(base.networkConcurrency / 2)), networkBytesPerSecond: Math.max(64 * 1024, Math.floor(base.networkBytesPerSecond / 2)) };
    if (pressure === 'high') return { ...base, maxConcurrent: Math.max(1, Math.ceil(base.maxConcurrent * 0.75)), networkConcurrency: Math.max(1, Math.ceil(base.networkConcurrency * 0.75)), networkBytesPerSecond: Math.max(64 * 1024, Math.floor(base.networkBytesPerSecond * 0.75)) };
    return base;
  }

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
    return { ok: true, mode: next, profile: this.effectiveProfile() };
  }

  async run(task) {
    if (typeof task !== 'function') throw new TypeError('Performance task must be a function.');
    const limit = this.effectiveProfile().maxConcurrent;
    if (this.activeTasks < limit) return this._runTask(task);
    return new Promise((resolve, reject) => { this.queue.push({ task, resolve, reject }); this._trimQueue(); });
  }

  async _runTask(task) {
    this.activeTasks += 1;
    try { return await task(); }
    finally { this.activeTasks = Math.max(0, this.activeTasks - 1); this._drain(); }
  }

  _drain() {
    const limit = this.effectiveProfile().maxConcurrent;
    while (this.activeTasks < limit && this.queue.length) {
      const item = this.queue.shift();
      this._runTask(item.task).then(item.resolve, item.reject);
    }
  }

  _trimQueue() {
    const maxQueue = Math.max(10, this.effectiveProfile().maxConcurrent * 8);
    if (this.queue.length <= maxQueue) return;
    const dropped = this.queue.splice(maxQueue);
    for (const item of dropped) item.reject(new Error('Performance queue is full; try again shortly.'));
  }

  async network(task, { direction = 'both', estimatedBytes = 0 } = {}) {
    const profile = this.effectiveProfile();
    if (this.network.active >= profile.networkConcurrency) {
      await new Promise((resolve, reject) => this.queue.push({ task: async () => this.network(task, { direction, estimatedBytes }), resolve, reject }));
      return;
    }
    await this._waitForNetworkBudget(estimatedBytes);
    this.network.active += 1;
    try {
      const result = await task();
      this.recordNetwork(direction, estimatedBytes);
      return result;
    } finally { this.network.active = Math.max(0, this.network.active - 1); this._drain(); }
  }

  async _waitForNetworkBudget(bytes) {
    const limit = this.effectiveProfile().networkBytesPerSecond;
    const now = Date.now();
    if (now - this.network.windowStartedAt >= 1000) { this.network.windowStartedAt = now; this.network.bytesIn = 0; this.network.bytesOut = 0; }
    if (Math.max(this.network.bytesIn, this.network.bytesOut) + Math.max(0, Number(bytes) || 0) > limit) {
      await sleep(Math.max(25, 1000 - (now - this.network.windowStartedAt)));
      this.network.windowStartedAt = Date.now();
      this.network.bytesIn = 0;
      this.network.bytesOut = 0;
    }
  }

  recordNetwork(direction, bytes = 0) {
    const value = Math.max(0, Number(bytes) || 0);
    if (direction === 'in' || direction === 'both') this.network.bytesIn += value;
    if (direction === 'out' || direction === 'both') this.network.bytesOut += value;
  }

  async cached(key, task, ttlMs = this.effectiveProfile().cacheTtlMs) {
    const cacheKey = String(key); const now = Date.now(); const hit = this.cache.get(cacheKey);
    if (hit && hit.expiresAt > now) return hit.value;
    if (hit) this.cache.delete(cacheKey);
    const value = await this.run(task);
    this.cache.set(cacheKey, { value, expiresAt: Date.now() + Math.max(0, Number(ttlMs) || 0) });
    this._trimCache(); return value;
  }

  _trimCache() {
    const limit = Math.max(50, this.effectiveProfile().historyLimit);
    while (this.cache.size > limit) this.cache.delete(this.cache.keys().next().value);
  }

  startMonitoring() {
    if (this.monitorTimer) return;
    this.monitoring = true; this._samplePressure();
    this.monitorTimer = setInterval(() => this._samplePressure(), this.profile.intervalMs);
    this.monitorTimer.unref?.();
  }

  stopMonitoring() { if (this.monitorTimer) clearInterval(this.monitorTimer); this.monitorTimer = null; this.monitoring = false; }

  _samplePressure() {
    const memory = process.memoryUsage();
    const heapLimit = Number(v8.getHeapStatistics().heap_size_limit || 0);
    const rssLimit = this.host.memoryBudgetMb * 1024 * 1024;
    const heapRatio = heapLimit > 0 ? memory.heapUsed / heapLimit : 0;
    const rssRatio = rssLimit > 0 ? memory.rss / rssLimit : 0;
    const cpu = this._cpuPercent();
    const level = cpu >= this.profile.cpuBudgetPercent + 10 || heapRatio >= 0.9 || rssRatio >= 0.9 ? 'critical' : cpu >= this.profile.cpuBudgetPercent || heapRatio >= 0.75 || rssRatio >= 0.75 ? 'high' : 'normal';
    this.pressure = { ...this.pressure, rssRatio, heapRatio, cpuPercent: cpu, level };
    this.state?.setState('performance.pressure', this.pressure);
    if (level !== 'normal') this.logger?.warn(`Host pressure ${level}: CPU ${cpu.toFixed(1)}%, RSS ${(rssRatio * 100).toFixed(1)}%.`);
    this._trimQueue(); this._trimCache(); this._drain();
  }

  _cpuPercent() {
    const now = process.hrtime.bigint(); const usage = process.cpuUsage();
    const elapsed = Number(now - this.cpuSample.time) / 1e6;
    const userSystemMs = (usage.user - this.cpuSample.usage.user + usage.system - this.cpuSample.usage.system) / 1000;
    this.cpuSample = { usage, time: now };
    if (elapsed <= 0) return 0;
    return Math.min(100, (userSystemMs / (elapsed * Math.max(1, this.host.cpuCount))) * 100);
  }

  snapshot() {
    return { mode: this.mode, ...this.effectiveProfile(), appliedAt: new Date(this.appliedAt).toISOString(), host: this.host, activeTasks: this.activeTasks, queuedTasks: this.queue.length, cacheEntries: this.cache.size, monitoring: this.monitoring, pressure: this.pressure, network: { ...this.network }, memory: process.memoryUsage(), cpu: process.cpuUsage() };
  }
}

module.exports = PerformanceManager;
