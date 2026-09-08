'use strict';

const path = require('path');
const fs = require('fs');

const DEFAULT_STATE = {
  startTime: null,
  lastConnected: null,
  status: 'offline',
  stats: { messagesHandled: 0, commandsExecuted: 0, errorsEncountered: 0 },
};
const clone = value => JSON.parse(JSON.stringify(value));

class StateManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.dataDir = path.join(process.cwd(), 'data');
    this.stateFile = path.join(this.dataDir, 'bot-state.json');
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.state = this._loadState();
  }

  _loadState() {
    if (fs.existsSync(this.stateFile)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
        const state = { ...clone(DEFAULT_STATE), ...parsed };
        state.startTime = new Date().toISOString();
        state.stats = { ...clone(DEFAULT_STATE.stats), ...(parsed.stats || {}) };
        return state;
      } catch (err) {
        this.logger.warn('Failed to load bot state, creating new:', err.message);
      }
    }
    return { ...clone(DEFAULT_STATE), startTime: new Date().toISOString() };
  }

  _saveState() {
    try {
      fs.mkdirSync(path.dirname(this.stateFile), { recursive: true });
      const temp = `${this.stateFile}.${process.pid}.tmp`;
      fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), 'utf8');
      fs.renameSync(temp, this.stateFile);
    } catch (err) {
      this.logger.error('Failed to save bot state:', err.message);
    }
  }

  setState(key, value) {
    const keys = String(key).split('.').filter(Boolean);
    if (!keys.length) return;
    let obj = this.state;
    for (const keyPart of keys.slice(0, -1)) {
      if (!obj[keyPart] || typeof obj[keyPart] !== 'object') obj[keyPart] = {};
      obj = obj[keyPart];
    }
    obj[keys.at(-1)] = value;
    this._saveState();
  }

  getState(key, defaultValue = null) {
    const keys = String(key).split('.').filter(Boolean);
    let obj = this.state;
    for (const keyPart of keys) {
      if (!obj || typeof obj !== 'object') return defaultValue;
      obj = obj[keyPart];
    }
    return obj === undefined ? defaultValue : obj;
  }

  incrementStat(statKey, amount = 1) {
    const current = Number(this.getState(`stats.${statKey}`, 0)) || 0;
    this.setState(`stats.${statKey}`, current + (Number(amount) || 0));
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
