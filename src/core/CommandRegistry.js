'use strict';

const fs = require('fs');
const path = require('path');
const CommandContext = require('./CommandContext');

class CommandRegistry {
  constructor({ commandsDir, config, db, permissions, logger, state }) {
    this.commandsDir = commandsDir;
    this.config = config;
    this.db = db;
    this.permissions = permissions;
    this.logger = logger;
    this.state = state;
    this.commands = new Map();
    this.aliases = new Map();
  }

  load() {
    if (!fs.existsSync(this.commandsDir)) return this;
    const files = fs.readdirSync(this.commandsDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
      const fullPath = path.join(this.commandsDir, file);
      delete require.cache[require.resolve(fullPath)];
      try {
        const command = require(fullPath);
        if (!command || typeof command !== 'object' || !command.name || typeof command.execute !== 'function') {
          this.logger.warn(`Skipping invalid command module: ${file}`);
          continue;
        }

        const normalized = {
          aliases: [], category: 'general', description: 'No description provided.',
          usage: null, role: 0, cooldown: 0, ...command,
        };
        normalized.name = String(normalized.name).toLowerCase();
        normalized.aliases = (normalized.aliases || []).map(alias => String(alias).toLowerCase());
        this.commands.set(normalized.name, normalized);
        for (const alias of normalized.aliases) this.aliases.set(alias, normalized.name);
      } catch (error) {
        this.logger.error(`Failed to load command ${file}:`, error);
      }
    }

    this.logger.info(`Loaded ${this.commands.size} command(s).`);
    return this;
  }

  get(name) {
    const key = String(name || '').toLowerCase();
    return this.commands.get(key) || this.commands.get(this.aliases.get(key));
  }

  list() { return [...this.commands.values()]; }

  async execute(api, message) {
    const prefix = this.config.get('prefix', '/');
    const body = String(message?.body || '').trim();
    if (!body.startsWith(prefix)) return false;

    const tokens = body.slice(prefix.length).trim().split(/\s+/);
    const name = tokens.shift()?.toLowerCase();
    if (!name) return false;

    const command = this.get(name);
    if (!command) return false;

    const requiredRole = Number(command.role || 0);
    if (!this.permissions.hasLevel(message.senderID, message.threadID, requiredRole)) {
      await api.sendMessage('You do not have permission to use this command.', message.threadID);
      return true;
    }

    const ctx = new CommandContext({
      api, message, args: tokens, command, db: this.db,
      config: this.config, permissions: this.permissions,
      logger: this.logger, registry: this,
    });

    try {
      if (command.legacy === true || command.execute.length > 1) {
        await command.execute(
          api,
          message,
          tokens,
          this.db,
          this.config.all(),
          (key, replacements = {}) => this._translate(key, replacements),
          () => {},
          () => {}
        );
      } else {
        await command.execute(ctx);
      }
      this.state?.incrementStat('commandsExecuted');
      return true;
    } catch (error) {
      this.state?.incrementStat('errorsEncountered');
      this.logger.error(`Command ${command.name} failed:`, error);
      await api.sendMessage('Something went wrong while executing that command.', message.threadID);
      return true;
    }
  }

  _translate(key, replacements = {}) {
    let text = String(key);
    for (const [name, value] of Object.entries(replacements)) {
      text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
    }
    return text;
  }
}

module.exports = CommandRegistry;
