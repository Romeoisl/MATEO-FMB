const path = require('path');
const fs = require('fs');

class StateManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.dataDir = path.join(process.cwd(), 'data');
    this.stateFile = path.join(this.dataDir, 'bot-state.json');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.state = this._loadState();
  }

  _loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
      } catch (err) {
        this.logger.warn('Failed to load bot state, creating new:', err.message);
      }
    }

    return {
      startTime: new Date(),
      lastConnected: null,
      status: 'offline',
      stats: {
        messagesHandled: 0,
        commandsExecuted: 0,
        errorsEncountered: 0,
      },
    };
  }

  _saveState() {
    try {
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      this.logger.error('Failed to save bot state:', err.message);
    }
  }

  setState(key, value) {
    const keys = key.split('.');
    let obj = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    this._saveState();
  }

  getState(key, defaultValue = null) {
    const keys = key.split('.');
    let obj = this.state;

    for (const k of keys) {
      if (obj && typeof obj === 'object') {
        obj = obj[k];
      } else {
        return defaultValue;
      }
    }

    return obj !== undefined ? obj : defaultValue;
  }

  incrementStat(statKey) {
    const current = this.getState(`stats.${statKey}`, 0);
    this.setState(`stats.${statKey}`, current + 1);
  }

  getStatus() {
    return {
      status: this.state.status,
      startTime: this.state.startTime,
      uptime: Date.now() - new Date(this.state.startTime).getTime(),
      lastConnected: this.state.lastConnected,
      stats: this.state.stats,
    };
  }
}

module.exports = StateManager;
