const login = require('ws3-fca');
const fs = require('fs');
const path = require('path');

class AuthManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.api = null;
    this.isAuthenticated = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 3000;
  }

  async authenticate() {
    try {
      const appstate = this.config.facebook.appstate;

      if (!Array.isArray(appstate) || appstate.length === 0) {
        throw new Error('FACEBOOK_APPSTATE is empty or invalid');
      }

      this.logger.info('Attempting Facebook login...');

      const loginOptions = {
        appState: appstate,
        selfListen: false,
        updatePresence: true,
        online: true,
        autoMarkDelivery: false,
        autoMarkRead: false,
        ...this.config.get('FCA_OPTIONS', {}),
      };

      this.api = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Login timeout'));
        }, this.config.advanced.connectionTimeout);

        login(loginOptions, (err, api) => {
          clearTimeout(timeout);
          if (err) reject(err);
          else resolve(api);
        });
      });

      this.isAuthenticated = true;
      this.retryCount = 0;

      const currentUserID = this.api.getCurrentUserID();
      this.logger.success(`Authenticated successfully. User ID: ${currentUserID}`);

      this._setupListeners();
      return this.api;
    } catch (err) {
      this.logger.error('Authentication failed:', err.message);
      return this._handleAuthError(err);
    }
  }

  async _handleAuthError(err) {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = this.retryDelay * this.retryCount;
      this.logger.warn(`Retrying authentication (${this.retryCount}/${this.maxRetries}) in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.authenticate();
    }

    throw new Error(`Authentication failed after ${this.maxRetries} attempts: ${err.message}`);
  }

  _setupListeners() {
    if (!this.api) return;

    this.api.listen((err, event) => {
      if (err) {
        this.logger.error('Listener error:', err);
        this.isAuthenticated = false;
      }
    });

    this.logger.info('API listeners initialized');
  }

  getAPI() {
    if (!this.isAuthenticated || !this.api) {
      throw new Error('Bot is not authenticated');
    }
    return this.api;
  }

  getCurrentUserID() {
    if (!this.api) return null;
    try {
      return this.api.getCurrentUserID();
    } catch (err) {
      this.logger.error('Failed to get current user ID:', err.message);
      return null;
    }
  }

  async logout() {
    try {
      if (this.api) {
        this.api.logout((err) => {
          if (err) {
            this.logger.error('Logout error:', err.message);
          } else {
            this.logger.info('Logged out successfully');
          }
        });
      }
      this.isAuthenticated = false;
      this.api = null;
    } catch (err) {
      this.logger.error('Logout failed:', err.message);
    }
  }

  isReady() {
    return this.isAuthenticated && this.api !== null;
  }
}

module.exports = AuthManager;
