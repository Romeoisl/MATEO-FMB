'use strict';

/**
 * Queues outgoing Messenger messages without blocking inbound events.
 * Each message waits a configurable random delay before being sent.
 */
class MessageDelay {
  constructor({ config, logger } = {}) {
    this.config = config;
    this.logger = logger;
    this.queues = new Map();
  }

  _settings() {
    const enabled = this.config?.get('messageDelay.enabled', true) !== false;
    const minMs = Math.max(0, Number(this.config?.get('messageDelay.minMs', 2000)) || 0);
    const maxMs = Math.max(minMs, Number(this.config?.get('messageDelay.maxMs', 3000)) || minMs);
    return { enabled, minMs, maxMs };
  }

  _delayMs() {
    const { minMs, maxMs } = this._settings();
    if (maxMs === minMs) return minMs;
    return Math.floor(minMs + Math.random() * (maxMs - minMs + 1));
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  send(api, text, threadID, ...extra) {
    if (!api?.sendMessage) return Promise.reject(new Error('sendMessage is unavailable.'));

    const callbackIndex = extra.findIndex(value => typeof value === 'function');
    const callback = callbackIndex >= 0 ? extra[callbackIndex] : null;
    const args = callbackIndex >= 0 ? extra.filter((_, index) => index !== callbackIndex) : extra;
    const key = String(threadID || 'global');
    const previous = this.queues.get(key) || Promise.resolve();

    const task = previous
      .catch(() => {})
      .then(async () => {
        const { enabled } = this._settings();
        const delay = enabled ? this._delayMs() : 0;
        if (delay > 0) await this._sleep(delay);

        return new Promise((resolve, reject) => {
          let settled = false;
          const done = error => {
            if (settled) return;
            settled = true;
            if (callback) {
              try { callback(error || null); } catch (callbackError) { this.logger?.warn?.(`Send callback failed: ${callbackError.message}`); }
            }
            if (error) reject(error instanceof Error ? error : new Error(String(error)));
            else resolve();
          };

          try {
            const result = api.sendMessage(text, threadID, ...args, done);
            if (result && typeof result.then === 'function') result.then(() => done(), done);
          } catch (error) {
            done(error);
          }
        });
      });

    this.queues.set(key, task);
    task.finally(() => {
      if (this.queues.get(key) === task) this.queues.delete(key);
    }).catch(error => this.logger?.warn?.(`Outgoing message failed: ${error.message}`));

    return task;
  }

  clear() {
    this.queues.clear();
  }
}

module.exports = MessageDelay;
