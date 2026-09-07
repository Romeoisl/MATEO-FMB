'use strict';

const path = require('path');
const Logger = require('./Logger');
const ConfigManager = require('./ConfigManager');
const StateManager = require('./StateManager');
const EventBus = require('./EventBus');
const JsonDatabase = require('./JsonDatabase');
const PermissionManager = require('./PermissionManager');
const CommandRegistry = require('./CommandRegistry');
const EventLoader = require('./EventLoader');
const ConnectionManager = require('./ConnectionManager');

class BotApp {
  constructor({ rootDir = process.cwd() } = {}) {
    this.rootDir = rootDir;
    this.logger = new Logger();
    this.config = new ConfigManager({ rootDir, logger: this.logger });
    this.state = new StateManager(this.config.all(), this.logger);
    this.events = new EventBus();
    this.db = new JsonDatabase({ rootDir, logger: this.logger });
    this.permissions = new PermissionManager(this.config);
    this.connection = new ConnectionManager({ config: this.config, state: this.state, events: this.events, logger: this.logger, rootDir });
    this.commands = new CommandRegistry({ commandsDir: path.join(rootDir, 'src', 'cmds'), config: this.config, db: this.db, permissions: this.permissions, logger: this.logger, state: this.state });
    this.eventLoader = new EventLoader({ eventsDir: path.join(rootDir, 'src', 'events'), bus: this.events, logger: this.logger, apiProvider: () => this.connection.api });
    this.startedAt = Date.now();
    this._shutdownBound = false;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return this;
    await this.db.init();
    this.commands.load();
    this.eventLoader.load();
    this.events.on('message', async ({ api, event }) => this.commands.execute(api, event));
    this.events.on('connection:error', error => this.logger.error('Connection error:', error));
    this._bindShutdownSignals();
    this._initialized = true;
    return this;
  }

  async start() { await this.init(); await this.connection.connect(); return this; }

  async shutdown(signal = 'manual') {
    this.logger.info(`Shutting down (${signal})...`);
    await this.connection.disconnect();
    this.state.setState('status', 'offline');
  }

  status() {
    const status = this.state.getStatus();
    return { ...status, botName: this.config.get('botName'), commands: this.commands.commands.size, connected: Boolean(this.connection.api), uptime: Date.now() - this.startedAt };
  }

  _bindShutdownSignals() {
    if (this._shutdownBound) return;
    this._shutdownBound = true;
    const shutdown = signal => this.shutdown(signal).then(() => process.exit(0)).catch(error => { this.logger.error('Shutdown failed:', error); process.exit(1); });
    process.once('SIGINT', () => shutdown('SIGINT'));
    process.once('SIGTERM', () => shutdown('SIGTERM'));
  }
}

module.exports = BotApp;
