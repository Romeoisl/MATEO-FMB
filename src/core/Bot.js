const path = require('path');
const Config = require('./Config');
const Logger = require('./Logger');
const EventBus = require('./EventBus');
const StateManager = require('./StateManager');
const AuthManager = require('./AuthManager');
const CommandRegistry = require('./CommandRegistry');
const CommandContext = require('./CommandContext');
const Permissions = require('./Permissions');
const Cooldown = require('./Cooldown');
const JSONAdapter = require('../database/JSONAdapter');
const { createUserObject, createGroupObject } = require('../database/schemas');

class Bot {
  constructor() {
    this.config = Config;
    this.logger = new Logger(this.config.toObject());
    this.eventBus = new EventBus(this.logger);
    this.stateManager = new StateManager(this.config.toObject(), this.logger);
    this.authManager = new AuthManager(this.config.toObject(), this.logger);
    this.permissions = new Permissions(this.config.toObject(), null);
    this.cooldown = new Cooldown();
    this.database = null;
    this.commandRegistry = new CommandRegistry(this.logger);
    this.api = null;
    this.isRunning = false;
  }

  async initialize() {
    try {
      this.logger.info('Initializing MATEO-FMB...');

      const errors = this.config.validate();
      if (errors.length > 0) {
        this.logger.error('Configuration validation failed:');
        errors.forEach(err => this.logger.error(`  - ${err}`));
        throw new Error('Invalid configuration');
      }

      this.logger.info('Connecting to database...');
      this.database = new JSONAdapter(this.config.toObject(), this.logger);
      await this.database.connect();

      this.permissions.database = this.database;

      this.logger.info('Authenticating with Facebook...');
      this.api = await this.authManager.authenticate();

      this.logger.info('Loading commands...');
      const commandsDir = path.join(process.cwd(), 'src', 'commands');
      await this.commandRegistry.loadFromDirectory(commandsDir);

      this.stateManager.setState('status', 'online');
      this.stateManager.setState('lastConnected', new Date());
      this.isRunning = true;

      this.logger.success('Bot initialized successfully!');
      this._setupMessageListener();

      await this.eventBus.emitAsync('bot:ready', this);
    } catch (err) {
      this.logger.error('Initialization failed:', err.message);
      throw err;
    }
  }

  _setupMessageListener() {
    if (!this.api) return;

    this.api.listen(async (err, event) => {
      if (err) {
        this.logger.error('Message listener error:', err);
        return;
      }

      if (!event) return;

      try {
        await this._handleEvent(event);
      } catch (err) {
        this.logger.error('Error handling event:', err.message);
        this.stateManager.setState('stats.errorsEncountered', 
          this.stateManager.getState('stats.errorsEncountered', 0) + 1
        );
      }
    });
  }

  async _handleEvent(event) {
    if (!event.body) return;

    this.stateManager.incrementStat('messagesHandled');

    const prefix = this.config.bot.prefix;
    if (!event.body.startsWith(prefix)) {
      await this.eventBus.emitAsync('message:received', event);
      return;
    }

    const args = event.body.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift();

    const command = this.commandRegistry.get(commandName);
    if (!command) {
      return;
    }

    try {
      const ctx = new CommandContext(
        this.config.toObject(),
        this.api,
        event,
        args,
        this.database,
        this.permissions,
        this.logger
      );

      await ctx.run();

      if (command.cooldown) {
        const cooldownKey = `${command.name}:${event.senderID}`;
        if (this.cooldown.has(cooldownKey)) {
          const remaining = this.cooldown.get(cooldownKey);
          ctx.reply(`⏱️ Command on cooldown. Try again in ${(remaining / 1000).toFixed(1)}s`);
          return;
        }
      }

      if (command.permission) {
        ctx.requirePermission(command.permission);
      }

      await this.commandRegistry.executeCommand(ctx, commandName);

      if (command.cooldown) {
        const cooldownKey = `${command.name}:${event.senderID}`;
        this.cooldown.set(cooldownKey, command.cooldown * 1000);
      }

      this.stateManager.incrementStat('commandsExecuted');
      await this.eventBus.emitAsync('command:executed', { command: commandName, user: event.senderID });
    } catch (err) {
      this.logger.error(`Command error [${commandName}]:`, err.message);
      
      try {
        this.api.sendMessage(
          `❌ Error: ${err.message}`,
          event.threadID
        );
      } catch (sendErr) {
        this.logger.error('Failed to send error message:', sendErr.message);
      }
    }
  }

  async shutdown() {
    try {
      this.logger.info('Shutting down bot...');
      this.isRunning = false;

      await this.eventBus.emitAsync('bot:shutdown');

      if (this.database) {
        await this.database.disconnect();
      }

      if (this.authManager) {
        await this.authManager.logout();
      }

      this.stateManager.setState('status', 'offline');
      this.logger.success('Bot shut down gracefully');
    } catch (err) {
      this.logger.error('Shutdown error:', err.message);
    }
  }

  getStatus() {
    return {
      running: this.isRunning,
      authenticated: this.authManager.isReady(),
      ...this.stateManager.getStatus(),
      commandsLoaded: this.commandRegistry.getAll().length,
      botID: this.authManager.getCurrentUserID(),
    };
  }
}

module.exports = Bot;
