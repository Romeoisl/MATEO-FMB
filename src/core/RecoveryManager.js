'use strict';

class RecoveryManager {
  constructor({ state, logger, safety, performance } = {}) {
    this.state = state;
    this.logger = logger;
    this.safety = safety;
    this.performance = performance;
    this.failures = 0;
    this.lastFailureAt = null;
    this.lastRecoveryAt = null;
  }

  recordFailure(error, scope = 'runtime') {
    this.failures += 1;
    this.lastFailureAt = new Date().toISOString();
    this.state?.setState('recovery.failures', this.failures);
    this.state?.setState('recovery.lastFailureAt', this.lastFailureAt);
    this.logger?.warn(`Recovery recorded failure in ${scope}: ${error?.message || error}`);
  }

  async recover(scope, action) {
    if (typeof action !== 'function') return false;
    if (this.safety?.status?.().status === 'suspected_suspension') {
      this.logger?.warn('Recovery paused because safety monitor requires operator review.');
      return false;
    }
    try {
      await action();
      this.lastRecoveryAt = new Date().toISOString();
      this.state?.setState('recovery.lastRecoveryAt', this.lastRecoveryAt);
      this.state?.setState('recovery.lastScope', scope);
      this.logger?.info(`Recovery completed for ${scope}.`);
      return true;
    } catch (error) {
      this.recordFailure(error, `recovery:${scope}`);
      return false;
    }
  }

  snapshot() {
    return {
      failures: this.failures,
      lastFailureAt: this.lastFailureAt,
      lastRecoveryAt: this.lastRecoveryAt,
    };
  }
}

module.exports = RecoveryManager;
