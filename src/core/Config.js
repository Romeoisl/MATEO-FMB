const fs = require('fs');
const path = require('path');
require('dotenv').config();

class Config {
  constructor() {
    this.env = process.env.NODE_ENV || 'production';
    this.isDev = this.env === 'development';
  }

  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = process.env[keys[0]];

    for (let i = 1; i < keys.length; i++) {
      if (value && typeof value === 'object') {
        value = value[keys[i]];
      } else {
        return defaultValue;
      }
    }

    return value !== undefined ? value : defaultValue;
  }

  getRequired(key) {
    const value = this.get(key);
    if (value === null || value === undefined || value === '') {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  getJSON(key, defaultValue = null) {
    try {
      const value = this.get(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (err) {
      throw new Error(`Invalid JSON for ${key}: ${err.message}`);
    }
  }

  getBoolean(key, defaultValue = false) {
    const value = this.get(key);
    if (value === null || value === undefined) return defaultValue;
    return value === 'true' || value === '1' || value === true;
  }

  getNumber(key, defaultValue = 0) {
    const value = this.get(key);
    if (value === null || value === undefined) return defaultValue;
    return parseInt(value, 10);
  }

  toObject() {
    return {
      env: this.env,
      isDev: this.isDev,

      facebook: {
        appstate: this.getJSON('FACEBOOK_APPSTATE', []),
      },

      bot: {
        ownerID: this.get('BOT_OWNER_ID', ''),
        prefix: this.get('BOT_PREFIX', '/'),
        name: this.get('BOT_NAME', 'MATEO-FMB'),
        language: this.get('BOT_LANGUAGE', 'en'),
      },

      database: {
        type: this.get('DB_TYPE', 'json'),
        path: this.get('DB_PATH', './data/mateo.db'),
      },

      logging: {
        level: this.get('LOG_LEVEL', 'info'),
        colors: this.getBoolean('LOG_COLORS', true),
      },

      ai: {
        provider: this.get('AI_PROVIDER', 'none'),
        openai: {
          apiKey: this.get('OPENAI_API_KEY', ''),
        },
        huggingface: {
          apiKey: this.get('HUGGINGFACE_API_KEY', ''),
        },
      },

      advanced: {
        autoRestartInterval: this.getNumber('AUTO_RESTART_INTERVAL', 60),
        connectionTimeout: this.getNumber('CONNECTION_TIMEOUT', 30000),
        maxQueueSize: this.getNumber('MAX_QUEUE_SIZE', 1000),
      },
    };
  }

  validate() {
    const errors = [];

    const appstate = this.getJSON('FACEBOOK_APPSTATE', []);
    if (!Array.isArray(appstate) || appstate.length === 0) {
      errors.push('FACEBOOK_APPSTATE must be a non-empty JSON array');
    }

    const ownerID = this.get('BOT_OWNER_ID', '');
    if (!ownerID) {
      errors.push('BOT_OWNER_ID is required');
    }

    const dbType = this.get('DB_TYPE', 'json');
    if (!['json', 'sqlite'].includes(dbType)) {
      errors.push('DB_TYPE must be "json" or "sqlite"');
    }

    const logLevel = this.get('LOG_LEVEL', 'info');
    if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
      errors.push('LOG_LEVEL must be one of: debug, info, warn, error');
    }

    const aiProvider = this.get('AI_PROVIDER', 'none');
    if (!['none', 'openai', 'huggingface'].includes(aiProvider)) {
      errors.push('AI_PROVIDER must be one of: none, openai, huggingface');
    }

    return errors;
  }
}

module.exports = new Config();
