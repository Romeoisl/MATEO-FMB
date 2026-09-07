'use strict';

const fs = require('fs');
const path = require('path');
const login = require('ws3-fca');

class ConnectionManager {
  constructor({ config, state, events, logger, rootDir = process.cwd() }) {
    this.config = config;
    this.state = state;
    this.events = events;
    this.logger = logger;
    this.rootDir = rootDir;
    this.api = null;
    this.listening = false;
    this.stopping = false;
  }

  _appStatePath() {
    return path.resolve(this.rootDir, process.env.MATEO_APPSTATE_FILE || 'appstate.json');
  }

  _loadAppState() {
    const file = this._appStatePath();
    if (!fs.existsSync(file)) {
      throw new Error(`Missing AppState. Put your local AppState at ${file} or set MATEO_APPSTATE_FILE.`);
    }

    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) throw new Error(`AppState file is empty: ${file}`);

    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error(`Invalid AppState JSON: ${error.message}`);
    }
  }

  async connect() {
    this.stopping = false;
    this.state.setState('status', 'connecting');
    const appState = this._loadAppState();
    const options = this.config.get('fcaOptions', {});

    await new Promise((resolve, reject) => {
      login({ appState }, options, (error, api) => {
        if (error) {
          this.state.setState('status', 'login_failed');
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }
        this.api = api;
        this.state.setState('status', 'online');
        this.state.setState('lastConnected', new Date().toISOString());
        resolve();
      });
    });

    this.api.listenMqtt((error, event) => {
      if (error) {
        this.state.incrementStat('errorsEncountered');
        this.events.dispatch('connection:error', error).catch(err => this.logger.error(err));
        return;
      }
      this.state.incrementStat('messagesHandled');
      this.events.dispatch('message', { api: this.api, event }).catch(err => {
        this.state.incrementStat('errorsEncountered');
        this.logger.error('Message dispatch failed:', err);
      });
    });

    this.listening = true;
    await this.events.dispatch('ready', { api: this.api });
    this.logger.info('Facebook connection is active.');
    return this.api;
  }

  async disconnect() {
    if (this.stopping) return;
    this.stopping = true;
    this.listening = false;
    this.state.setState('status', 'stopping');

    try {
      if (this.api?.logout) await new Promise(resolve => this.api.logout(() => resolve()));
    } catch (error) {
      this.logger.warn('Logout failed:', error.message);
    } finally {
      this.api = null;
      this.state.setState('status', 'offline');
    }
  }
}

module.exports = ConnectionManager;
