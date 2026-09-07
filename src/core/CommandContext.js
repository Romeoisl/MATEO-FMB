'use strict';

class CommandContext {
  constructor({ api, message, args, command, db, config, permissions, logger, registry }) {
    this.api = api;
    this.message = message;
    this.args = args;
    this.command = command;
    this.db = db;
    this.config = config;
    this.permissions = permissions;
    this.logger = logger;
    this.registry = registry;
    this.user = null;
    this.group = null;
  }

  get userID() { return this.message?.senderID; }
  get threadID() { return this.message?.threadID; }
  get messageID() { return this.message?.messageID; }
  get prefix() { return this.config.get('prefix', '/'); }

  reply(text, ...extra) { return this.api.sendMessage(text, this.threadID, ...extra); }
  send(text, ...extra) { return this.reply(text, ...extra); }

  react(reaction) {
    if (!this.messageID || typeof this.api.setMessageReaction !== 'function') return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.api.setMessageReaction(reaction, this.messageID, error => error ? reject(error) : resolve());
    });
  }

  permissionLevel() { return this.permissions.levelFor(this.userID, this.threadID); }
  hasRole(level) { return this.permissions.hasLevel(this.userID, this.threadID, level); }
  isOwner() { return this.permissions.isOwner(this.userID); }
  isAdmin() { return this.hasRole(2); }
  isGroupAdmin() { return this.hasRole(1); }
}

module.exports = CommandContext;
