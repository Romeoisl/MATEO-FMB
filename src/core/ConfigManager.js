'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  botName: 'MATEO-FMB',
  prefix: '/',
  adminIDs: [],
  ownerID: '',
  welcomeMessage: 'Hello! I am MATEO-FMB. Type /help to see my commands.',
  allowedGroups: [],
  language: 'en',
  fcaOptions: {
    online: true,
    updatePresence: true,
    selfListen: false,
    randomUserAgent: false,
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function merge(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object') {
      result[key] = merge(base[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

class ConfigManager {
  constructor({ rootDir = process.cwd(), logger } = {}) {
    this.rootDir = rootDir;
    this.logger = logger;
    this.file = path.join(rootDir, process.env.MATEO_CONFIG || 'settings.json');
    this.config = this._load();
  }

  _load() {
    let userConfig = {};
    if (fs.existsSync(this.file)) {
      try {
        userConfig = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      } catch (error) {
        throw new Error(`Invalid configuration file ${this.file}: ${error.message}`);
      }
    }

    const config = merge(clone(DEFAULTS), userConfig);
    config.botName = process.env.MATEO_BOT_NAME || config.botName;
    config.prefix = process.env.MATEO_PREFIX || config.prefix;
    config.ownerID = process.env.MATEO_OWNER_ID || config.ownerID;
    return config;
  }

  get(key, fallback = undefined) {
    const value = key.split('.').reduce((current, part) => current?.[part], this.config);
    return value === undefined ? fallback : value;
  }

  all() {
    return clone(this.config);
  }
}

module.exports = ConfigManager;
