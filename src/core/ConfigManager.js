'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  botName: 'MATEO-FMB',
  version: '0.3.0',
  tagline: 'A modern Messenger bot.',
  prefix: '/',
  adminIDs: [],
  ownerID: '',
  welcomeMessage: 'Welcome to MATEO-FMB. Type /help to see what I can do.',
  allowedGroups: [],
  language: 'en',
  style: {
    footer: 'MATEO-FMB',
    separator: '━━━━━━━━━━━━━━━━',
  },
  ai: { endpoint: '' },
  fcaOptions: {
    online: true,
    updatePresence: true,
    selfListen: false,
    randomUserAgent: false,
  },
};

const clone = value => JSON.parse(JSON.stringify(value));

function merge(base, override) {
  const result = { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value) && base[key] && typeof base[key] === 'object'
      ? merge(base[key], value)
      : value;
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
    config.version = process.env.MATEO_VERSION || config.version;
    config.prefix = process.env.MATEO_PREFIX || config.prefix;
    config.ownerID = process.env.MATEO_OWNER_ID || config.ownerID;
    config.ai.endpoint = process.env.MATEO_AI_ENDPOINT || config.ai.endpoint;
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
