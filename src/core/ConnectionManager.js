'use strict';

const fs = require('fs');
const path = require('path');
const { login } = require('ws3-fca');

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
    this.reconnectTimer = null;
    this.reconnectDelay = 5000;
  }

  _appStatePath() {
    return path.resolve(this.rootDir, process.env.MATEO_APPSTATE_FILE || 'appstate.json');
  }

  _loadAppState() {
    const file = this._appStatePath();
    if (!fs.existsSync(file)) throw new Error(`Missing AppState: ${file}`);
    const raw = fs.readFileSync(file, 'utf8').trim();
    if (!raw) throw new Error(`AppState file is empty: ${file}`);
    try { return JSON.parse(raw); } catch (error) { throw new Error(`Invalid AppState JSON: ${error.message}`); }
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
        this.reconnectDelay = 5000;
        resolve();
      });
    });

    this.api.listenMqtt((error, event) => {
      if (error) {
        this.state.incrementStat('errorsEncountered');
        this.events.dispatch('connection:error', error).catch(err => this.logger.error(err));
        this._scheduleReconnect();
        return;
      }

      this.state.incrementStat('messagesHandled');
      const payload = { api: this.api, event };
      const eventTypes = new Set(['message']);
      if (event?.type) eventTypes.add(event.type);
      if (event?.logMessageType) eventTypes.add(event.logMessageType);

      Promise.all([...eventTypes].map(type => this.events.dispatch(type, payload)))
        .catch(err => {
          this.state.incrementStat('errorsEncountered');
          this.logger.error('Event dispatch failed:', err);
        });
    });

    this.listening = true;
    await this.events.dispatch('ready', { api: this.api });
    this.logger.info('Facebook connection is active.');
    return this.api;
  }

  _scheduleReconnect() {
    if (this.stopping || this.reconnectTimer) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 120000);
    this.state.setState('status', 'reconnecting');
    this.logger.warn(`Connection lost; retrying in ${Math.round(delay / 1000)}s.`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.disconnect();
        await this.connect();
      } catch (error) {
        this.logger.error('Reconnect failed:', error.message);
        this._scheduleReconnect();
      }
    }, delay);
  }

  async disconnect() {
    this.stopping = true;
    this.listening = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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
