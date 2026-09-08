'use strict';

const os = require('os');
const fs = require('fs');
const v8 = require('v8');
const { monitorEventLoopDelay } = require('perf_hooks');

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
    this.taskQueue = [];
    this.networkQueue = [];
    this.cache = new Map();
    this.monitorTimer = null;
    this.monitoring = false;
    this.pressure = { rssRatio: 0, heapRatio: 0, cpuPercent: 0, lagMs: 0, diskRatio: 0, level: 'normal' };
    this.cpuSample = { usage: process.cpuUsage(), time: process.hrtime.bigint() };
    this.eventLoop = monitorEventLoopDelay({ resolution: 20 });
    this.eventLoop.disable();
    this.network = {
      active: 0,
      queued: 0,
      inbound: { windowStartedAt: Date.now(), bytes: 0 },
      outbound: { windowStartedAt: Date.now(), bytes: 0 },
    };
  }

  static get PROFILES() { return PROFILES; }
  get profile() { return PROFILES[this.mode]; }
  _normalizeMode(mode) { const value = String(mode || '').trim().toLowerCase(); return PROFILES[value] ? value : 'normal'; }

  _readCgroupNumber(file) {
    try {
      if (!fs.existsSync(file)) return null;
      const value = fs.readFileSync(file, 'utf8').trim();
      if (!value || value === 'max' || value === 'infinity') return null;
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : null;
    } catch (_) { return null; }
  }

  _detectCgroupMemoryBytes() {
    const v2 = this._readCgroupNumber('/sys/fs/cgroup/memory.max');
    if (v2) return v2;
    return this._readCgroupNumber('/sys/fs/cgroup/memory/memory.limit_in_bytes');
  }

  _detectCgroupCpuCount() {
    try {
      const raw = fs.existsSync('/sys/fs/cgroup/cpu.max') ? fs.readFileSync('/sys/fs/cgroup/cpu.max', 'utf8').trim() : '';
      const [quota, period] = raw.split(/\s+/);
      if (quota && quota !== 'max' && Number(period) > 0) return Math.max(1, Number(quota) / Number(period));
      const oldQuota = this._readCgroupNumber('/sys/fs/cgroup/cpu/cpu.cfs_quota_us');
      const oldPeriod = this._readCgroupNumber('/sys/fs/cgroup/cpu/cpu.cfs_period_us');
      if (oldQuota && oldPeriod) return Math.max(1, oldQuota / oldPeriod);
    } catch (_) { /* fall back to host CPU count */ }
    return null;
  }

  _detectHost() {
    const hostCpuCount = Math.max(1, os.cpus()?.length || 1);
    const hostMemory = os.totalmem();
    const cgroupMemory = this._detectCgroupMemoryBytes();
    const cgroupCpu = this._detectCgroupCpuCount();
    const configuredMemory = Number(this.config?.get('performance.rssLimitMb', 0) || 0);
    const memoryLimitMb = configuredMemory > 0
      ? configuredMemory
      : Math.round(Math.min(hostMemory, cgroupMemory || hostMemory) / 1024 / 1024);
    const isContainer = Boolean(process.env.CONTAINER || process.env.DOCKER || process.env.PODMAN || fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv') || cgroupMemory);
    const isDesktop = !isContainer && (process.platform === 'win32' || process.platform === 'darwin' || process.stdin.isTTY || process.stdout.isTTY);
    const cpuCount = Math.max(1, Math.min(hostCpuCount, Math.ceil(cgroupCpu || hostCpuCount)));
    const hostClass = isContainer ? 'container' : isDesktop ? 'desktop' : 'server';
    const memoryBudgetMb = configuredMemory > 0
      ? Math.max(128, Math.floor(configuredMemory * 0.75))
      : hostClass === 'desktop'
        ? Math.max(256, Math.min(2048, Math.floor(memoryLimitMb * 0.08)))
        : Math.max(256, Math.min(2048, Math.floor(memoryLimitMb * (hostClass === 'container' ? 0.60 : 0.15))));
    return {
      platform: process.platform,
      hostClass,
      cpuCount,
      hostCpuCount,
      cgroupCpuCount: cgroupCpu ? Number(cgroupCpu.toFixed(2)) : null,
      totalMemoryMb: Math.round(hostMemory / 1024 / 1024),
      memoryLimitMb,
      cgroupMemoryDetected: Boolean(cgroupMemory),
      isContainer,
      isDesktop,
      memoryBudgetMb,
    };
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
    if (this.monitoring) {
      clearInterval(this.monitorTimer);
      this.monitorTimer = setInterval(() => this._samplePressure(), this.profile.intervalMs);
      this.monitorTimer.unref?.();
    }
    this._trimQueues();
    this._trimCache();
    return { ok: true, mode: next, profile: this.effectiveProfile() };
  }

  async run(task) {
    if (typeof task !== 'function') throw new TypeError('Performance task must be a function.');
    const limit = this.effectiveProfile().maxConcurrent;
    if (this.activeTasks < limit) return this._runTask(task);
    return new Promise((resolve, reject) => { this.taskQueue.push({ task, resolve, reject }); this._trimQueues(); });
  }

  async _runTask(task) {
    this.activeTasks += 1;
    try { return await task(); }
    finally { this.activeTasks = Math.max(0, this.activeTasks - 1); this._drainTasks(); }
  }

  _drainTasks() {
    const limit = this.effectiveProfile().maxConcurrent;
    while (this.activeTasks < limit && this.taskQueue.length) {
      const item = this.taskQueue.shift();
      this._runTask(item.task).then(item.resolve, item.reject);
    }
  }

  _trimQueues() {
    const taskLimit = Math.max(10, this.effectiveProfile().maxConcurrent * 8);
    const networkLimit = Math.max(10, this.effectiveProfile().networkConcurrency * 8);
    if (this.taskQueue.length > taskLimit) {
      const dropped = this.taskQueue.splice(taskLimit);
      for (const item of dropped) item.reject(new Error('Performance task queue is full; try again shortly.'));
    }
    if (this.networkQueue.length > networkLimit) {
      const dropped = this.networkQueue.splice(networkLimit);
      for (const item of dropped) item.reject(new Error('Performance network queue is full; try again shortly.'));
    }
    this.network.queued = this.networkQueue.length;
  }

  async network(task, { direction = 'both', estimatedBytes = 0 } = {}) {
    if (typeof task !== 'function') throw new TypeError('Network task must be a function.');
    const profile = this.effectiveProfile();
    if (this.network.active >= profile.networkConcurrency) {
      return new Promise((resolve, reject) => {
        this.networkQueue.push({ task, direction, estimatedBytes, resolve, reject });
        this._trimQueues();
      });
    }
    return this._runNetwork(task, direction, estimatedBytes);
  }

  async _runNetwork(task, direction, estimatedBytes) {
    await this._waitForNetworkBudget(direction, estimatedBytes);
    this.network.active += 1;
    this.network.queued = this.networkQueue.length;
    try {
      const result = await task();
      const actual = this._estimateBytes(result);
      this.recordNetwork(direction, actual || estimatedBytes);
      return result;
    } finally {
      this.network.active = Math.max(0, this.network.active - 1);
      this._drainNetwork();
    }
  }

  _drainNetwork() {
    const limit = this.effectiveProfile().networkConcurrency;
    while (this.network.active < limit && this.networkQueue.length) {
      const item = this.networkQueue.shift();
      this._runNetwork(item.task, item.direction, item.estimatedBytes).then(item.resolve, item.reject);
    }
    this.network.queued = this.networkQueue.length;
  }

  _estimateBytes(value) {
    try {
      if (Buffer.isBuffer(value)) return value.length;
      if (typeof value === 'string') return Buffer.byteLength(value, 'utf8');
      if (value?.data && Buffer.isBuffer(value.data)) return value.data.length;
      const length = Number(value?.headers?.['content-length'] || value?.headers?.['Content-Length'] || 0);
      return Number.isFinite(length) && length > 0 ? length : 0;
    } catch (_) { return 0; }
  }

  async _waitForNetworkBudget(direction, bytes) {
    const value = Math.max(0, Number(bytes) || 0);
    const directions = direction === 'both' ? ['inbound', 'outbound'] : direction === 'in' ? ['inbound'] : ['outbound'];
    for (;;) {
      let wait = 0;
      const now = Date.now();
      for (const key of directions) {
        const bucket = this.network[key];
        if (now - bucket.windowStartedAt >= 1000) { bucket.windowStartedAt = now; bucket.bytes = 0; }
        const limit = this.effectiveProfile().networkBytesPerSecond;
        if (bucket.bytes + value > limit) wait = Math.max(wait, 1000 - (now - bucket.windowStartedAt));
      }
      if (!wait) return;
      await sleep(Math.max(25, wait));
    }
  }

  recordNetwork(direction, bytes = 0) {
    const value = Math.max(0, Number(bytes) || 0);
    if (direction === 'in' || direction === 'both') this.network.inbound.bytes += value;
    if (direction === 'out' || direction === 'both') this.network.outbound.bytes += value;
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
    this.monitoring = true;
    this.eventLoop.enable();
    this._samplePressure();
    this.monitorTimer = setInterval(() => this._samplePressure(), this.profile.intervalMs);
    this.monitorTimer.unref?.();
  }

  stopMonitoring() {
    if (this.monitorTimer) clearInterval(this.monitorTimer);
    this.monitorTimer = null;
    this.monitoring = false;
    this.eventLoop.disable();
  }

  _diskPressure() {
    try {
      if (typeof fs.statfsSync !== 'function') return 0;
      const stat = fs.statfsSync(this.config?.rootDir || process.cwd());
      const total = Number(stat.blocks) * Number(stat.bsize);
      const free = Number(stat.bavail) * Number(stat.bsize);
      return total > 0 ? Math.max(0, Math.min(1, 1 - free / total)) : 0;
    } catch (_) { return 0; }
  }

  _samplePressure() {
    const memory = process.memoryUsage();
    const heapLimit = Number(v8.getHeapStatistics().heap_size_limit || 0);
    const rssLimit = this.host.memoryBudgetMb * 1024 * 1024;
    const heapRatio = heapLimit > 0 ? memory.heapUsed / heapLimit : 0;
    const rssRatio = rssLimit > 0 ? memory.rss / rssLimit : 0;
    const cpu = this._cpuPercent();
    const lagMs = Number(this.eventLoop.percentile(95) || 0) / 1e6;
    const diskRatio = this._diskPressure();
    this.eventLoop.reset();
    const level = cpu >= this.profile.cpuBudgetPercent + 10 || heapRatio >= 0.9 || rssRatio >= 0.9 || lagMs >= 250 || diskRatio >= 0.95
      ? 'critical'
      : cpu >= this.profile.cpuBudgetPercent || heapRatio >= 0.75 || rssRatio >= 0.75 || lagMs >= 100 || diskRatio >= 0.90
        ? 'high' : 'normal';
    this.pressure = { rssRatio, heapRatio, cpuPercent: cpu, lagMs, diskRatio, level };
    this.state?.setState('performance.pressure', this.pressure);
    if (level !== 'normal') this.logger?.warn(`Host pressure ${level}: CPU ${cpu.toFixed(1)}%, RSS ${(rssRatio * 100).toFixed(1)}%, lag ${lagMs.toFixed(1)}ms.`);
    this._trimQueues(); this._trimCache(); this._drainTasks(); this._drainNetwork();
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
    return {
      mode: this.mode,
      ...this.effectiveProfile(),
      appliedAt: new Date(this.appliedAt).toISOString(),
      host: this.host,
      activeTasks: this.activeTasks,
      queuedTasks: this.taskQueue.length,
      cacheEntries: this.cache.size,
      monitoring: this.monitoring,
      pressure: this.pressure,
      network: {
        active: this.network.active,
        queued: this.networkQueue.length,
        inbound: { ...this.network.inbound },
        outbound: { ...this.network.outbound },
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };
  }
}

module.exports = PerformanceManager;
