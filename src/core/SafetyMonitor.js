'use strict';

/**
 * Watches authentication/connection failures for signs that the account or
 * session may have been restricted. This does not bypass platform enforcement;
 * it pauses automatic retries so an uncertain failure can be reviewed safely.
 */
class SafetyMonitor {
  constructor({ state, logger, config } = {}) {
    this.state = state;
    this.logger = logger;
    this.config = config;
    this.incidents = [];
    this.maxIncidents = 25;
  }

  classify(error) {
    const text = String(error?.message || error || '').toLowerCase();
    const patterns = [
      ['suspension', /suspend|disabled|deactivated|restricted|checkpoint|locked out/],
      ['authentication', /login|auth|cookie|credential|appstate|token|session|password/],
      ['rate_limit', /rate.?limit|too many requests|throttl|temporar/],
      ['connection', /socket|connection|network|timeout|econn|mqtt/],
    ];

    for (const [category, pattern] of patterns) {
      if (pattern.test(text)) return category;
    }
    return 'unknown';
  }

  inspect(error, source = 'unknown') {
    const category = this.classify(error);
    const incident = {
      at: new Date().toISOString(),
      source,
      category,
      message: String(error?.message || error || 'Unknown error').slice(0, 500),
    };

    this.incidents.unshift(incident);
    this.incidents = this.incidents.slice(0, this.maxIncidents);
    this.state?.setState('safety.lastIncident', incident);
    this.state?.setState('safety.status', category === 'suspension' ? 'suspected_suspension' : 'attention');
    this.state?.incrementStat('safetyIncidents');

    if (category === 'suspension') {
      this.logger?.error(`Safety alert: possible account restriction detected during ${source}. Automatic retries should stop.`);
      return { ...incident, action: 'pause' };
    }

    if (category === 'rate_limit') {
      this.logger?.warn(`Safety warning: rate limiting suspected during ${source}.`);
      return { ...incident, action: 'backoff' };
    }

    return { ...incident, action: 'observe' };
  }

  status() {
    return {
      status: this.state?.getState('safety.status', 'normal'),
      lastIncident: this.state?.getState('safety.lastIncident', null),
      incidents: this.incidents,
    };
  }

  clear() {
    this.incidents = [];
    this.state?.setState('safety.status', 'normal');
    this.state?.setState('safety.lastIncident', null);
  }
}

module.exports = SafetyMonitor;
