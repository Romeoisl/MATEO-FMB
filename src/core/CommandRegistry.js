'use strict';

const fs = require('fs');
const path = require('path');
const CommandContext = require('./CommandContext');

class CommandRegistry {
  constructor({ commandsDir, config, db, permissions, logger, state, services = {} }) {
    Object.assign(this, { commandsDir, config, db, permissions, logger, state, services });
    this.commands = new Map();
    this.aliases = new Map();
    this.cooldowns = new Map();
  }

  load() {
    if (!fs.existsSync(this.commandsDir)) return this;
    this.commands.clear();
    this.aliases.clear();
    for (const file of fs.readdirSync(this.commandsDir).filter(f => f.endsWith('.js'))) {
      const fullPath = path.join(this.commandsDir, file);
      delete require.cache[require.resolve(fullPath)];
      try {
        const command = require(fullPath);
        if (!command || typeof command !== 'object' || !command.name || typeof command.execute !== 'function') {
          this.logger.warn(`Skipping invalid command module: ${file}`);
          continue;
        }
        const normalized = { aliases: [], category: 'general', description: 'No description provided.', usage: null, role: 0, cooldown: 0, ...command };
        normalized.name = String(normalized.name).toLowerCase();
        normalized.aliases = (normalized.aliases || []).map(String).map(v => v.toLowerCase());
        this.commands.set(normalized.name, normalized);
        for (const alias of normalized.aliases) this.aliases.set(alias, normalized.name);
      } catch (error) { this.logger.error(`Failed to load command ${file}:`, error); }
    }
    this.logger.info(`Loaded ${this.commands.size} command(s).`);
    return this;
  }

  get(name) { const key = String(name || '').toLowerCase(); return this.commands.get(key) || this.commands.get(this.aliases.get(key)); }
  list() { return [...this.commands.values()]; }
  _cooldownKey(c, u, t) { return `${c.name}:${t || 'global'}:${u || 'unknown'}`; }
  _remainingCooldown(c, u, t) { const s = Number(c.cooldown || 0); return s <= 0 ? 0 : Math.max(0, (this.cooldowns.get(this._cooldownKey(c, u, t)) || 0) - Date.now()); }
  _setCooldown(c, u, t) { const s = Number(c.cooldown || 0); if (s > 0) this.cooldowns.set(this._cooldownKey(c, u, t), Date.now() + s * 1000); }
  _prefixFor(threadID) { return this.db.getGroup?.(threadID)?.prefix || this.config.get('prefix', '/'); }

  async execute(api, message) {
    const prefix = this._prefixFor(message?.threadID);
    const body = String(message?.body || '').trim();
    if (!body.startsWith(prefix)) return false;
    const tokens = body.slice(prefix.length).trim().split(/\s+/);
    const name = tokens.shift()?.toLowerCase();
    if (!name) return false;
    const command = this.get(name);
    if (!command) return false;
    const group = this.db.getGroup?.(message.threadID);
    if (group && group.enabled === false && command.name !== 'start') {
      await api.sendMessage(`MATEO-FMB is disabled here. Ask a bot admin to use ${prefix}start.`, message.threadID);
      return true;
    }
    if (!this.permissions.hasLevel(message.senderID, message.threadID, Number(command.role || 0))) {
      await api.sendMessage('You do not have permission to use this command.', message.threadID);
      return true;
    }
    const remaining = this._remainingCooldown(command, message.senderID, message.threadID);
    if (remaining > 0) { await api.sendMessage(`Please wait ${Math.ceil(remaining / 1000)}s before using this command again.`, message.threadID); return true; }
    this._setCooldown(command, message.senderID, message.threadID);
    const ctx = new CommandContext({ api, message, args: tokens, command, db: this.db, config: this.config, permissions: this.permissions, logger: this.logger, registry: this, services: this.services });
    ctx.group = group || this.services.groups?.get?.(message.threadID);
    ctx.user = await this.db.ensureUser?.(message.senderID, message.senderName || '');
    try {
      if (command.legacy === true || command.execute.length > 1) await command.execute(api, message, tokens, this.db, this.config.all(), (key, replacements = {}) => this._translate(key, replacements), () => {}, () => {});
      else await command.execute(ctx);
      if (ctx.user) { ctx.user.commandsUsed = (ctx.user.commandsUsed || 0) + 1; await this.db.write(); }
      this.state?.incrementStat('commandsExecuted');
      return true;
    } catch (error) {
      this.state?.incrementStat('errorsEncountered');
      this.logger.error(`Command ${command.name} failed:`, error);
      await api.sendMessage('Something went wrong while executing that command.', message.threadID);
      return true;
    }
  }

  _translate(key, replacements = {}) { let text = String(key); for (const [name, value] of Object.entries(replacements)) text = text.replace(new RegExp(`{{${name}}}`, 'g'), String(value)); return text; }
}

module.exports = CommandRegistry;
